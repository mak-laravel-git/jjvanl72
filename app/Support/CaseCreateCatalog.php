<?php

namespace App\Support;

use App\Enums\ParameterType;
use App\Models\DentalProduct;
use App\Models\DentalProductGroup;
use App\Models\Parameter;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Catalogue payload for portal case creation.
 * Always DB-backed — no static product catalog fallback.
 */
class CaseCreateCatalog
{
    /**
     * Bridge rule: a bridge needs ≥1 retainer and ≥1 explicitly prescribed
     * pontic. Mirrors resources/js/pages/backend/User/create-case/helpers.ts
     * (BRIDGE_RETAINER_PRODUCT_KEYS / PONTIC_PRODUCT_KEY).
     *
     * @var list<string>
     */
    public const BRIDGE_RETAINER_PRODUCT_KEYS = ['crown', 'implantCrown'];

    public const PONTIC_PRODUCT_KEY = 'pontic';

    /**
     * @var list<string>
     */
    private const COLOR_PALETTE = [
        '#aa00b8',
        '#c31d4c',
        '#84001e',
        '#2e6513',
        '#155ec4',
        '#2d91a4',
        '#397d70',
        '#485a80',
        '#61b9c4',
        '#b8a373',
        '#b66d67',
        '#21c287',
        '#21a0c2',
        '#0e7a8c',
        '#05556b',
        '#ffae1a',
        '#ef343f',
        '#f36800',
    ];

    /**
     * @return array<string, mixed>
     */
    public static function forPortal(): array
    {
        return self::fromDatabase();
    }

    /**
     * @return array<string, mixed>
     */
    public static function fromDatabase(): array
    {
        $groups = DentalProductGroup::query()
            ->where('is_active', true)
            ->with([
                'products' => function ($query): void {
                    $query->where('is_active', true)
                        ->orderBy('sort_order')
                        ->orderBy('name')
                        ->with([
                            'materials' => function ($materials): void {
                                $materials->where('is_active', true)
                                    ->orderByPivot('sort_order')
                                    ->orderBy('sort_order')
                                    ->orderBy('name');
                            },
                            'parameters' => function ($parameters): void {
                                $parameters->orderBy('name')
                                    ->with([
                                        'group' => function ($group): void {
                                            $group->where('is_active', true);
                                        },
                                        'options' => function ($options): void {
                                            $options->orderBy('id');
                                        },
                                    ]);
                            },
                        ]);
                },
            ])
            ->orderByRaw('sort_order is null')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $productGroups = [];
        $products = [];
        $materialsByProduct = [];
        $materialsByGroup = [];
        $referencePrefixes = [];
        $colorIndex = 0;
        $base = self::static();

        foreach ($groups as $group) {
            if ($group->products->isEmpty()) {
                continue;
            }

            $groupId = $group->code
                ? Str::slug((string) $group->code)
                : 'group-'.$group->id;
            $productKeys = [];
            $groupMaterials = [];
            $seenMaterialNames = [];

            foreach ($group->products as $product) {
                $key = self::productKey($product);
                $productKeys[] = $key;
                $color = self::COLOR_PALETTE[$colorIndex % count(self::COLOR_PALETTE)];
                $colorIndex++;

                $materials = [];

                foreach ($product->materials as $material) {
                    $row = [
                        'id' => $material->id,
                        'name' => $material->name,
                        'colors' => ['#e8e8e8', '#f5f5f5'],
                    ];
                    $materials[] = $row;

                    if (! isset($seenMaterialNames[$material->name])) {
                        $seenMaterialNames[$material->name] = true;
                        $groupMaterials[] = $row;
                    }
                }

                $materialsByProduct[$key] = $materials;
                $staticProduct = $base['products'][$key] ?? null;

                $products[$key] = [
                    'key' => $key,
                    'label' => $product->name,
                    'color' => is_array($staticProduct) && isset($staticProduct['color'])
                        ? $staticProduct['color']
                        : $color,
                    'flow' => is_array($staticProduct) && isset($staticProduct['flow'])
                        ? $staticProduct['flow']
                        : 'crown',
                    'mode' => is_array($staticProduct) && isset($staticProduct['mode'])
                        ? $staticProduct['mode']
                        : 'teeth',
                    'quantity' => is_array($staticProduct) && isset($staticProduct['quantity'])
                        ? $staticProduct['quantity']
                        : 'teeth',
                    'protocol' => is_array($staticProduct) && array_key_exists('protocol', $staticProduct)
                        ? $staticProduct['protocol']
                        : 'crown',
                    'price' => is_array($staticProduct) && isset($staticProduct['price'])
                        ? $staticProduct['price']
                        : 0,
                    'parameters' => self::mapParameters($product->parameters),
                ];
                $referencePrefixes[$key] = $base['referencePrefixes'][$key] ?? 'SC';
            }

            $productGroups[] = [
                'id' => $groupId,
                'title' => $group->name,
                'productKeys' => $productKeys,
            ];
            $materialsByGroup[$group->name] = $groupMaterials;
        }

        $packagePrices = app(PackagePriceResolver::class)->catalogRows();
        $pricing = [
            'approval' => 0,
            'printPerUnit' => 0,
            'millPerUnit' => 0,
            'models' => 0,
            'modelDesign' => 0,
            'modelDesignPrint' => 0,
        ];

        if ($productGroups === []) {
            return [
                'source' => 'database',
                'productGroups' => [],
                'products' => [],
                'materialsByProduct' => [],
                'materialsByGroup' => [],
                'protocols' => $base['protocols'],
                'shades' => $base['shades'],
                'referencePrefixes' => [],
                'pricing' => $pricing,
                'packagePrices' => $packagePrices,
            ];
        }

        return [
            'source' => 'database',
            'productGroups' => $productGroups,
            'products' => $products,
            'materialsByProduct' => $materialsByProduct,
            'materialsByGroup' => $materialsByGroup,
            'protocols' => $base['protocols'],
            'shades' => $base['shades'],
            'referencePrefixes' => $referencePrefixes,
            'pricing' => $pricing,
            'packagePrices' => $packagePrices,
        ];
    }

