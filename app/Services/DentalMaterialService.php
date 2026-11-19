<?php

namespace App\Services;

use App\Models\DentalMaterial;
use App\Support\DentalMaterialProductPivot;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DentalMaterialService
{
    public function __construct(
        protected DentalMaterial $model,
        protected DataTableService $dataTable,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $products
     */
    public function create(array $data, ?UploadedFile $icon = null, array $products = []): DentalMaterial
    {
        unset($data['products'], $data['sort_order'], $data['icon'], $data['remove_icon']);

        if ($icon instanceof UploadedFile) {
            $data['icon'] = $icon->store('dental-materials/icons', 'public');
        }

        $data['sort_order'] = ((int) $this->model->newQuery()->max('sort_order')) + 1;

        $material = $this->model->newQuery()->create($data);
        DentalMaterialProductPivot::syncForMaterial($material, $products);

        return $material->fresh(['products:id,code,name']) ?? $material;
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $products
     */
    public function update(
        int $id,
        array $data,
        ?UploadedFile $icon = null,
        bool $removeIcon = false,
        array $products = [],
    ): DentalMaterial {
        $item = $this->model->newQuery()->findOrFail($id);

        unset($data['products'], $data['sort_order'], $data['icon'], $data['remove_icon']);

        if ($removeIcon && $item->icon) {
            Storage::disk('public')->delete($item->icon);
            $data['icon'] = null;
        }

        if ($icon instanceof UploadedFile) {
            if ($item->icon) {
                Storage::disk('public')->delete($item->icon);
            }

            $data['icon'] = $icon->store('dental-materials/icons', 'public');
        }

        $item->update($data);
        DentalMaterialProductPivot::syncForMaterial($item, $products);

        return $item->fresh(['products:id,code,name']) ?? $item;
    }

    public function delete(DentalMaterial $material): void
    {
        if ($material->icon) {
            Storage::disk('public')->delete($material->icon);
        }

        $material->products()->detach();
        $material->delete();
    }

    /**
     * @return array{
     *     data: list<array{
     *         id: int,
     *         code: string,
     *         name: string,
     *         icon: string|null,
     *         icon_url: string|null,
     *         is_active: bool,
     *         status: string,
     *         products_count: int,
     *         products: list<array{
     *             id: int,
     *             code: string,
     *             name: string,
     *             sort_order: int,
     *             is_default: bool
     *         }>,
     *         updated_at: string
     *     }>,
     *     pagination: array{
     *         current_page: int,
     *         last_page: int,
     *         per_page: int,
     *         total: int,
     *         from: int|null,
     *         to: int|null
     *     },
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
            ->with(['products' => fn ($q) => $q->orderByPivot('sort_order')->orderBy('code')])
            ->withCount('products');

        if (! $request->filled('sort_by')) {
            $query->orderBy('name');
        }

        $result = $this->dataTable->process($query, $request, [
            'searchable' => ['code', 'name'],
            'filterable' => ['is_active'],
            'sortable' => ['code', 'name', 'is_active', 'updated_at'],
        ]);

        $result['data'] = collect($result['data'])
            ->map(function (DentalMaterial $material): array {
                return [
                    'id' => $material->id,
                    'code' => $material->code,
                    'name' => $material->name,
                    'icon' => $material->icon,
                    'icon_url' => $material->icon_url,
                    'is_active' => $material->is_active,
                    'status' => $material->is_active ? 'Active' : 'Inactive',
                    'products_count' => (int) $material->products_count,
                    'products' => $material->products
                        ->map(fn ($product) => DentalMaterialProductPivot::mapRelated($product))
                        ->values()
                        ->all(),
                    'updated_at' => $material->updated_at
                        ?->timezone(config('app.timezone'))
                        ->format('M j, Y · g:i A') ?? '—',
                ];
            })
            ->values()
            ->all();

        return $result;
    }
}
