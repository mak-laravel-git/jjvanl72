<?php

namespace Database\Seeders;

use App\Enums\ParameterType;
use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use App\Models\Parameter;
use App\Models\ParameterGroup;
use App\Models\ParameterOption;
use App\Support\CaseCreateCatalog;
use Illuminate\Database\Seeder;

class DentalCaseCreateParameterSeeder extends Seeder
{
    /**
     * @var list<string>
     */
    private const OPTION_COLORS = [
        '#BD1D49',
        '#0A8730',
        '#E45D00',
        '#579FCF',
        '#A9619E',
        '#777465',
    ];

    /**
     * Contour options shared by Zirconia and Lithium Disilicate on Crown / Retainer.
     *
     * @var list<string>
     */
    private const STANDARD_CONTOUR_OPTIONS = [
        'Full Contour',
        'Buccal Cutback',
        'Full Cutback',
    ];

    /**
     * Contour options for PMMA on Crown / Retainer.
     *
     * @var list<string>
     */
    private const PMMA_CONTOUR_OPTIONS = [
        'Shell Temp',
        'Per Prep',
    ];

    /**
     * Seed case-create parameters and options from the HTML catalog flows.
     */
    public function run(): void
    {
        $catalogProducts = CaseCreateCatalog::static()['products'] ?? [];
        $templatesByFlow = $this->templatesByFlow();

        foreach (DentalProduct::query()->orderBy('id')->get() as $product) {
            $key = CaseCreateCatalog::productKey($product);
            $flow = $catalogProducts[$key]['flow'] ?? null;

            if (! is_string($flow) || $flow === '' || $flow === 'marker') {
                continue;
            }

            if ($key === 'crown') {
                $this->seedCrownRetainerParameters($product);

                continue;
            }

            if ($key === 'implantCrown') {
                $this->seedImplantCrownParameters($product);

                continue;
            }

            if ($key === 'pontic') {
                $this->seedPonticParameters($product);

                continue;
            }

            if ($key === 'allOnX') {
                $this->seedAllOnXParameters($product);

                continue;
            }

            if ($key === 'fullDenture') {
                $this->seedFullDentureParameters($product);

                continue;
            }

            if ($key === 'biteplane') {
                $this->seedBiteplaneParameters($product);

                continue;
            }

            if ($key === 'castPartial') {
                $this->seedCastPartialParameters($product);

                continue;
            }

            if ($key === 'acrylicPartial') {
                $this->seedAcrylicPartialParameters($product);

                continue;
            }

            if ($key === 'diagnosticWaxup') {
                $this->seedDiagnosticWaxupParameters($product);

                continue;
            }

            if ($key === 'simpleGuide') {
                $this->seedSimpleGuideParameters($product);

                continue;
            }

            if ($key === 'partialGuide' || $key === 'fullGuide') {
                $this->seedGuidedSurgicalGuideParameters($product);

                continue;
            }

            $templates = $templatesByFlow[$flow] ?? [];

            if ($templates === []) {
                continue;
            }

            foreach ($templates as $template) {
                $this->seedParameter($product, $template);
            }
        }
    }

    /**
     * All on X: contact-only — clear any seeded design parameters.
     */
    private function seedAllOnXParameters(DentalProduct $product): void
    {
        $product->parameters()->delete();
    }

    /**
     * Cast Partial Denture: trimmed framework / clasp / rests (same for every material).
     */
    private function seedCastPartialParameters(DentalProduct $product): void
    {
        $product->parameters()->delete();

        foreach ($this->castPartialTemplates() as $template) {
            $this->seedParameter($product, $template);
        }
    }