    /**
     * @return array{
     *     productGroups: list<array{id: string, title: string, productKeys: list<string>}>,
     *     products: array<string, array{
     *         key: string,
     *         label: string,
     *         color: string,
     *         flow: string,
     *         mode: string,
     *         quantity: string,
     *         protocol: string|null,
     *         price: int|float
     *     }>,
     *     materialsByGroup: array<string, list<array{name: string, colors: list<string>}>>,
     *     materialsByProduct: array<string, list<array{name: string, colors: list<string>}>>,
     *     protocols: array<string, list<array{id: string, label: string, required: bool, accept: string}>>,
     *     shades: list<string>,
     *     referencePrefixes: array<string, string>,
     *     pricing: array{
     *         approval: int|float,
     *         printPerUnit: int|float,
     *         millPerUnit: int|float,
     *         models: int|float,
     *         modelDesign: int|float,
     *         modelDesignPrint: int|float
     *     }
     * }
     */
    public static function static(): array
    {
        return [
            'productGroups' => [
                ['id' => 'crown-bridge', 'title' => 'Crown and Bridge', 'productKeys' => ['crown', 'implantCrown', 'pontic']],
                ['id' => 'inlays-onlays-veneers', 'title' => 'Inlays, Onlays and Veneers', 'productKeys' => ['inlay', 'onlay', 'veneer']],
                ['id' => 'full-arch', 'title' => 'Full Arch and Implant Retained', 'productKeys' => ['allOnX', 'fullDenture', 'biteplane']],
                ['id' => 'partial-dentures', 'title' => 'Partial Dentures', 'productKeys' => ['castPartial', 'acrylicPartial']],
                ['id' => 'diagnostics', 'title' => 'Diagnostics', 'productKeys' => ['diagnosticWaxup', 'simpleGuide', 'partialGuide', 'fullGuide']],
                ['id' => 'residual', 'title' => 'Residual Dentition', 'productKeys' => ['adjacent', 'missing', 'antagonist']],
            ],
            'products' => [
                'crown' => self::product('crown', 'Crown / Retainer', '#aa00b8', 'crown', 'teeth', 'teeth', 'crown', 35),
                'implantCrown' => self::product('implantCrown', 'Implant Crown', '#c31d4c', 'implant', 'teeth', 'teeth', 'crown', 48),
                'pontic' => self::product('pontic', 'Pontic', '#84001e', 'crown', 'teeth', 'teeth', 'crown', 31),
                'inlay' => self::product('inlay', 'Inlay', '#2e6513', 'restorative', 'teeth', 'teeth', 'crown', 28),
                'onlay' => self::product('onlay', 'Onlay', '#155ec4', 'restorative', 'teeth', 'teeth', 'crown', 29),
                'veneer' => self::product('veneer', 'Veneer', '#2d91a4', 'restorative', 'teeth', 'teeth', 'crown', 32),
                'allOnX' => self::product('allOnX', 'All on X', '#397d70', 'implant', 'arch', 'one', 'crown', 285),
                'biteplane' => self::product('biteplane', 'Bite Splint', '#485a80', 'biteplane', 'arch', 'one', 'biteplane', 79),
                'fullDenture' => self::product('fullDenture', 'Full Denture', '#61b9c4', 'denture', 'arch', 'one', 'denture', 175),
                'castPartial' => self::product('castPartial', 'Cast Partial Denture', '#b8a373', 'partial', 'partial', 'one', 'partial', 145),
                'acrylicPartial' => self::product('acrylicPartial', 'Acrylic Partial Denture', '#b66d67', 'partial', 'partial', 'one', 'partial', 115),
                'diagnosticWaxup' => self::product('diagnosticWaxup', 'Diagnostic Waxup', '#21c287', 'restorative', 'teeth', 'teeth', 'crown', 22),
                'simpleGuide' => self::product('simpleGuide', 'Simple Surgical Guide', '#21a0c2', 'restorative', 'arch', 'one', 'crown', 55),
                'partialGuide' => self::product('partialGuide', 'Partially Guided Surgical Guide', '#0e7a8c', 'restorative', 'arch', 'one', 'crown', 85),
                'fullGuide' => self::product('fullGuide', 'Fully Guided Surgical Guide', '#05556b', 'restorative', 'arch', 'one', 'crown', 120),
                'adjacent' => self::product('adjacent', 'Adjacent Tooth', '#ffae1a', 'marker', 'teeth', 'teeth', null, 0),
                'missing' => self::product('missing', 'Missing Tooth', '#ef343f', 'marker', 'teeth', 'teeth', null, 0),
                'antagonist' => self::product('antagonist', 'Antagonist', '#f36800', 'marker', 'teeth', 'teeth', null, 0),
            ],
            'materialsByGroup' => [
                'Crown and Bridge' => self::materials([
                    'PFM' => ['#b0b8b0', '#e0e8e0'],
                    'Zirconia' => ['#e6e9e9', '#f6f6f6'],
                    'Lithium Disilicate' => ['#e8dfd0', '#f5f0e8'],
                    'PMMA' => ['#e8d3a6', '#bfc9d9'],
                ]),
                'Inlays, Onlays and Veneers' => self::materials([
                    'Emax' => ['#f0ece0', '#fffdf5'],
                    'Treated Zirconia' => ['#d8dfe0', '#eef2f1'],
                ]),
                'Full Arch and Implant Retained' => self::materials([
                    'Milled Acrylic/PMMA' => ['#eadab4', '#d4b57e'],
                    'High Impact Printed' => ['#d6b889', '#f0dfc7'],
                    'Acrylic over CrCo Frame' => ['#c8b890', '#a89470'],
                    'Zirconia on Ti Abutments' => ['#9092a4', '#dadbe3'],
                    'Acrylic Wrapped Ti Bar' => ['#a5a8b8', '#d5d8e5'],
                    'Zirconia over Ti Bar' => ['#e0e4e8', '#f0f4f8'],
                    'Acrylic over Ti Bar' => ['#c8cad4', '#e4e6ee'],
                ]),
                'Partial Dentures' => self::materials([
                    'Acrylic/PMMA' => ['#e8d3a6', '#bfc9d9'],
                    'CrCo Frame' => ['#999aa7', '#dedee1'],
                    'Titanium Frame' => ['#8890a0', '#d0d4dc'],
                ]),
                'Diagnostics' => self::materials([
                    'Printed Clear' => ['#e8f4f8', '#c8e4f0'],
                    'Milled PMMA' => ['#ead8b4', '#d6b57e'],
                ]),
                'Residual Dentition' => [],
            ],
            'materialsByProduct' => [
                'implantCrown' => self::materials([
                    'Zirconia' => ['#e6e9e9', '#f6f6f6'],
                    'PMMA' => ['#e8d3a6', '#bfc9d9'],
                ]),
                'allOnX' => [],
                'fullDenture' => self::materials([
                    'Milled Acrylic/PMMA' => ['#eadab4', '#d4b57e'],
                    'High Impact Printed' => ['#d6b889', '#f0dfc7'],
                    'Acrylic over CrCo Frame' => ['#c8b890', '#a89470'],
                ]),
                'biteplane' => self::materials([
                    'Milled Acrylic/PMMA' => ['#eadab4', '#d4b57e'],
                    'Thermoplastic Printed' => ['#d6b889', '#f0dfc7'],
                ]),
                'castPartial' => self::materials([
                    'CrCo Frame' => ['#999aa7', '#dedee1'],
                    'Titanium Frame' => ['#8890a0', '#d0d4dc'],
                ]),
                'acrylicPartial' => self::materials([
                    'Acrylic/PMMA' => ['#e8d3a6', '#bfc9d9'],
                ]),
                'diagnosticWaxup' => [],
                'simpleGuide' => self::materials([
                    'Printed Clear' => ['#e8f4f8', '#c8e4f0'],
                    'Clear Milled PMMA' => ['#ead8b4', '#d6b57e'],
                ]),
                'partialGuide' => self::materials([
                    'Printed Clear' => ['#e8f4f8', '#c8e4f0'],
                    'Clear Milled PMMA' => ['#ead8b4', '#d6b57e'],
                ]),
                'fullGuide' => self::materials([
                    'Printed Clear' => ['#e8f4f8', '#c8e4f0'],
                    'Clear Milled PMMA' => ['#ead8b4', '#d6b57e'],
                ]),
            ],
            'protocols' => [
                'crown' => [
                    self::upload('upperArch', 'Upper Arch', true, '.stl,.obj,.ply,.dcm,.dicom'),
                    self::upload('lowerArch', 'Lower Arch', true, '.stl,.obj,.ply,.dcm,.dicom'),
                    self::upload('biteScan', 'Bite Scan', true, '.stl,.obj,.ply,.dcm,.dicom'),
                    self::upload('studyModel', 'Study Model Scan', false, '.stl,.obj,.ply'),
                    self::upload('frontSmile', 'Front Smile Photo', false, 'image/*'),
                    self::upload('leftSmile', 'Left Smile Photo', false, 'image/*'),
                    self::upload('rightSmile', 'Right Smile Photo', false, 'image/*'),
                    self::upload('frontRetracted', 'Front Retracted Photo', false, 'image/*'),
                    self::upload('faceScan', 'Face Scan', false, '.stl,.obj,.ply,.zip'),
                ],
                'denture' => [
                    self::upload('upperArch', 'Upper Arch', true, '.stl,.obj,.ply,.dcm,.dicom'),
                    self::upload('lowerArch', 'Lower Arch', true, '.stl,.obj,.ply,.dcm,.dicom'),
                    self::upload('biteScan', 'Bite Scan', true, '.stl,.obj,.ply,.dcm,.dicom'),
                    self::upload('preOpScan', 'Pre-Op Scan', false, '.stl,.obj,.ply'),
                    self::upload('frontSmile', 'Front Smile Photo', false, 'image/*'),
                    self::upload('leftSmile', 'Left Smile Photo', false, 'image/*'),
                    self::upload('rightSmile', 'Right Smile Photo', false, 'image/*'),
                    self::upload('frontRetracted', 'Front Retracted Photo', false, 'image/*'),
                    self::upload('faceScanRetractors', 'Face Scan With Retractors', false, '.stl,.obj,.ply,.zip'),
                    self::upload('faceScanNoRetractors', 'Face Scan Without Retractors', false, '.stl,.obj,.ply,.zip'),
                ],
                'biteplane' => [
                    self::upload('upperArch', 'Upper Arch', true, '.stl,.obj,.ply,.dcm,.dicom'),
                    self::upload('lowerArch', 'Lower Arch', true, '.stl,.obj,.ply,.dcm,.dicom'),
                    self::upload('biteScan', 'Bite Scan', true, '.stl,.obj,.ply,.dcm,.dicom'),
                ],
                'partial' => [
                    self::upload('upperArch', 'Upper Arch', true, '.stl,.obj,.ply,.dcm,.dicom'),
                    self::upload('lowerArch', 'Lower Arch', true, '.stl,.obj,.ply,.dcm,.dicom'),
                    self::upload('biteScan', 'Bite Scan', true, '.stl,.obj,.ply,.dcm,.dicom'),
                    self::upload('partialPrescription', 'Partial Design / Prescription', false, '.pdf,image/*'),
                ],
            ],
            'shades' => ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4', 'BL1', 'BL2', 'BL3', 'BL4'],
            'referencePrefixes' => [
                'crown' => 'SB',
                'implantCrown' => 'SB',
                'pontic' => 'SB',
                'inlay' => 'SG',
                'onlay' => 'SG',
                'veneer' => 'SG',
                'allOnX' => 'SW',
                'fullDenture' => 'SW',
                'biteplane' => 'SW',
                'castPartial' => 'SK',
                'acrylicPartial' => 'SK',
                'diagnosticWaxup' => 'SC',
                'simpleGuide' => 'SC',
                'partialGuide' => 'SC',
                'fullGuide' => 'SC',
            ],
            'pricing' => [
                'approval' => 0,
                'printPerUnit' => 0,
                'millPerUnit' => 0,
                'models' => 0,
                'modelDesign' => 0,
                'modelDesignPrint' => 0,
            ],
            'packagePrices' => [],
        ];
    }

