<?php

namespace App\Services;

use App\Models\DentalProduct;
use App\Support\DentalMaterialProductPivot;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DentalProductService
{
    public function __construct(
        protected DentalProduct $model,
        protected DataTableService $dataTable,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $materials
     */
    public function create(array $data, ?UploadedFile $icon = null, array $materials = []): DentalProduct
    {
        unset($data['materials'], $data['sort_order']);

        if ($icon instanceof UploadedFile) {
            $data['icon'] = $icon->store('dental-products/icons', 'public');
        } else {
            unset($data['icon']);
        }

        $data['sort_order'] = ((int) $this->model->newQuery()->max('sort_order')) + 1;

        $product = $this->model->newQuery()->create($data);
        DentalMaterialProductPivot::syncForProduct($product, $materials);

        return $product->fresh(['group:id,code,name', 'materials:id,code,name']) ?? $product;
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $materials
     */
    public function update(
        int $id,
        array $data,
        ?UploadedFile $icon = null,
        bool $removeIcon = false,
        array $materials = [],
    ): DentalProduct {
        $item = $this->model->newQuery()->findOrFail($id);

        unset($data['icon'], $data['remove_icon'], $data['materials'], $data['sort_order']);

        if ($removeIcon && $item->icon) {
            Storage::disk('public')->delete($item->icon);
            $data['icon'] = null;
        }

        if ($icon instanceof UploadedFile) {
            if ($item->icon) {
                Storage::disk('public')->delete($item->icon);
            }

            $data['icon'] = $icon->store('dental-products/icons', 'public');
        }

        $item->update($data);
        DentalMaterialProductPivot::syncForProduct($item, $materials);

        return $item->fresh(['group:id,code,name', 'materials:id,code,name']) ?? $item;
    }

    public function delete(DentalProduct $product): void
    {
        if ($product->icon) {
            Storage::disk('public')->delete($product->icon);
        }

        $product->materials()->detach();
        $product->delete();
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
     *         dental_product_group_id: int,
     *         group_code: string|null,
     *         group_name: string|null,
     *         materials: list<array{
     *             id: int,
     *             code: string,
     *             name: string,
     *             sort_order: int,
     *             is_default: bool
     *         }>,
     *         materials_count: int,
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
            ->with([
                'group:id,code,name',
                'materials' => fn ($q) => $q->orderByPivot('sort_order')->orderBy('code'),
            ])
            ->withCount('materials');

        if (! $request->filled('sort_by')) {
            $query->orderBy('name');
        }

        $result = $this->dataTable->process($query, $request, [
            'searchable' => ['code', 'name'],
            'filterable' => ['is_active', 'dental_product_group_id'],
            'sortable' => ['code', 'name', 'is_active', 'updated_at'],
        ]);

        $result['data'] = collect($result['data'])
            ->map(function (DentalProduct $product): array {
                $materials = $product->materials
                    ->map(fn ($material) => DentalMaterialProductPivot::mapRelated($material))
                    ->values()
                    ->all();

                return [
                    'id' => $product->id,
                    'code' => $product->code,
                    'name' => $product->name,
                    'icon' => $product->icon,
                    'icon_url' => $product->icon_url,
                    'is_active' => $product->is_active,
                    'status' => $product->is_active ? 'Active' : 'Inactive',
                    'dental_product_group_id' => $product->dental_product_group_id,
                    'group_code' => $product->group?->code,
                    'group_name' => $product->group?->name,
                    'materials' => $materials,
                    'materials_count' => (int) $product->materials_count,
                    'updated_at' => $product->updated_at
                        ?->timezone(config('app.timezone'))
                        ->format('M j, Y · g:i A') ?? '—',
                ];
            })
            ->values()
            ->all();

        return $result;
    }
}
