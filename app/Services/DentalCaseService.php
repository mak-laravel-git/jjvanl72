<?php

namespace App\Services;

use App\Enums\CaseOutput;
use App\Enums\CaseService;
use App\Enums\DentalCaseStatus;
use App\Models\DentalCase;
use App\Models\DentalCaseFile;
use App\Models\DentalCaseFileSlot;
use App\Models\DentalCaseItem;
use App\Models\DentalClient;
use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use App\Models\DentalUploadRequirement;
use App\Models\Parameter;
use App\Models\Patient;
use App\Models\User;
use App\Support\CaseCreateCatalog;
use App\Support\PackagePriceResolver;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DentalCaseService
{
    public const STORAGE_DISK = 'local';

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(User $user, array $data): DentalCase
    {
        $client = $this->resolveActiveClient($data);

        return DB::transaction(function () use ($user, $client, $data): DentalCase {
            $patient = Patient::query()->create([
                'name' => $data['patient_name'],
                'patient_number' => $this->uniquePatientNumber(),
            ]);

            $case = DentalCase::query()->create([
                'case_number' => $this->uniqueCaseNumber(),
                'client_id' => $client->id,
                'created_by' => $user->id,
                'patient_id' => $patient->id,
                'reference' => $this->referenceValue($data['reference'] ?? null),
                'patient_name_snapshot' => $data['patient_name'],
                'due_date' => $data['due_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => DentalCaseStatus::Draft,
                'lock_version' => 1,
                'configuration_json' => $this->caseConfiguration($data),
            ]);

            $this->syncItems($case, $data['items'] ?? []);
            $this->syncFileSlots($case, $user, $data['file_slots'] ?? null);
            $this->syncFiles($case, $user, $data['files'] ?? [], []);

            return $this->applyIntent($case, $data)->fresh([
                'patient',
                'client',
                'items.teeth',
                'items.product',
                'files',
                'fileSlots',
            ]) ?? $case;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(DentalCase $case, User $user, array $data): DentalCase
    {
        $client = $this->resolveActiveClient($data);

        return DB::transaction(function () use ($case, $user, $data, $client): DentalCase {
            $locked = DentalCase::query()->whereKey($case->id)->lockForUpdate()->firstOrFail();

            $locked->patient?->update([
                'name' => $data['patient_name'],
            ]);

            $locked->update([
                'client_id' => $client->id,
                'reference' => $this->referenceValue($data['reference'] ?? $locked->reference),
                'patient_name_snapshot' => $data['patient_name'],
                'due_date' => $data['due_date'] ?? null,
                'notes' => $data['notes'] ?? null,
                'configuration_json' => $this->caseConfiguration($data),
                'lock_version' => $locked->lock_version + 1,
            ]);

            $this->syncItems($locked, $data['items'] ?? []);
            $this->syncFileSlots($locked, $user, $data['file_slots'] ?? null);
            $this->syncFiles(
                $locked,
                $user,
                $data['files'] ?? [],
                $data['keep_file_ids'] ?? [],
            );

            return $this->applyIntent($locked, $data)->fresh([
                'patient',
                'client',
                'items.teeth',
                'items.product',
                'files',
                'fileSlots',
            ]) ?? $locked;
        });
    }

    /**
     * @param  array{label?: string, code?: string}|string  $labelOrPayload
     */
    public function addFileSlot(DentalCase $case, User $user, array|string $labelOrPayload): DentalCaseFileSlot
    {
        $label = is_string($labelOrPayload)
            ? trim($labelOrPayload)
            : trim((string) ($labelOrPayload['label'] ?? ''));

        if ($label === '') {
            throw ValidationException::withMessages([
                'label' => 'Field label is required.',
            ]);
        }

        $code = is_array($labelOrPayload) && filled($labelOrPayload['code'] ?? null)
            ? Str::slug((string) $labelOrPayload['code'])
            : Str::slug($label);

        if ($code === '') {
            $code = 'file-'.Str::lower(Str::random(8));
        }

        $existing = $case->fileSlots()->where('code', $code)->first();

        if ($existing !== null) {
            throw ValidationException::withMessages([
                'label' => 'A field with this name already exists on the case.',
            ]);
        }

        $sortOrder = (int) $case->fileSlots()->max('sort_order') + 1;

        return $case->fileSlots()->create([
            'code' => $code,
            'label' => $label,
            'sort_order' => $sortOrder,
            'created_by_user_id' => $user->id,
        ]);
    }

    /**
     * @param  list<UploadedFile|mixed>  $uploads
     * @return list<DentalCaseFile>
     */
    public function uploadToFileSlot(
        DentalCase $case,
        DentalCaseFileSlot $slot,
        User $user,
        array $uploads,
    ): array {
        if ((int) $slot->case_id !== (int) $case->id) {
            abort(404);
        }

        $created = [];

        foreach ($uploads as $upload) {
            if (! $upload instanceof UploadedFile) {
                continue;
            }

            $created[] = $this->storeUploadedFile($case, $user, $slot->code, $upload);
        }

        if ($created === []) {
            throw ValidationException::withMessages([
                'files' => 'Choose at least one file to upload.',
            ]);
        }

        return $created;
    }

    public function deleteEmptyFileSlot(DentalCase $case, DentalCaseFileSlot $slot): void
    {
        if ((int) $slot->case_id !== (int) $case->id) {
            abort(404);
        }

        if ($slot->hasFiles()) {
            throw ValidationException::withMessages([
                'slot' => 'Remove uploaded files before deleting this field.',
            ]);
        }

        $slot->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function applyIntent(DentalCase $case, array $data): DentalCase
    {
        if (($data['intent'] ?? 'draft') !== 'submit') {
            return $case;
        }

        $case->update([
            'status' => DentalCaseStatus::Submitted,
            'submitted_at' => now(),
            'reference' => $this->referenceValue($case->reference) ?? $case->case_number,
        ]);

        return $case;
    }

    private function resolveActiveClient(array $data): DentalClient
    {
        $client = DentalClient::query()
            ->whereKey((int) ($data['client_id'] ?? 0))
            ->where('is_active', true)
            ->first();

        if (! $client instanceof DentalClient) {
            throw ValidationException::withMessages([
                'client_id' => 'Select an active dental client.',
            ]);
        }

        return $client;
    }

    /**
     * @param  list<mixed>  $items
     */
    private function syncItems(DentalCase $case, array $items): void
    {
        $case->items()->each(function (DentalCaseItem $item): void {
            $item->teeth()->delete();
            $item->delete();
        });

        foreach (array_values($items) as $index => $item) {
            if (! is_array($item)) {
                continue;
            }

            $product = CaseCreateCatalog::findProductByKey((string) ($item['product_key'] ?? ''));

            if (! $product instanceof DentalProduct) {
                continue;
            }

            $material = $this->resolveMaterial($product, $item);
            $config = is_array($item['config'] ?? null) ? $item['config'] : [];
            $parameters = $this->mapParameters($product, $config);
            $priceOverridden = filter_var($item['price_overridden'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $shadeOverridden = filter_var($item['shade_overridden'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $caseConfig = $case->configuration_json ?? [];
            $unitPriceMinor = $this->resolveItemPriceMinor(
                $product->id,
                $material?->id,
                $caseConfig,
                $item,
                $priceOverridden,
            );
            $kind = ($item['kind'] ?? 'tooth') === 'bridge' ? 'bridge' : 'tooth';
            $teeth = collect($item['teeth'] ?? [])
                ->map(fn ($tooth): int => (int) $tooth)
                ->unique(fn (int $tooth): string => 't'.$tooth)
                ->values();
            $quantity = $kind === 'bridge'
                ? max(1, $teeth->count())
                : max(1, (int) ($item['quantity'] ?? 1));

            $record = $case->items()->create([
                'product_id' => $product->id,
                'material_id' => $material?->id,
                'parameters' => $parameters,
                'product_code_snapshot' => Str::limit((string) $product->code, 50, ''),
                'product_name_snapshot' => $product->name,
                'arch' => $this->normalizeArch($item['arch'] ?? null),
                'quantity' => $quantity,
                'unit_price_minor' => $unitPriceMinor,
                'material_name_snapshot' => $material?->name ?? ($item['material'] ?? null),
                'shade' => $item['shade'] ?? null,
                'configuration_json' => [
                    'kind' => $kind,
                    'bridgeFrom' => $item['bridge_from'] ?? $item['bridgeFrom'] ?? null,
                    'bridgeTo' => $item['bridge_to'] ?? $item['bridgeTo'] ?? null,
                    'brokenEdges' => $item['broken_edges'] ?? $item['brokenEdges'] ?? [],
                    'productKey' => CaseCreateCatalog::productKey($product),
                    'config' => $config,
                    'clientItemId' => $item['id'] ?? null,
                    'priceOverridden' => $priceOverridden,
                    'shadeOverridden' => $shadeOverridden,
                ],
                'sort_order' => $index,
            ]);

            foreach ($teeth as $tooth) {
                $record->teeth()->create([
                    'tooth_number' => $tooth,
                ]);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $item
     */
    private function resolveMaterial(DentalProduct $product, array $item): ?DentalMaterial
    {
        $materialId = isset($item['material_id']) ? (int) $item['material_id'] : 0;

        if ($materialId > 0) {
            $material = $product->materials()->where('dental_materials.id', $materialId)->first();

            if ($material instanceof DentalMaterial) {
                return $material;
            }
        }

        $name = trim((string) ($item['material'] ?? ''));

        if ($name === '') {
            return null;
        }

        return $product->materials()->where('dental_materials.name', $name)->first();
    }

    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    private function mapParameters(DentalProduct $product, array $config): array
    {
        $parameters = Parameter::query()
            ->where('product_id', $product->id)
            ->get();

        $mapped = [];

        foreach ($parameters as $parameter) {
            $key = $parameter->field_name;

            if ($key !== null && array_key_exists($key, $config)) {
                $mapped[(string) $parameter->id] = $config[$key];
            }
        }

        return $mapped;
    }

    /**
     * @param  list<array{code?: mixed, label?: mixed, sort_order?: mixed}>|null  $slots
     */
    private function syncFileSlots(DentalCase $case, User $user, ?array $slots): void
    {
        $normalized = $this->normalizeFileSlotsPayload($slots);

        $keptCodes = [];

        foreach ($normalized as $index => $slot) {
            $keptCodes[] = $slot['code'];

            $record = DentalCaseFileSlot::query()->firstOrNew([
                'case_id' => $case->id,
                'code' => $slot['code'],
            ]);

            $record->label = $slot['label'];
            $record->sort_order = $slot['sort_order'] ?? $index;

            if (! $record->exists) {
                $record->created_by_user_id = $user->id;
            }

            $record->save();
        }

        $case->fileSlots()
            ->whereNotIn('code', $keptCodes)
            ->get()
            ->each(function (DentalCaseFileSlot $slot): void {
                if ($slot->hasFiles()) {
                    return;
                }

                $slot->delete();
            });
    }

    /**
     * @param  list<array{code?: mixed, label?: mixed, sort_order?: mixed}>|null  $slots
     * @return list<array{code: string, label: string, sort_order: int}>
     */
    private function normalizeFileSlotsPayload(?array $slots): array
    {
        $defaults = CaseCreateCatalog::defaultFileSlots();

        if ($slots === null || $slots === []) {
            return collect($defaults)
                ->values()
                ->map(fn (array $slot, int $index): array => [
                    'code' => $slot['code'],
                    'label' => $slot['label'],
                    'sort_order' => $index,
                ])
                ->all();
        }

        $normalized = [];
        $seen = [];

        foreach (array_values($slots) as $index => $slot) {
            if (! is_array($slot)) {
                continue;
            }

            $label = trim((string) ($slot['label'] ?? ''));
            $code = trim((string) ($slot['code'] ?? ''));

            if ($code === '' && $label !== '') {
                $code = Str::slug($label);
            }

            if ($code === '') {
                continue;
            }

            if ($label === '') {
                $label = Str::headline(str_replace(['-', '_'], ' ', $code));
            }

            if (isset($seen[$code])) {
                continue;
            }

            $seen[$code] = true;
            $normalized[] = [
                'code' => $code,
                'label' => $label,
                'sort_order' => (int) ($slot['sort_order'] ?? $index),
            ];
        }

        return $normalized !== []
            ? $normalized
            : collect($defaults)
                ->values()
                ->map(fn (array $slot, int $index): array => [
                    'code' => $slot['code'],
                    'label' => $slot['label'],
                    'sort_order' => $index,
                ])
                ->all();
    }

    /**
     * @param  array<string, mixed>  $files
     * @param  list<mixed>  $keepFileIds
     */
    private function syncFiles(DentalCase $case, User $user, array $files, array $keepFileIds): void
    {
        $keepIds = collect($keepFileIds)->map(fn ($id): int => (int) $id)->filter()->values()->all();

        $case->files()
            ->when($keepIds !== [], fn ($query) => $query->whereNotIn('id', $keepIds))
            ->when($keepIds === [], fn ($query) => $query)
            ->get()
            ->each(function (DentalCaseFile $file): void {
                Storage::disk($file->storage_disk)->delete($file->storage_path);
                $file->delete();
            });

        foreach ($files as $code => $uploads) {
            if (! is_array($uploads)) {
                continue;
            }

            foreach ($uploads as $upload) {
                if (! $upload instanceof UploadedFile) {
                    continue;
                }

                $this->storeUploadedFile($case, $user, (string) $code, $upload);
            }
        }
    }

    private function storeUploadedFile(
        DentalCase $case,
        User $user,
        string $code,
        UploadedFile $upload,
    ): DentalCaseFile {
        $requirement = DentalUploadRequirement::query()
            ->where('code', $code)
            ->first();

        $directory = 'dental-cases/'.$case->id;
        $path = $upload->store($directory, self::STORAGE_DISK);
        $contents = $upload->get();

        return $case->files()->create([
            'case_item_id' => null,
            'upload_requirement_id' => $requirement?->id,
            'requirement_code_snapshot' => $code,
            'storage_disk' => self::STORAGE_DISK,
            'storage_path' => $path,
            'original_name' => $upload->getClientOriginalName(),
            'mime_type' => $upload->getMimeType() ?: 'application/octet-stream',
            'size_bytes' => $upload->getSize(),
            'sha256' => is_string($contents) ? hash('sha256', $contents) : null,
            'status' => 'uploaded',
            'uploaded_by_user_id' => $user->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function caseConfiguration(array $data): array
    {
        return [
            'shade' => $data['shade'] ?? 'A2',
            'impressionType' => $data['impression_type'] ?? 'Intra Oral Scan',
            'service' => CaseService::tryFrom((string) ($data['service'] ?? ''))?->value
                ?? CaseService::Design->value,
            'output' => CaseOutput::tryFrom((string) ($data['output'] ?? ''))?->value
                ?? CaseOutput::Appliance->value,
        ];
    }

    /**
     * @param  array<string, mixed>  $caseConfig
     * @param  array<string, mixed>  $item
     */
    private function resolveItemPriceMinor(
        int $productId,
        ?int $materialId,
        array $caseConfig,
        array $item,
        bool $priceOverridden,
    ): int {
        if ($priceOverridden && array_key_exists('unit_price', $item)) {
            return max(0, (int) round(((float) $item['unit_price']) * 100));
        }

        return app(PackagePriceResolver::class)->resolveMinor(
            $productId,
            $materialId,
            (string) ($caseConfig['service'] ?? CaseService::Design->value),
            $caseConfig['output'] ?? null,
        );
    }

    private function normalizeArch(?string $arch): ?string
    {
        if ($arch === null || $arch === '') {
            return null;
        }

        $value = Str::lower($arch);

        return in_array($value, ['upper', 'lower'], true) ? $value : null;
    }

    private function referenceValue(?string $reference): ?string
    {
        $value = trim((string) $reference);

        return $value === '' ? null : $value;
    }

    private function uniqueCaseNumber(): string
    {
        do {
            $number = 'ADX-'.str_pad((string) random_int(10000, 99999), 5, '0', STR_PAD_LEFT);
        } while (DentalCase::query()->where('case_number', $number)->exists());

        return $number;
    }

    private function uniquePatientNumber(): string
    {
        do {
            $number = 'PAT-'.str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (Patient::query()->where('patient_number', $number)->exists());

        return $number;
    }
}
