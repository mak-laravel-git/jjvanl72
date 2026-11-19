<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\DentalCaseAssignmentRole;
use App\Enums\ManufacturerAssignmentStatus;
use App\Http\Controllers\Controller;
use App\Models\DentalCase;
use App\Models\DentalCaseAssignment;
use App\Services\CaseAssignmentService;
use App\Support\PortalDemoData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ManufacturerPortalController extends Controller
{
    public function __construct(
        private CaseAssignmentService $assignments,
    ) {}

    public function assigned(Request $request): Response
    {
        $jobs = $this->jobRows($request, [ManufacturerAssignmentStatus::Assigned->value]);

        return $this->renderList('Assigned Jobs', [], $jobs);
    }

    public function showAssigned(Request $request, string $case): Response
    {
        return $this->renderJobDetail($request, $case, 'manufacturer.assigned');
    }

    public function inProduction(Request $request): Response
    {
        $jobs = $this->jobRows($request, [ManufacturerAssignmentStatus::Manufacturing->value]);

        return $this->renderList('In Production', [], null, $jobs);
    }

    public function showInProduction(Request $request, string $case): Response
    {
        return $this->renderJobDetail($request, $case, 'manufacturer.in-production');
    }

    public function qualityCheck(Request $request): Response
    {
        $jobs = $this->jobRows($request, [ManufacturerAssignmentStatus::QualityCheck->value]);

        return $this->renderList('Quality Check', [], null, null, $jobs);
    }

    public function showQualityCheck(Request $request, string $case): Response
    {
        return $this->renderJobDetail($request, $case, 'manufacturer.quality-check');
    }

    public function readyToShip(Request $request): Response
    {
        $jobs = $this->jobRows($request, [ManufacturerAssignmentStatus::ReadyToShip->value]);

        return $this->renderList('Ready To Ship', [], null, null, null, $jobs);
    }

    public function showReadyToShip(Request $request, string $case): Response
    {
        return $this->renderJobDetail($request, $case, 'manufacturer.ready-to-ship');
    }

    public function shipped(Request $request): Response
    {
        $jobs = $this->jobRows($request, [ManufacturerAssignmentStatus::Shipped->value]);

        return $this->renderList('Shipped Orders', [], null, null, null, null, $jobs);
    }

    public function showShipped(Request $request, string $case): Response
    {
        return $this->renderJobDetail($request, $case, 'manufacturer.shipped');
    }

    public function completed(Request $request): Response
    {
        $cases = $this->jobRows($request, [
            ManufacturerAssignmentStatus::Completed->value,
            ManufacturerAssignmentStatus::Shipped->value,
        ]);

        return $this->renderList(
            'Completed Orders',
            collect($cases)->map(fn (array $job): array => [
                'id' => $job['id'],
                'patient' => $job['customer'],
                'product' => $job['product'],
                'status' => $job['status'],
                'status_tone' => 'completed',
                'submission_date' => null,
                'due_date' => $job['due_date'],
                'manufacturing_type' => 'mill',
                'actions' => ['view'],
            ])->values()->all(),
        );
    }

    public function downloads(): Response
    {
        return Inertia::render('backend/User/ManufacturerDownloadCenter', [
            'files' => [],
        ]);
    }

    public function notifications(): Response
    {
        $notifications = PortalDemoData::manufacturerNotifications();

        return Inertia::render('backend/User/ManufacturerNotifications', [
            'unreadCount' => collect($notifications)->where('read', false)->count(),
            'notifications' => $notifications,
        ]);
    }

    /**
     * @param  list<string>  $statuses
     * @return list<array<string, mixed>>
     */
    private function jobRows(Request $request, array $statuses): array
    {
        $user = $request->user();
        abort_if($user === null, 403);

        return $this->assignments
            ->casesAssignedToWithStatuses($user, DentalCaseAssignmentRole::Manufacturer, $statuses)
            ->get()
            ->map(function (DentalCase $case) use ($user): ?array {
                $assignment = $case->assignments->first(
                    fn (DentalCaseAssignment $row): bool => $row->user_id === $user->id
                        && $row->role === DentalCaseAssignmentRole::Manufacturer,
                );

                if ($assignment === null) {
                    return null;
                }

                return $this->assignments->toManufacturerJobRow($case, $assignment);
            })
            ->filter()
            ->values()
            ->all();
    }

    private function renderJobDetail(Request $request, string $caseNumber, string $backRoute): Response
    {
        $user = $request->user();
        abort_if($user === null, 403);

        $case = $this->assignments
            ->casesAssignedTo($user, DentalCaseAssignmentRole::Manufacturer)
            ->where('case_number', $caseNumber)
            ->with('files')
            ->first();

        abort_if($case === null, 404);

        $assignment = $case->assignments->first(
            fn (DentalCaseAssignment $row): bool => $row->user_id === $user->id
                && $row->role === DentalCaseAssignmentRole::Manufacturer,
        );

        abort_if($assignment === null, 404);

        $row = $this->assignments->toManufacturerJobRow($case, $assignment);

        return Inertia::render('backend/User/ManufacturerAssignedJobDetail', [
            'job' => [
                'id' => $case->case_number,
                'subtitle' => $row['product'].' for '.$row['customer'],
                'customer_name' => $row['customer'],
                'customer_type' => $row['type'],
                'product_type' => $row['product'],
                'material' => $row['material'],
                'shade' => $row['shade'],
                'quantity' => (string) max(1, $case->items->sum('quantity')),
                'due_date' => $row['due_date'],
                'priority' => $row['priority'],
                'priority_tone' => 'medium',
                'status' => $row['status'],
                'status_tone' => $assignment->statusTone(),
                'manufacturing_notes' => $case->notes ?? '',
                'shipping_address' => $row['shipping_address'],
                'files' => $case->files->map(fn ($file): array => [
                    'name' => $file->original_name ?? 'file',
                    'meta' => '',
                ])->values()->all(),
                'timeline' => [
                    [
                        'label' => 'Job Assigned',
                        'date' => $assignment->created_at?->timezone(config('app.timezone'))->format('M j, Y g:i A') ?? '—',
                    ],
                ],
                'action_label' => 'Update Status',
                'action_tone' => 'primary',
                'back_url' => route($backRoute),
            ],
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $cases
     * @param  list<array<string, mixed>>|null  $assignedJobs
     * @param  list<array<string, mixed>>|null  $inProductionJobs
     * @param  list<array<string, mixed>>|null  $qualityCheckJobs
     * @param  list<array<string, mixed>>|null  $readyToShipJobs
     * @param  list<array<string, mixed>>|null  $shippedJobs
     */
    private function renderList(
        string $title,
        array $cases,
        ?array $assignedJobs = null,
        ?array $inProductionJobs = null,
        ?array $qualityCheckJobs = null,
        ?array $readyToShipJobs = null,
        ?array $shippedJobs = null,
    ): Response {
        return Inertia::render('backend/User/ManufacturerCaseList', [
            'title' => $title,
            'cases' => $cases,
            'assignedJobs' => $assignedJobs,
            'inProductionJobs' => $inProductionJobs,
            'qualityCheckJobs' => $qualityCheckJobs,
            'readyToShipJobs' => $readyToShipJobs,
            'shippedJobs' => $shippedJobs,
        ]);
    }
}
