<?php

namespace App\Services;

use App\Enums\DentalCaseAssignmentRole;
use App\Enums\DentalCaseStatus;
use App\Models\DentalCase;
use App\Models\DentalClient;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AdminCaseService
{
    public function __construct(
        protected DentalCase $model,
        protected DataTableService $dataTable,
    ) {}

    /**
     * @return array{
     *     data: list<array<string, mixed>>,
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
     *     sort_order: string,
     *     total: int,
     *     active: int,
     *     statusOptions: list<array{value: string, label: string}>,
     *     clientOptions: list<array{id: int, name: string}>,
     *     serviceOptions: list<array{value: string, label: string}>
     * }
     */
    public function paginateForIndex(Request $request): array
    {
        $query = $this->model->newQuery()
            ->with([
                'client',
                'creator',
                'items',
                'assignments.user',
            ])
            ->withCount('files');

        $service = trim((string) $request->input('filters.service', ''));

        if ($service !== '') {
            $query->where('configuration_json->service', $service);
        }

        if (! $request->filled('sort_by')) {
            $query->orderByDesc('updated_at')->orderByDesc('id');
        }

        $result = $this->dataTable->process($query, $request, [
            'searchable' => [
                'case_number',
                'patient_name_snapshot',
                'reference',
                'client.name',
                'creator.name',
            ],
            'filterable' => ['status', 'client_id'],
            'sortable' => [
                'case_number',
                'patient_name_snapshot',
                'status',
                'due_date',
                'submitted_at',
                'updated_at',
            ],
        ]);

        $today = Carbon::now(config('app.timezone'))->startOfDay();

        $result['data'] = collect($result['data'])
            ->map(function (DentalCase $case) use ($today): array {
                return $this->toAdminRow($case, $today);
            })
            ->values()
            ->all();

        $result['total'] = $this->model->newQuery()->count();
        $result['active'] = $this->model->newQuery()
            ->whereIn('status', array_map(
                fn (DentalCaseStatus $status): string => $status->value,
                DentalCaseStatus::activeCases(),
            ))
            ->count();
        $result['statusOptions'] = collect(DentalCaseStatus::cases())
            ->map(fn (DentalCaseStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
            ])
            ->values()
            ->all();
        $result['clientOptions'] = DentalClient::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (DentalClient $client): array => [
                'id' => $client->id,
                'name' => $client->name,
            ])
            ->values()
            ->all();
        $result['serviceOptions'] = [
            ['value' => 'design', 'label' => 'Design Only'],
            ['value' => 'approve', 'label' => 'Design + Approval'],
            ['value' => 'manufacture', 'label' => 'Design + Manufacturing'],
        ];

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    private function toAdminRow(DentalCase $case, Carbon $today): array
    {
        $config = $case->configuration_json ?? [];
        $status = $case->status instanceof DentalCaseStatus
            ? $case->status
            : DentalCaseStatus::tryFrom((string) $case->status);
        $service = (string) ($config['service'] ?? 'design');
        $serviceLabel = match ($service) {
            'manufacture' => 'Design + Manufacturing',
            'approve' => 'Design + Approval',
            default => 'Design Only',
        };
        $dueDate = $case->due_date;
        $dueOverdue = $dueDate !== null
            && $dueDate->lt($today)
            && ! in_array($status, [
                DentalCaseStatus::Completed,
                DentalCaseStatus::Cancelled,
            ], true);

        $designerNames = $case->assignments
            ->filter(fn ($assignment): bool => $assignment->roleValue() === DentalCaseAssignmentRole::Designer->value)
            ->map(fn ($assignment) => $assignment->user?->name)
            ->filter()
            ->unique()
            ->values();
        $manufacturerNames = $case->assignments
            ->filter(fn ($assignment): bool => $assignment->roleValue() === DentalCaseAssignmentRole::Manufacturer->value)
            ->map(fn ($assignment) => $assignment->user?->name)
            ->filter()
            ->unique()
            ->values();

        return [
            'id' => $case->case_number,
            'database_id' => $case->id,
            'customer' => $case->client?->name ?? '—',
            'customer_date' => $case->patient_name_snapshot
                ?: ($case->submitted_at?->timezone(config('app.timezone'))->format('M j, Y') ?? '—'),
            'type' => $serviceLabel,
            'product' => $case->items->first()?->product_name_snapshot ?? '—',
            'service_type' => $serviceLabel,
            'designer' => $designerNames->isEmpty() ? null : $designerNames->implode(', '),
            'manufacturer' => $manufacturerNames->isEmpty() ? null : $manufacturerNames->implode(', '),
            'status' => $status?->label() ?? 'Draft',
            'status_tone' => $status?->tone() ?? 'gray',
            'due_date' => $dueDate?->format('M j, Y') ?? '—',
            'due_overdue' => $dueOverdue,
            'priority' => '—',
            'priority_tone' => 'normal',
            'notes' => $case->notes,
            'files_count' => (int) ($case->files_count ?? 0),
            'has_downloadable_files' => ((int) ($case->files_count ?? 0)) > 0,
            'creator' => $case->creator?->name ?? '—',
        ];
    }
}
