<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\DentalCaseAssignmentRole;
use App\Enums\DesignerAssignmentStatus;
use App\Http\Controllers\Controller;
use App\Models\DentalCase;
use App\Models\DentalCaseAssignment;
use App\Services\CaseAssignmentService;
use App\Support\DentalCasePresenter;
use App\Support\PortalDemoData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DesignerPortalController extends Controller
{
    public function __construct(
        private CaseAssignmentService $assignments,
    ) {}

    public function assigned(Request $request): Response
    {
        return Inertia::render('backend/User/DesignerAssignedCases', [
            'cases' => $this->listRows($request),
        ]);
    }

    public function show(Request $request, string $case): Response
    {
        $detail = $this->detailFor($request, $case, (string) $request->query('from', 'assigned'));

        abort_if($detail === null, 404);

        return Inertia::render('backend/User/DesignerAssignedCaseDetail', [
            'caseDetail' => $detail,
        ]);
    }

    public function inProgress(Request $request): Response
    {
        return Inertia::render('backend/User/DesignerInProgressCases', [
            'cases' => $this->listRows($request, DesignerAssignmentStatus::Designing->value),
        ]);
    }

    public function revisions(Request $request): Response
    {
        return Inertia::render('backend/User/DesignerRevisionCases', [
            'cases' => $this->listRows($request, DesignerAssignmentStatus::Revision->value),
        ]);
    }

    public function submitted(Request $request): Response
    {
        return Inertia::render('backend/User/DesignerSubmittedCases', [
            'cases' => $this->listRows($request, DesignerAssignmentStatus::Submitted->value),
        ]);
    }

    public function completed(Request $request): Response
    {
        return Inertia::render('backend/User/DesignerCompletedCases', [
            'cases' => $this->listRows($request, DesignerAssignmentStatus::Completed->value),
        ]);
    }

    public function downloads(Request $request): Response
    {
        return Inertia::render('backend/User/DesignerFileDownloads', [
            'cases' => $this->listRows($request),
        ]);
    }

    public function notifications(): Response
    {
        $notifications = PortalDemoData::designerNotifications();

        return Inertia::render('backend/User/DesignerNotifications', [
            'unreadCount' => collect($notifications)->where('read', false)->count(),
            'notifications' => $notifications,
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function listRows(Request $request, ?string $status = null): array
    {
        $user = $request->user();
        abort_if($user === null, 403);

        return $this->assignments
            ->casesAssignedTo($user, DentalCaseAssignmentRole::Designer, $status)
            ->get()
            ->map(function (DentalCase $case) use ($user): ?array {
                $assignment = $case->assignments->first(
                    fn (DentalCaseAssignment $row): bool => $row->user_id === $user->id
                        && $row->role === DentalCaseAssignmentRole::Designer,
                );

                if ($assignment === null) {
                    return null;
                }

                return $this->assignments->toDesignerListRow($case, $assignment);
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function detailFor(Request $request, string $caseNumber, string $from): ?array
    {
        $user = $request->user();

        if ($user === null) {
            return null;
        }

        $case = $this->assignments
            ->casesAssignedTo($user, DentalCaseAssignmentRole::Designer)
            ->where('case_number', $caseNumber)
            ->with(['files', 'fileSlots'])
            ->first();

        if ($case === null) {
            return null;
        }

        $assignment = $case->assignments->first(
            fn (DentalCaseAssignment $row): bool => $row->user_id === $user->id
                && $row->role === DentalCaseAssignmentRole::Designer,
        );

        if ($assignment === null) {
            return null;
        }

        $row = $this->assignments->toDesignerListRow($case, $assignment);
        $config = $case->configuration_json ?? [];
        $source = $from;
        $backRoutes = [
            'assigned' => ['designer.assigned', 'Back to Cases'],
            'in-progress' => ['designer.in-progress', 'Back to In Progress'],
            'revisions' => ['designer.revisions', 'Back to Revisions'],
            'submitted' => ['designer.submitted', 'Back to Submitted'],
            'completed' => ['designer.completed', 'Back to Completed'],
            'downloads' => ['designer.downloads', 'Back to File Downloads'],
        ];
        [$backRoute, $backLabel] = $backRoutes[$source] ?? $backRoutes['assigned'];

        $status = $assignment->statusLabel();
        $tone = $assignment->statusTone();
        $canUpload = ! in_array($assignment->status, [
            DesignerAssignmentStatus::Completed->value,
        ], true);

        return [
            'id' => $case->case_number,
            'database_id' => $case->id,
            'customer' => $row['customer'],
            'product' => $row['product'],
            'client' => $row['client'],
            'assigned_date' => $row['assigned_date'],
            'due_date' => $row['due_date'],
            'due_urgent' => $row['due_urgent'],
            'priority' => $row['priority'],
            'status' => $status,
            'status_tone' => $tone,
            'material' => $case->items->first()?->material_name_snapshot ?? '—',
            'shade' => (string) ($config['shade'] ?? '—'),
            'implant_system' => '—',
            'patient' => $case->patient_name_snapshot,
            'notes' => $case->notes,
            'files' => $case->files->map(fn ($file): array => [
                'name' => $file->original_name ?? 'file',
                'meta' => '',
                'type' => pathinfo((string) ($file->original_name ?? ''), PATHINFO_EXTENSION) ?: 'file',
                'type_tone' => 'pdf',
            ])->values()->all(),
            'file_slots' => DentalCasePresenter::fileSlots($case),
            'timeline' => [
                [
                    'label' => 'Case Assigned',
                    'date' => $assignment->created_at?->timezone(config('app.timezone'))->format('Y-m-d'),
                    'complete' => true,
                ],
            ],
            'source' => $source,
            'back_url' => route($backRoute),
            'back_label' => $backLabel,
            'can_upload' => $canUpload,
            'can_manage_files' => $canUpload && $user->can('manageFiles', $case),
            'files_heading' => 'Case Files',
            'notes_heading' => 'Notes',
            'alert' => null,
            'header_actions' => [
                ['label' => 'Update Status', 'variant' => 'primary'],
            ],
            'workflow' => [
                ['label' => 'Download Files', 'icon' => 'download', 'state' => 'enabled'],
                ['label' => 'Start Design', 'icon' => 'design', 'state' => $canUpload ? 'enabled' : 'disabled'],
                ['label' => 'Upload Design', 'icon' => 'upload', 'state' => $canUpload ? 'enabled' : 'disabled'],
                ['label' => 'Submit For Review', 'icon' => 'submit', 'state' => $canUpload ? 'enabled' : 'muted'],
            ],
            'uploaded_design_files' => [],
        ];
    }
}