    /**
     * @return list<array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options?: list<string|array{label?: string, value?: string, image?: string|null}>,
     *     material_id?: int|null,
     *     group_sort_order?: int|null
     * }>
     */
    private function castPartialTemplates(): array
    {
        return [
            $this->option(
                'framework',
                'Framework Design',
                'Framework Design',
                'framework',
                [
                    'Horseshoe',
                    'Open Palate',
                    'Scandinavian',
                    'Palatal Strap',
                    'Lingual Bar',
                    'Lingual Plate',
                    'Custom Design',
                ],
                null,
                1,
            ),
            $this->option(
                'clasp',
                'Clasp',
                'Clasp',
                'clasp',
                [
                    'Akers Clasp',
                    'RPI Clasp',
                    'Ring Clasp',
                    'Embrasure Clasp',
                    'Wrought Wire Clasp',
                    'Covered Retention for Future Addition',
                ],
                null,
                2,
            ),
            $this->option(
                'rests',
                'Rests',
                'Rests',
                'rests',
                [
                    'Mesial Occlusal Rest',
                    'Distal Occlusal Rest',
                    'Lingual/Palatal Rest',
                ],
                null,
                3,
            ),
        ];
    }

    /**
     * Acrylic Partial Denture: clasp-only (same for every material).
     */
    private function seedAcrylicPartialParameters(DentalProduct $product): void
    {
        $product->parameters()->delete();

        foreach ($this->acrylicPartialTemplates() as $template) {
            $this->seedParameter($product, $template);
        }
    }

    /**
     * @return list<array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options?: list<string|array{label?: string, value?: string, image?: string|null}>,
     *     material_id?: int|null,
     *     group_sort_order?: int|null
     * }>
     */
    private function acrylicPartialTemplates(): array
    {
        return [
            $this->option(
                'clasp',
                'Clasp',
                'Clasp',
                'clasp',
                [
                    'Wrought Wire Clasp',
                    'Ball Clasp',
                    'Roach (J/Y) Clasp',
                ],
                null,
                1,
            ),
        ];
    }

    /**
     * Diagnostic Waxup: design / tooth / margin / needed (no materials).
     */
    private function seedDiagnosticWaxupParameters(DentalProduct $product): void
    {
        $product->parameters()->delete();

        foreach ($this->diagnosticWaxupTemplates() as $template) {
            $this->seedParameter($product, $template);
        }
    }

    /**
     * @return list<array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options?: list<string|array{label?: string, value?: string, image?: string|null}>,
     *     material_id?: int|null,
     *     group_sort_order?: int|null
     * }>
     */
    private function diagnosticWaxupTemplates(): array
    {
        return [
            $this->option(
                'design-style',
                'Design Style',
                'Design Style',
                'designStyle',
                [
                    [
                        'label' => 'Central Overlap',
                        'value' => 'Central Overlap',
                        'image' => 'images/full_denture/centerl-overlap.png',
                    ],
                    [
                        'label' => 'Straight',
                        'value' => 'Straight',
                        'image' => 'images/full_denture/straight.png',
                    ],
                    [
                        'label' => 'Shorter Laterals',
                        'value' => 'Shorter Laterals',
                        'image' => 'images/full_denture/shorter-laterals.png',
                    ],
                    [
                        'label' => 'Twisted Laterals',
                        'value' => 'Twisted Laterals',
                        'image' => 'images/full_denture/twisted-laterals.png',
                    ],
                ],
                null,
                1,
            ),
            $this->option(
                'tooth-shape',
                'Tooth Shape',
                'Tooth Shape',
                'toothShape',
                [
                    [
                        'label' => 'Square',
                        'value' => 'Square',
                        'image' => 'images/full_denture/square.png',
                    ],
                    [
                        'label' => 'Ovoid/Oval',
                        'value' => 'Ovoid/Oval',
                        'image' => 'images/full_denture/ovid-or-oval.png',
                    ],
                    [
                        'label' => 'Triangular',
                        'value' => 'Triangular',
                        'image' => 'images/full_denture/triangular.png',
                    ],
                ],
                null,
                2,
            ),
            $this->option(
                'margin-design',
                'Margin Design',
                'Margin Design',
                'marginDesign',
                [
                    'Follow existing margin',
                    'Idealize margin',
                ],
                null,
                3,
            ),
            $this->multiOption(
                'needed',
                'Needed',
                'Needed',
                'needed',
                [
                    'Pre-Opp Model',
                    'Printed Diagnostic Model',
                    'Rubber Stent',
                    'Essix style stent',
                    'Prep guide',
                    'Margin Adaptation guide',
                ],
                null,
                4,
            ),
        ];
    }

