<?php

namespace App\Support;

use App\Enums\DentalCaseStatus;
use App\Models\DentalCase;
use App\Models\DentalCaseItem;
use App\Models\DentalProduct;
use App\Models\User;

class DentalCasePresenter
{
    /**
     * @return array{id: int, name: string, code: string}|null
     */
    public static function clientPayload(?User $user): ?array
    {
        $client = $user?->client;

        if ($client === null || ! $client->is_active) {
            return null;
        }

        return [
            'id' => $client->id,
            'name' => $client->name,
            'code' => $client->code,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function toDraft(DentalCase $case): array
    {
        $config = $case->configuration_json ?? [];

        return [
            'id' => (string) $case->id,
            'databaseId' => $case->id,
            'client' => $case->client?->name ?? '',
            'clientId' => $case->client_id,
            'reference' => $case->reference ?? '',
            'patientName' => $case->patient_name_snapshot,
            'dueDate' => $case->due_date?->toDateString() ?? '',
            'description' => $case->notes ?? '',
            'shade' => $config['shade'] ?? 'A2',
            'impressionType' => $config['impressionType'] ?? 'Intra Oral Scan',
            'service' => $config['service'] ?? 'design',
            'output' => $config['output'] ?? 'appliance',
            'items' => $case->items->map(fn (DentalCaseItem $item): array => self::itemToDraft($item))->values()->all(),
            'uploads' => self::uploads($case),
            'fileSlots' => self::fileSlots($case),
            'payment' => [
                'method' => 'card',
                'name' => '',
                'card' => '',
                'expiry' => '',
                'cvv' => '',
                'paypalEmail' => '',
                'terms' => false,
            ],
            'status' => $case->status instanceof DentalCaseStatus
                ? $case->status->label()
                : (string) $case->status,
            'lockVersion' => $case->lock_version,
            'caseNumber' => $case->case_number,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function toListRow(DentalCase $case): array
    {
        $config = $case->configuration_json ?? [];
        $product = $case->items->first()?->product_name_snapshot ?? '—';
        $status = $case->status instanceof DentalCaseStatus
            ? $case->status
            : DentalCaseStatus::tryFrom((string) $case->status);

        return [
            'id' => $case->case_number,
            'databaseId' => $case->id,
            'patient' => $case->patient_name_snapshot,
            'product' => $product,
            'status' => $status?->label() ?? 'Draft',
            'status_tone' => $status?->tone() ?? 'gray',
            'submission_date' => $case->submitted_at?->timezone(config('app.timezone'))->format('M j, Y'),
            'due_date' => $case->due_date?->format('M j, Y'),
            'manufacturing_type' => self::manufacturingType($case, $config),
            'actions' => $case->isDraft() ? ['edit'] : ['view', 'edit'],
        ];
    }

    /**
     * The manufacturing method is no longer a dentist choice: the material
     * implies it ("Milled …" / "… Printed"). Derive the label from the case
     * materials, falling back to the value stored on legacy cases.
     *
     * @param  array<string, mixed>  $config
     */
    public static function manufacturingType(DentalCase $case, array $config): string
    {
        $materials = $case->items
            ->map(fn (DentalCaseItem $item): string => mb_strtolower((string) $item->material_name_snapshot))
            ->filter()
            ->all();

        foreach (['print', 'mill'] as $method) {
            foreach ($materials as $material) {
                if (str_contains($material, $method)) {
                    return $method;
                }
            }
        }

        $legacy = $config['manufactureMethod'] ?? null;

        return in_array($legacy, ['mill', 'print'], true) ? $legacy : '—';
    }

    /**
     * @return array<string, mixed>
     */
    public static function toCaseDetail(DentalCase $case): array
    {
        $config = $case->configuration_json ?? [];
        $status = $case->status instanceof DentalCaseStatus
            ? $case->status
            : DentalCaseStatus::tryFrom((string) $case->status);
        $bridgeTeeth = [];

        foreach ($case->items as $caseItem) {
            $itemConfig = $caseItem->configuration_json ?? [];

            if (($itemConfig['kind'] ?? 'tooth') !== 'bridge') {
                continue;
            }

            foreach ($caseItem->teeth as $tooth) {
                $bridgeTeeth[(int) $tooth->tooth_number] = true;
            }
        }

        $items = $case->items
            ->map(function (DentalCaseItem $item) use ($config, $bridgeTeeth): array {
                $detail = self::itemToCaseDetail($item, $config);
                $coveredByBridge = ($detail['kind'] ?? 'tooth') !== 'bridge'
                    && $detail['teeth'] !== []
                    && collect($detail['teeth'])->every(
                        fn (int $tooth): bool => isset($bridgeTeeth[$tooth]),
                    );
                $detail['included_in_bridge'] = $coveredByBridge;
                $detail['line_total'] = $coveredByBridge
                    ? 0.0
                    : round(
                        ((int) $item->unit_price_minor) * max(1, (int) $item->quantity) / 100,
                        2,
                    );

                return $detail;
            })
            ->values()
            ->all();
        $teeth = [];

        foreach ($items as $item) {
            // Bridges are connection-only for span/pontic teeth — do not
            // flatten them into per-tooth product/material rows.
            if (($item['kind'] ?? 'tooth') === 'bridge') {
                continue;
            }

            foreach ($item['teeth'] as $toothNumber) {
                $teeth[] = [
                    'tooth_number' => $toothNumber,
                    'product_key' => $item['product_key'],
                    'action' => $item['action'],
                    'material' => $item['material'],
                    'contour' => $item['contour'],
                    'shade' => $item['shade'],
                    'price' => $item['price'],
                    'kind' => $item['kind'],
                    'bridge_from' => null,
                    'bridge_to' => null,
                ];
            }
        }

        $uploadedCodes = $case->files
            ->groupBy('requirement_code_snapshot')
            ->keys()
            ->flip();

        $slots = $case->relationLoaded('fileSlots')
            ? $case->fileSlots
            : $case->fileSlots()->get();

        $files = $slots
            ->map(function ($slot) use ($uploadedCodes): array {
                return [
                    'id' => $slot->code,
                    'slot_id' => $slot->id,
                    'label' => $slot->label,
                    'required' => false,
                    'uploaded' => $uploadedCodes->has($slot->code),
                ];
            })
            ->values()
            ->all();

        // Orphan uploaded codes with no slot still appear as uploaded.
        foreach ($case->files->groupBy('requirement_code_snapshot') as $code => $group) {
            if ($slots->contains(fn ($slot): bool => $slot->code === $code)) {
                continue;
            }

            $files[] = [
                'id' => (string) $code,
                'slot_id' => null,
                'label' => $group->first()?->uploadRequirement?->name ?? (string) $code,
                'required' => false,
                'uploaded' => true,
            ];
        }

        $cartTotalMinor = $case->items->sum(function (DentalCaseItem $item) use ($bridgeTeeth): int {
            $itemConfig = $item->configuration_json ?? [];
            $kind = ($itemConfig['kind'] ?? 'tooth') === 'bridge' ? 'bridge' : 'tooth';
            $toothNumbers = $item->teeth
                ->pluck('tooth_number')
                ->map(fn ($tooth): int => (int) $tooth)
                ->values()
                ->all();

            if (
                $kind !== 'bridge'
                && $toothNumbers !== []
                && collect($toothNumbers)->every(
                    fn (int $tooth): bool => isset($bridgeTeeth[$tooth]),
                )
            ) {
                return 0;
            }

            return (int) $item->unit_price_minor * max(1, (int) $item->quantity);
        });

        return [
            'id' => $case->case_number,
            'database_id' => $case->id,
            'patient' => $case->patient_name_snapshot,
            'product' => $case->items->first()?->product_name_snapshot ?? '—',
            'status' => $status?->label() ?? 'Draft',
            'status_tone' => $status?->tone() ?? 'gray',
            'submission_date' => $case->submitted_at?->timezone(config('app.timezone'))->format('M j, Y'),
            'due_date' => $case->due_date?->format('M j, Y'),
            'manufacturing_type' => self::manufacturingType($case, $config),
            'reference' => $case->reference ?? $case->case_number,
            'notes' => $case->notes ?? '',
            'service' => $config['service'] ?? 'design',
            'case_approval' => ($config['service'] ?? '') !== 'design',
            'case_shade' => $config['shade'] ?? '',
            'scan_mode' => $config['impressionType'] ?? '',
            'source_scanner' => '',
            'model_output' => $config['output'] ?? '',
            'items' => $items,
            'teeth' => $teeth,
            'files' => $files,
            'has_downloadable_files' => $case->files->isNotEmpty(),
            'can_manage_files' => false,
            'cart_total' => round($cartTotalMinor / 100, 2),
        ];
    }

    /**
     * @return list<array{id: int, code: string, label: string, sort_order: int, uploaded: bool}>
     */
    public static function fileSlots(DentalCase $case): array
    {
        $slots = $case->relationLoaded('fileSlots')
            ? $case->fileSlots
            : $case->fileSlots()->get();

        $uploadedCodes = $case->files
            ->groupBy('requirement_code_snapshot')
            ->keys()
            ->flip();

        return $slots
            ->map(fn ($slot): array => [
                'id' => $slot->id,
                'code' => $slot->code,
                'label' => $slot->label,
                'sort_order' => $slot->sort_order,
                'uploaded' => $uploadedCodes->has($slot->code),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $caseConfig
     * @return array<string, mixed>
     */
    private static function itemToCaseDetail(DentalCaseItem $item, array $caseConfig): array
    {
        $itemConfig = $item->configuration_json ?? [];
        $parameters = $item->parameters ?? [];
        $contour = is_array($parameters) ? (string) collect($parameters)->first() : '';
        $kind = ($itemConfig['kind'] ?? 'tooth') === 'bridge' ? 'bridge' : 'tooth';
        $teeth = $item->teeth
            ->pluck('tooth_number')
            ->map(fn ($tooth): int => (int) $tooth)
            ->values()
            ->all();
        $productKey = $itemConfig['productKey'] ?? '';

        if ($productKey === '' && $item->product instanceof DentalProduct) {
            $productKey = CaseCreateCatalog::productKey($item->product);
        }

        $bridgeFrom = null;
        $bridgeTo = null;

        if ($kind === 'bridge') {
            $bridgeFrom = isset($itemConfig['bridgeFrom']) && $itemConfig['bridgeFrom'] !== null
                ? (int) $itemConfig['bridgeFrom']
                : ($teeth[0] ?? null);
            $lastTooth = $teeth === [] ? null : $teeth[array_key_last($teeth)];
            $bridgeTo = isset($itemConfig['bridgeTo']) && $itemConfig['bridgeTo'] !== null
                ? (int) $itemConfig['bridgeTo']
                : $lastTooth;
        }

        $brokenEdges = collect($itemConfig['brokenEdges'] ?? [])
            ->filter(fn ($edge): bool => is_string($edge) && $edge !== '')
            ->values()
            ->all();

        return [
            'id' => $item->id,
            'kind' => $kind,
            'product_key' => $productKey,
            'action' => $item->product_name_snapshot,
            'material' => $item->material_name_snapshot ?? '',
            'contour' => $contour,
            'shade' => $item->shade ?? ($caseConfig['shade'] ?? ''),
            'quantity' => $item->quantity,
            'teeth' => $teeth,
            'bridge_from' => $bridgeFrom,
            'bridge_to' => $bridgeTo,
            'broken_edges' => $brokenEdges,
            'price' => round(((int) $item->unit_price_minor) / 100, 2),
            'price_overridden' => (bool) ($itemConfig['priceOverridden'] ?? false),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function itemToDraft(DentalCaseItem $item): array
    {
        $config = $item->configuration_json ?? [];

        return [
            'id' => (string) ($config['clientItemId'] ?? $item->id),
            'kind' => $config['kind'] ?? 'tooth',
            'productKey' => $config['productKey'] ?? CaseCreateCatalog::productKey($item->product),
            'teeth' => $item->teeth->pluck('tooth_number')->map(fn ($tooth): int => (int) $tooth)->values()->all(),
            'arch' => $item->arch ?? '',
            'quantity' => $item->quantity,
            'unitPrice' => round(((int) $item->unit_price_minor) / 100, 2),
            'priceOverridden' => (bool) ($config['priceOverridden'] ?? false),
            'material' => $item->material_name_snapshot ?? '',
            'materialId' => $item->material_id,
            'shade' => $item->shade ?? '',
            'shadeOverridden' => (bool) ($config['shadeOverridden'] ?? false),
            'config' => is_array($config['config'] ?? null) ? $config['config'] : [],
            'bridgeFrom' => $config['bridgeFrom'] ?? null,
            'bridgeTo' => $config['bridgeTo'] ?? null,
            'brokenEdges' => $config['brokenEdges'] ?? [],
        ];
    }

    /**
     * @return array<string, list<array{id: int, name: string, size: number, type: string}>>
     */
    private static function uploads(DentalCase $case): array
    {
        $uploads = [];

        foreach ($case->files as $file) {
            $code = $file->requirement_code_snapshot;
            $uploads[$code] ??= [];
            $uploads[$code][] = [
                'id' => $file->id,
                'name' => $file->original_name,
                'size' => $file->size_bytes,
                'type' => $file->mime_type,
            ];
        }

        return $uploads;
    }
}
