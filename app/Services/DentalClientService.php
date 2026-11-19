<?php

namespace App\Services;

use App\Models\DentalClient;
use Illuminate\Http\Request;

class DentalClientService
{
    public function __construct(
        protected DentalClient $model,
        protected DataTableService $dataTable,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): DentalClient
    {
        return $this->model->newQuery()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(int $id, array $data): DentalClient
    {
        $item = $this->model->newQuery()->findOrFail($id);
        $item->update($data);

        return $item;
    }

    public function delete(DentalClient $client): void
    {
        $client->delete();
    }

    /**
     * @return list<array{id: int, code: string, name: string}>
     */
    public function optionsForForms(): array
    {
        return $this->model->newQuery()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name'])
            ->map(fn (DentalClient $client): array => [
                'id' => $client->id,
                'code' => $client->code,
                'name' => $client->name,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array{
     *     data: list<array{
     *         id: int,
     *         code: string,
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
            'searchable' => ['name', 'code'],
            'filterable' => ['is_active'],
            'sortable' => ['name', 'code', 'is_active', 'updated_at'],
        ]);

        $result['data'] = collect($result['data'])
            ->map(function (DentalClient $client): array {
                return [
                    'id' => $client->id,
                    'code' => $client->code,
                    'name' => $client->name,
                    'is_active' => $client->is_active,
                    'status' => $client->is_active ? 'Active' : 'Inactive',
                    'updated_at' => $client->updated_at
                        ?->timezone(config('app.timezone'))
                        ->format('M j, Y · g:i A') ?? '—',
                ];
            })
            ->values()
            ->all();

        return $result;
    }
}