    /**
     * Simple Surgical Guide: occlusal slot + bone reduction (same for every material).
     */
    private function seedSimpleGuideParameters(DentalProduct $product): void
    {
        $product->parameters()->delete();

        foreach ($this->simpleGuideTemplates() as $template) {
            $this->seedParameter($product, $template);
        }
    }

    /**
     * @return list<array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options?: list<string|array{label?: string, value?: string, image?: string|null}>,
     *     material_id?: int|null,
     *     group_sort_order?: int|null
     * }>
     */
    private function simpleGuideTemplates(): array
    {
        return [
            $this->option(
                'occlusal-slot',
                'Occlusal slot',
                'Occlusal slot',
                'occlusalSlot',
                ['No', 'Yes'],
                null,
                1,
            ),
            $this->option(
                'bone-reduction-indication',
                'Bone reduction indication',
                'Bone reduction indication',
                'boneReductionIndication',
                ['No', 'Yes'],
                null,
                2,
            ),
        ];
    }

    /**
     * Partially / Fully Guided Surgical Guide: appliance design (+ nested planning fields).
     */
    private function seedGuidedSurgicalGuideParameters(DentalProduct $product): void
    {
        $product->parameters()->delete();

        foreach ($this->guidedSurgicalGuideTemplates() as $template) {
            $this->seedParameter($product, $template);
        }
    }

    /**
     * @return list<array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options?: list<string|array{label?: string, value?: string, image?: string|null}>,
     *     material_id?: int|null,
     *     group_sort_order?: int|null
     * }>
     */
    private function guidedSurgicalGuideTemplates(): array
    {
        return [
            $this->option(
                'appliance-design',
                'Appliance Design',
                'Appliance Design',
                'applianceDesign',
                [
                    'Guide only (Planning provided)',
                    'Planning + Guide',
                ],
                null,
                1,
            ),
            $this->input(
                'preferred-brand',
                'Preferred Brand',
                'Preferred Brand',
                'preferredBrand',
                null,
                2,
            ),
            $this->option(
                'planning-approval',
                'Planning Approval',
                'Planning Approval',
                'planningApproval',
                [
                    'Send for approval',
                    'Continue without approval',
                ],
                null,
                3,
            ),
        ];
    }

    /**
     * Bite Splint: shared parameters (same for every material).
     */
    private function seedBiteplaneParameters(DentalProduct $product): void
    {
        $product->parameters()->delete();

        foreach ($this->biteplaneTemplates() as $template) {
            $this->seedParameter($product, $template);
        }
    }

    /**
     * @return list<array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options?: list<string|array{label?: string, value?: string, image?: string|null}>,
     *     material_id?: int|null,
     *     group_sort_order?: int|null
     * }>
     */
    private function biteplaneTemplates(): array
    {
        return [
            $this->option(
                'splint-type',
                'Biteplane Type',
                'Biteplane Type',
                'splintType',
                [
                    'Type A — Directional Splint',
                    'Type B — Stabilization / Tanner / Michigan',
                    'Type C — B-Splint',
                ],
                null,
                1,
            ),
            $this->option(
                'contact-depth',
                'Point of Contact Depth',
                'Point of Contact Depth',
                'contactDepth',
                ['0 mm', '0.1 mm', '0.2 mm', '0.3 mm'],
                null,
                2,
            ),
            $this->option(
                'guidance',
                'Canine and Anterior Guidance',
                'Canine and Anterior Guidance',
                'guidance',
                ['Slight', 'Medium', 'Sharp'],
                null,
                3,
            ),
            $this->option(
                'minimum-thickness',
                'Minimum Thickness',
                'Minimum Thickness',
                'minimumThickness',
                ['1 mm', '2 mm', '3 mm', '4 mm'],
                null,
                4,
            ),
        ];
    }