    /**
     * @param  Collection<int, Parameter>  $parameters
     * @return list<array{id: int, name: string, fieldName: string, type: string, materialId: int|null, groupId: int|null, groupName: string|null, groupSortOrder: int|null, options: list<array{label: string, value: string, color: string|null, imageUrl: string|null}>}>
     */
    private static function mapParameters($parameters): array
    {
        $sorted = $parameters
            ->sortBy([
                fn (Parameter $parameter): int => $parameter->group?->sort_order ?? PHP_INT_MAX,
                fn (Parameter $parameter): string => $parameter->name,
            ])
            ->values();

        $rows = [];

        foreach ($sorted as $parameter) {
            $type = $parameter->type instanceof ParameterType
                ? $parameter->type->value
                : (string) $parameter->type;

            $options = [];

            foreach ($parameter->options as $option) {
                $options[] = [
                    'label' => $option->label,
                    'value' => $option->value !== null && $option->value !== ''
                        ? (string) $option->value
                        : $option->label,
                    'color' => $option->color,
                    'imageUrl' => $option->image_url,
                ];
            }

            $group = $parameter->group;

            $rows[] = [
                'id' => $parameter->id,
                'name' => $parameter->name,
                'fieldName' => $parameter->field_name,
                'type' => $type,
                'materialId' => $parameter->material_id,
                'groupId' => $group?->id,
                'groupName' => $group?->name,
                'groupSortOrder' => $group?->sort_order,
                'options' => $options,
            ];
        }

        return $rows;
    }

