<?php

namespace App\Services;

use App\Models\ParameterGroup;
use Illuminate\Http\Request;

class ParameterGroupService
{
    public function __construct(
        protected ParameterGroup $model,
        protected DataTableService $dataTable,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ParameterGroup
    {
        unset($data['code'], $data['sort_order'], $data['is_active']);

        if (isset($data['title'])) {
            $data['name'] = $data['title'];
            unset($data['title']);
        }

        $data['code'] = null;
        $data['sort_order'] = null;
        $data['is_active'] = true;

        return $this->model->newQuery()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(int $id, array $data): ParameterGroup
    {
        unset($data['code'], $data['sort_order'], $data['is_active']);

        if (isset($data['title'])) {
            $data['name'] = $data['title'];
            unset($data['title']);
        }

        $item = $this->model->newQuery()->findOrFail($id);
        $item->update($data);

        return $item;
    }

    public function delete(ParameterGroup $group): void
    {
        $group->delete();
    }

    /**
     * @return array{
     *     data: list<array{
     *         id: int,
     *         title: string,
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
            'filterable' => [],
            'sortable' => ['name', 'updated_at'],
        ]);

        $result['data'] = collect($result['data'])
            ->map(function (ParameterGroup $group): array {
                return [
                    'id' => $group->id,
                    'title' => $group->name,
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