    /**
     * Full Denture: trimmed options (same for every material).
     */
    private function seedFullDentureParameters(DentalProduct $product): void
    {
        $product->parameters()->delete();

        foreach ($this->fullDentureTemplates() as $template) {
            $this->seedParameter($product, $template);
        }
    }

    /**
     * @return list<array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options?: list<string|array{label?: string, value?: string, image?: string|null}>,
     *     material_id?: int|null,
     *     group_sort_order?: int|null
     * }>
     */
    private function fullDentureTemplates(): array
    {
        return [
            $this->option(
                'tooth-shape',
                'Tooth Shape',
                'Tooth Shape',
                'toothShape',
                [
                    [
                        'label' => 'Ovoid/Oval',
                        'value' => 'Ovoid/Oval',
                        'image' => 'images/full_denture/ovid-or-oval.png',
                    ],
                    [
                        'label' => 'Square',
                        'value' => 'Square',
                        'image' => 'images/full_denture/square.png',
                    ],
                    [
                        'label' => 'Triangular',
                        'value' => 'Triangular',
                        'image' => 'images/full_denture/triangular.png',
                    ],
                    'Face Appropriate',
                    'Age Appropriate Wear',
                ],
                null,
                1,
            ),
            $this->option(
                'anterior-setup',
                'Anterior Setup',
                'Anterior Setup',
                'anteriorSetup',
                [
                    [
                        'label' => 'Straight Hollywood',
                        'value' => 'Straight Hollywood',
                        'image' => 'images/full_denture/straight.png',
                    ],
                    [
                        'label' => 'Naturally Straight',
                        'value' => 'Naturally Straight',
                        'image' => 'images/full_denture/shorter-laterals.png',
                    ],
                    [
                        'label' => 'Naturally Rotated Laterals',
                        'value' => 'Naturally Rotated Laterals',
                        'image' => 'images/full_denture/twisted-laterals.png',
                    ],
                    [
                        'label' => 'Naturally Rotated Centrals',
                        'value' => 'Naturally Rotated Centrals',
                        'image' => 'images/full_denture/centerl-overlap.png',
                    ],
                    'Face and Age Appropriate',
                ],
                null,
                2,
            ),
            $this->option(
                'posterior-setup',
                'Posterior Setup',
                'Posterior Setup',
                'posteriorSetup',
                [
                    'Lingualized Occlusion',
                    'Flat Occlusion',
                    'Medium Angled Occlusion',
                    'Sharply Angled Occlusion',
                ],
                null,
                3,
            ),
            $this->option(
                'post-dam',
                'Post Dam',
                'Post Dam',
                'postDam',
                ['Straight', 'Butterfly'],
                null,
                4,
            ),
            $this->option(
                'periphery',
                'Periphery',
                'Periphery',
                'periphery',
                [
                    'In the depth of the sulcus',
                    '1 mm short from sulcus',
                    '2 mm short from sulcus',
                    '3 mm short from sulcus',
                ],
                null,
                5,
            ),
            $this->option(
                'design-markers',
                'Design Markers',
                'Design Markers',
                'designMarkers',
                [
                    'Follow Natural Markers',
                    'Follow Biteblock Markers',
                    'Use Photographs or Face Scan',
                ],
                null,
                6,
            ),
            $this->option(
                'gingiva',
                'Gingiva',
                'Gingiva',
                'gingiva',
                [
                    [
                        'label' => 'Soft Gingiva',
                        'value' => 'Soft Gingiva',
                        'image' => 'images/full_denture/soft-gum.png',
                    ],
                    [
                        'label' => 'Medium Gingiva',
                        'value' => 'Medium Gingiva',
                        'image' => 'images/full_denture/medium-gum.png',
                    ],
                    [
                        'label' => 'Heavy Gingiva',
                        'value' => 'Heavy Gingiva',
                        'image' => 'images/full_denture/heavy-gum.png',
                    ],
                ],
                null,
                7,
            ),
        ];
    }

