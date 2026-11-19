<?php

namespace App\Services;

use App\Models\Parameter;
use App\Support\ParameterOptionSync;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ParameterService
{
    public function __construct(
        protected Parameter $model,
        protected DataTableService $dataTable,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $options
     */
    public function create(array $data, array $options = []): Parameter
    {
        unset($data['options']);

        $parameter = $this->model->newQuery()->create($data);
        ParameterOptionSync::syncForParameter($parameter, $options);

        return $parameter->fresh([
            'group:id,code,name',
            'product:id,code,name',
            'material:id,code,name',
            'options',
        ]) ?? $parameter;
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<array<string, mixed>>  $options
     */
    public function update(int $id, array $data, array $options = []): Parameter
    {
        unset($data['options']);

        $item = $this->model->newQuery()->findOrFail($id);
        $item->update($data);
        ParameterOptionSync::syncForParameter($item, $options);

        return $item->fresh([
            'group:id,code,name',
            'product:id,code,name',
            'material:id,code,name',
            'options',
        ]) ?? $item;
    }

    public function delete(Parameter $parameter): void
    {
        $parameter->load('options');

        foreach ($parameter->options as $option) {
            if ($option->image) {
                Storage::disk('public')->delete($option->image);
            }
        }

        $parameter->options()->delete();
        $parameter->delete();
    }

    /**
     * @return array{
     *     data: list<array{
     *         id: int,
     *         name: string,
     *         field_name: string,
     *         group_id: int,
     *         product_id: int,
     *         material_id: int,
     *         type: string,
     *         type_label: string,
     *         group_code: string|null,
     *         group_name: string|null,
     *         product_code: string|null,
     *         product_name: string|null,
     *         material_code: string|null,
     *         material_name: string|null,
     *         options: list<array{
     *             id: int,
     *             label: string,
     *             field_name: string|null,
     *             placeholder: string|null,
     *             value: string|null,
     *             color: string|null,
     *             image: string|null,
     *             image_url: string|null
     *         }>,
     *         options_count: int,
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
                'product:id,code,name',
                'material:id,code,name',
                'options',
            ])
            ->withCount('options');

        if (! $request->filled('sort_by')) {
            $query->orderBy('name');
        }

        $result = $this->dataTable->process($query, $request, [
            'searchable' => [
                'name',
                'field_name',
                'type',
                'group.code',
                'group.name',
                'product.code',
                'product.name',
                'material.code',
                'material.name',
            ],
            'filterable' => ['group_id', 'product_id', 'material_id', 'type'],
            'sortable' => ['name', 'field_name', 'type', 'updated_at', 'id'],
        ]);

        $result['data'] = collect($result['data'])
            ->map(function (Parameter $parameter): array {
                return [
                    'id' => $parameter->id,
                    'name' => $parameter->name,
                    'field_name' => $parameter->field_name,
                    'group_id' => $parameter->group_id,
                    'product_id' => $parameter->product_id,
                    'material_id' => $parameter->material_id,
                    'type' => $parameter->type->value,
                    'type_label' => $parameter->type->label(),
                    'group_code' => $parameter->group?->code,
                    'group_name' => $parameter->group?->name,
                    'product_code' => $parameter->product?->code,
                    'product_name' => $parameter->product?->name,
                    'material_code' => $parameter->material?->code,
                    'material_name' => $parameter->material?->name,
                    'options' => $parameter->options
                        ->map(fn ($option) => ParameterOptionSync::mapOption($option))
                        ->values()
                        ->all(),
                    'options_count' => (int) $parameter->options_count,
                    'updated_at' => $parameter->updated_at
                        ?->timezone(config('app.timezone'))
                        ->format('M j, Y · g:i A') ?? '—',
                ];
            })
            ->values()
            ->all();

        return $result;
    }
}