    public static function productKey(DentalProduct $product): string
    {
        $code = trim((string) $product->code);

        if ($code === '') {
            return 'product-'.$product->id;
        }

        // Preserve intentional camelCase codes (e.g. implantCrown).
        if (preg_match('/[a-z]/', $code) === 1 && preg_match('/[A-Z]/', $code) === 1) {
            return $code;
        }

        return Str::of($code)->lower()->replace(' ', '-')->toString();
    }

    public static function findProductByKey(string $key): ?DentalProduct
    {
        $products = DentalProduct::query()
            ->where('is_active', true)
            ->get();

        foreach ($products as $product) {
            if (self::productKey($product) === $key) {
                return $product;
            }
        }

        return null;
    }

    /**
     * @return array{key: string, label: string, color: string, flow: string, mode: string, quantity: string, protocol: string|null, price: int|float, parameters: list<mixed>}
     */
    private static function product(
        string $key,
        string $label,
        string $color,
        string $flow,
        string $mode,
        string $quantity,
        ?string $protocol,
        int|float $price,
    ): array {
        return [
            'key' => $key,
            'label' => $label,
            'color' => $color,
            'flow' => $flow,
            'mode' => $mode,
            'quantity' => $quantity,
            'protocol' => $protocol,
            'price' => $price,
            'parameters' => [],
        ];
    }

    /**
     * @param  array<string, list<string>>  $map
     * @return list<array{name: string, colors: list<string>}>
     */
    private static function materials(array $map): array
    {
        $rows = [];

        foreach ($map as $name => $colors) {
            $rows[] = [
                'name' => $name,
                'colors' => $colors,
            ];
        }

        return $rows;
    }

    /**
     * Default Digital Files slots for every new case (Upper / Lower / Bite).
     *
     * @return list<array{code: string, label: string}>
     */
    public static function defaultFileSlots(): array
    {
        return [
            ['code' => 'upperArch', 'label' => 'Upper Arch'],
            ['code' => 'lowerArch', 'label' => 'Lower Arch'],
            ['code' => 'biteScan', 'label' => 'Bite Scan'],
        ];
    }

    /**
     * @return array{id: string, label: string, required: bool, accept: string}
     */
    private static function upload(string $id, string $label, bool $required, string $accept): array
    {
        return [
            'id' => $id,
            'label' => $label,
            'required' => $required,
            'accept' => $accept,
        ];
    }
}