    /**
     * Pontic only: shared Pontic Design image choices (same for every material).
     */
    private function seedPonticParameters(DentalProduct $product): void
    {
        $product->parameters()->delete();

        $this->seedParameter($product, $this->option(
            'pontic-design',
            'Pontic Design',
            'Pontic Design',
            'ponticDesign',
            [
                [
                    'label' => 'Saddle',
                    'value' => 'Saddle',
                    'image' => 'images/pontic_images/pontic_image_1.PNG',
                ],
                [
                    'label' => 'Modified Ridge Lap',
                    'value' => 'Modified Ridge Lap',
                    'image' => 'images/pontic_images/pontic_image_2.PNG',
                ],
                [
                    'label' => 'Spheroidal',
                    'value' => 'Spheroidal',
                    'image' => 'images/pontic_images/pontic_image_3.PNG',
                ],
                [
                    'label' => 'Ridge Lap',
                    'value' => 'Ridge Lap',
                    'image' => 'images/pontic_images/pontic_image_4.PNG',
                ],
                [
                    'label' => 'Conical',
                    'value' => 'Conical',
                    'image' => 'images/pontic_images/pontic_image_5.PNG',
                ],
                [
                    'label' => 'Ovate',
                    'value' => 'Ovate',
                    'image' => 'images/pontic_images/pontic_image_6.PNG',
                ],
            ],
        ));
    }

    /**
     * Crown / Retainer only: material-scoped Contour parameters.
     */
    private function seedCrownRetainerParameters(DentalProduct $product): void
    {
        $product->parameters()->delete();

        $materialsByName = $product->materials()
            ->get()
            ->keyBy(fn (DentalMaterial $material): string => $material->name);

        foreach (['Zirconia', 'Lithium Disilicate'] as $materialName) {
            $material = $materialsByName->get($materialName);

            if (! $material instanceof DentalMaterial) {
                continue;
            }

            $this->seedParameter($product, $this->option(
                'contour',
                'Contour',
                'Contour',
                'contour',
                self::STANDARD_CONTOUR_OPTIONS,
                $material->id,
            ));
        }

        $pmma = $materialsByName->get('PMMA');

        if ($pmma instanceof DentalMaterial) {
            $this->seedParameter($product, $this->option(
                'contour',
                'Contour',
                'Contour',
                'contour',
                self::PMMA_CONTOUR_OPTIONS,
                $pmma->id,
            ));
        }
    }

    /**
     * Implant Crown only: shared Contour + implant abutment fields.
     */
    private function seedImplantCrownParameters(DentalProduct $product): void
    {
        $product->parameters()->delete();

        foreach ($this->implantCrownTemplates() as $template) {
            $this->seedParameter($product, $template);
        }
    }

    /**
     * @return list<array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options?: list<string>,
     *     material_id?: int|null,
     *     group_sort_order?: int|null
     * }>
     */
    private function implantCrownTemplates(): array
    {
        return [
            $this->option(
                'contour',
                'Contour',
                'Contour',
                'contour',
                self::STANDARD_CONTOUR_OPTIONS,
                null,
                1,
            ),
            $this->option(
                'implant-brand',
                'Implant Brand / Type',
                'Implant Brand / Type',
                'implantBrand',
                ['Nobel Biocare', 'Straumann', 'Southern Implants', 'Astra', '3i', 'Custom'],
                null,
                2,
            ),
            $this->option(
                'abutment-type',
                'Abutment Type',
                'Abutment Type',
                'abutmentType',
                [
                    'Ti-Base',
                    'Custom Abutment – Cement Retained',
                    'Custom Abutment – Screw Retained',
                ],
                null,
                3,
            ),
            $this->input(
                'custom-implant-brand',
                'Custom Implant Brand / Type',
                'Custom Implant Brand / Type',
                'customImplantBrand',
                null,
                4,
            ),
            $this->input(
                'platform-size',
                'Platform Size',
                'Platform Size',
                'platformSize',
                null,
                5,
            ),
            $this->input(
                'scan-abutment-info',
                'Scan Abutment Information',
                'Scan Abutment Information',
                'scanAbutmentInfo',
                null,
                6,
            ),
            $this->option(
                'ti-base-type',
                'Ti-Base',
                'Ti-Base',
                'tiBaseType',
                ['OEM', 'Generic'],
                null,
                7,
            ),
        ];
    }

