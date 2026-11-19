<?php

namespace App\Services;

use App\Models\DentalProductGroup;
use Illuminate\Http\Request;

class DentalProductGroupService
{
    public function __construct(
        protected DentalProductGroup $model,
        protected DataTableService $dataTable,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): DentalProductGroup
    {
        unset($data['code'], $data['sort_order']);

        return $this->model->newQuery()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(int $id, array $data): DentalProductGroup
    {
        unset($data['code'], $data['sort_order']);

        $item = $this->model->newQuery()->findOrFail($id);
        $item->update($data);

        return $item;
    }

    public function delete(DentalProductGroup $group): void
    {
        $group->delete();
    }

    /**
     * @return array{
     *     data: list<array{
     *         id: int,
     *         name: string,
     *         is_active: bool,
     *         status: string,
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
        $query = $this->model->newQuery();

        if (! $request->filled('sort_by')) {
            $query->orderBy('name');
        }

        $result = $this->dataTable->process($query, $request, [
            'searchable' => ['name'],
            'filterable' => ['is_active'],
            'sortable' => ['name', 'is_active', 'updated_at'],
        ]);

        $result['data'] = collect($result['data'])
            ->map(function (DentalProductGroup $group): array {
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'is_active' => $group->is_active,
                    'status' => $group->is_active ? 'Active' : 'Inactive',
                    'updated_at' => $group->updated_at
                        ?->timezone(config('app.timezone'))
                        ->format('M j, Y · g:i A') ?? '—',
                ];
            })
            ->values()
            ->all();

        return $result;
    }
}
