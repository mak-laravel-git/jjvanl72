<?php

namespace App\Services;

use App\Enums\CaseOutput;
use App\Enums\CaseService;
use App\Models\DentalPackagePrice;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DentalPackagePriceService
{
    public function __construct(
        protected DentalPackagePrice $model,
        protected DataTableService $dataTable,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): DentalPackagePrice
    {
        $payload = $this->normalizePayload($data);
        $this->assertUniqueCombo($payload);

        return $this->model->newQuery()->create($payload);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(int $id, array $data): DentalPackagePrice
    {
        $item = $this->model->newQuery()->findOrFail($id);
        $payload = $this->normalizePayload($data);
        $this->assertUniqueCombo($payload, $item->id);
        $item->update($payload);

        return $item->fresh(['product:id,code,name', 'material:id,code,name']) ?? $item;
    }

    public function delete(DentalPackagePrice $packagePrice): void
    {
        $packagePrice->delete();
    }

    /**
     * @return array{
     *     data: list<array<string, mixed>>,
     *     pagination: array<string, mixed>,
     *     offset: int,
     *     filters: array<string, mixed>,
     *     search: string,
     *     sort_by: string,
     *     sort_order: string
     * }
     */
    public function paginateForIndex(Request $request): array
    {
        $query = $this->model->newQuery()
            ->with(['product:id,code,name', 'material:id,code,name']);

        if (! $request->filled('sort_by')) {
            $query->orderByDesc('updated_at');
        }

        $result = $this->dataTable->process($query, $request, [
            'searchable' => ['product.name', 'product.code', 'service'],
            'filterable' => [
                'service',
                'dental_product_id',
                'product.dental_product_group_id',
            ],
            'sortable' => ['service', 'price_minor', 'updated_at'],
        ]);

        $result['data'] = collect($result['data'])
            ->map(fn (DentalPackagePrice $row): array => $this->mapRow($row))
            ->values()
            ->all();

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    public function mapRow(DentalPackagePrice $row): array
    {
        return [
            'id' => $row->id,
            'dental_product_id' => $row->dental_product_id,
            'dental_material_id' => $row->dental_material_id,
            'product' => $row->product ? [
                'id' => $row->product->id,
                'code' => $row->product->code,
                'name' => $row->product->name,
                'label' => "{$row->product->code} — {$row->product->name}",
            ] : null,
            'material' => $row->material ? [
                'id' => $row->material->id,
                'code' => $row->material->code,
                'name' => $row->material->name,
                'label' => "{$row->material->code} — {$row->material->name}",
            ] : null,
            'service' => $row->service?->value,
            'service_label' => $row->service?->label(),
            'output' => $row->output?->value,
            'output_label' => $row->output?->label(),
            'price_minor' => $row->price_minor,
            'price' => $row->priceDollars(),
            'updated_at' => $row->updated_at
                ?->timezone(config('app.timezone'))
                ->format('M j, Y · g:i A') ?? '—',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function normalizePayload(array $data): array
    {
        $service = CaseService::from((string) ($data['service'] ?? CaseService::Design->value));
        $requiresManufacture = $service->requiresManufactureOptions();

        $price = $data['price'] ?? null;
        $priceMinor = array_key_exists('price_minor', $data)
            ? (int) $data['price_minor']
            : (int) round(((float) $price) * 100);

        return [
            'dental_product_id' => (int) $data['dental_product_id'],
            'dental_material_id' => isset($data['dental_material_id']) && $data['dental_material_id'] !== ''
                ? (int) $data['dental_material_id']
                : null,
            'service' => $service,
            // Method and model service are no longer pricing dimensions; they
            // are always cleared so a saved row matches the 4-part price key.
            'manufacture_method' => null,
            'output' => $requiresManufacture
                ? CaseOutput::from((string) $data['output'])
                : null,
            'model_service' => null,
            'price_minor' => max(0, $priceMinor),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function assertUniqueCombo(array $payload, ?int $ignoreId = null): void
    {
        $query = $this->model->newQuery()
            ->where('dental_product_id', $payload['dental_product_id'])
            ->where('service', $payload['service'] instanceof CaseService
                ? $payload['service']->value
                : $payload['service']);

        $materialId = $payload['dental_material_id'] ?? null;
        if ($materialId === null) {
            $query->whereNull('dental_material_id');
        } else {
            $query->where('dental_material_id', $materialId);
        }

        // Uniqueness is the 4-part price key (product, material, service,
        // output). Legacy method / model columns are ignored on purpose.
        $output = $payload['output'] ?? null;
        $outputValue = $output instanceof \BackedEnum ? $output->value : $output;

        if ($outputValue === null) {
            $query->whereNull('output');
        } else {
            $query->where('output', $outputValue);
        }

        if ($ignoreId !== null) {
            $query->whereKeyNot($ignoreId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'service' => 'A package price already exists for this product, material, service, and output combination.',
            ]);
        }
    }
}