    /**
     * @param  array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options?: list<string|array{label?: string, value?: string, image?: string|null}>,
     *     placeholder?: string|null,
     *     material_id?: int|null,
     *     group_sort_order?: int|null
     * }  $template
     */
    private function seedParameter(DentalProduct $product, array $template): void
    {
        $group = ParameterGroup::query()->updateOrCreate(
            ['code' => $template['group_code']],
            [
                'name' => $template['group_name'],
                'sort_order' => $template['group_sort_order'] ?? null,
                'is_active' => true,
            ],
        );

        $materialId = $template['material_id'] ?? null;

        $parameter = Parameter::query()->updateOrCreate(
            [
                'product_id' => $product->id,
                'field_name' => $template['field_name'],
                'material_id' => $materialId,
            ],
            [
                'name' => $template['name'],
                'group_id' => $group->id,
                'type' => $template['type'],
            ],
        );

        $parameter->options()->delete();

        if (! $template['type']->hasSelectableOptions()) {
            return;
        }

        foreach (array_values($template['options'] ?? []) as $index => $option) {
            if (is_array($option)) {
                $label = (string) ($option['label'] ?? $option['value'] ?? '');
                $value = (string) ($option['value'] ?? $label);
                $image = isset($option['image']) && is_string($option['image']) && $option['image'] !== ''
                    ? $option['image']
                    : null;
            } else {
                $label = (string) $option;
                $value = $label;
                $image = null;
            }

            ParameterOption::query()->create([
                'parameter_id' => $parameter->id,
                'label' => $label,
                'field_name' => null,
                'placeholder' => null,
                'value' => $value,
                'color' => self::OPTION_COLORS[$index % count(self::OPTION_COLORS)],
                'image' => $image,
            ]);
        }
    }

    /**
     * @return array<string, list<array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options?: list<string>,
     *     placeholder?: string|null,
     *     material_id?: int|null
     * }>>
     */
    private function templatesByFlow(): array
    {
        $legacyImplant = [
            $this->option(
                'restoration-role',
                'Crown / Retainer / Pontic',
                'Crown / Retainer / Pontic',
                'restorationRole',
                ['Crown', 'Retainer', 'Pontic'],
            ),
            $this->option(
                'contour',
                'Contour',
                'Contour',
                'contour',
                ['Full Contour', 'Buccal Cutback', 'Full Cutback'],
            ),
            $this->option(
                'crown-type',
                'Restoration Type',
                'Restoration Type',
                'crownType',
                ['Crown', 'Implant Crown'],
            ),
            $this->option(
                'implant-brand',
                'Implant Brand / Type',
                'Implant Brand / Type',
                'implantBrand',
                ['Nobel Biocare', 'Straumann', 'Southern Implants', 'Astra', '3i', 'Custom'],
            ),
            $this->input(
                'custom-implant-brand',
                'Custom Implant Brand / Type',
                'Custom Implant Brand / Type',
                'customImplantBrand',
            ),
            $this->option(
                'retention',
                'Retention',
                'Retention',
                'retention',
                [
                    'Cement Retained Custom Abutment',
                    'Screw Retained Custom Abutment',
                    'Ti-Base',
                ],
            ),
            $this->option(
                'abutment-material',
                'On Custom Abutment',
                'On Custom Abutment',
                'abutmentMaterial',
                ['Custom Zirconia on Ti-Base', 'Titanium'],
            ),
            $this->option(
                'ti-base-type',
                'Ti-Base',
                'Ti-Base',
                'tiBaseType',
                ['OEM', 'Generic'],
            ),
            $this->input(
                'scan-abutment-info',
                'Scan Abutment Information',
                'Scan Abutment Information',
                'scanAbutmentInfo',
            ),
            $this->input(
                'platform-size',
                'Platform Size',
                'Platform Size',
                'platformSize',
            ),
            $this->option(
                'cervical',
                'Cervical Adaption',
                'Cervical Adaption',
                'cervical',
                ['Pull to Margin', 'Preserve Tooth Library Shape'],
            ),
        ];

        return [
            'implant' => $legacyImplant,
            'restorative' => [
                $this->option(
                    'contour',
                    'Contour',
                    'Contour',
                    'contour',
                    ['Full Contour', 'Buccal Cutback', 'Full Cutback'],
                ),
            ],
            'partial' => [
                $this->option(
                    'partial-type',
                    'Partial Type',
                    'Partial Type',
                    'partialType',
                    ['Cast Partial Denture', 'Acrylic Partial Denture'],
                ),
                $this->option(
                    'framework',
                    'Framework Design',
                    'Framework Design',
                    'framework',
                    [
                        'Standard Framework',
                        'Palatal Strap',
                        'Lingual Bar',
                        'Lingual Plate',
                        'Custom Design',
                    ],
                ),
                $this->option(
                    'clasp',
                    'Clasp',
                    'Clasp',
                    'clasp',
                    [
                        'Akers Clasp',
                        'RPI Clasp',
                        'Ring Clasp',
                        'Embrasure Clasp',
                        'Wrought Wire Clasp',
                        'No Clasp',
                    ],
                ),
                $this->option(
                    'clasp-material',
                    'Clasp / Base Material',
                    'Clasp / Base Material',
                    'claspMaterial',
                    ['CrCo', 'Acrylic PMMA', 'Flexible Resin', 'Wrought Wire'],
                ),
                $this->option(
                    'support',
                    'Support',
                    'Support',
                    'support',
                    ['Tooth Supported', 'Tissue Supported', 'Tooth and Tissue Supported'],
                ),
            ],
        ];
    }

    /**
     * @param  list<string>  $options
     * @return array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options: list<string|array{label?: string, value?: string, image?: string|null}>,
     *     material_id: int|null
     * }
     */
    private function option(
        string $groupCode,
        string $groupName,
        string $name,
        string $fieldName,
        array $options,
        ?int $materialId = null,
        ?int $groupSortOrder = null,
    ): array {
        return [
            'group_code' => $groupCode,
            'group_name' => $groupName,
            'name' => $name,
            'field_name' => $fieldName,
            'type' => ParameterType::Option,
            'options' => $options,
            'material_id' => $materialId,
            'group_sort_order' => $groupSortOrder,
        ];
    }

    /**
     * @param  list<string|array{label?: string, value?: string, image?: string|null}>  $options
     * @return array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     options: list<string|array{label?: string, value?: string, image?: string|null}>,
     *     material_id: int|null,
     *     group_sort_order: int|null
     * }
     */
    private function multiOption(
        string $groupCode,
        string $groupName,
        string $name,
        string $fieldName,
        array $options,
        ?int $materialId = null,
        ?int $groupSortOrder = null,
    ): array {
        return [
            'group_code' => $groupCode,
            'group_name' => $groupName,
            'name' => $name,
            'field_name' => $fieldName,
            'type' => ParameterType::MultiOption,
            'options' => $options,
            'material_id' => $materialId,
            'group_sort_order' => $groupSortOrder,
        ];
    }

    /**
     * @return array{
     *     group_code: string,
     *     group_name: string,
     *     name: string,
     *     field_name: string,
     *     type: ParameterType,
     *     material_id: int|null,
     *     group_sort_order: int|null
     * }
     */
    private function input(
        string $groupCode,
        string $groupName,
        string $name,
        string $fieldName,
        ?int $materialId = null,
        ?int $groupSortOrder = null,
    ): array {
        return [
            'group_code' => $groupCode,
            'group_name' => $groupName,
            'name' => $name,
            'field_name' => $fieldName,
            'type' => ParameterType::Input,
            'material_id' => $materialId,
            'group_sort_order' => $groupSortOrder,
        ];
    }
}
