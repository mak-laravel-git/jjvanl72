<?php

namespace App\Http\Controllers\Backend\User;

use App\Enums\DentalCaseStatus;
use App\Http\Controllers\Controller;
use App\Models\DentalCase;
use App\Services\DentalCaseFileZipService;
use App\Support\AppPermissions;
use App\Support\CaseCreateCatalog;
use App\Support\DentalCasePresenter;
use App\Support\PortalDemoData;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PortalCaseController extends Controller
{
    public function __construct(
        protected DentalCaseFileZipService $caseFileZips,
    ) {}

    public function draft(): Response
    {
        return $this->renderList(
            'backend/User/DraftCases',
            'Draft Cases',
            $this->casesForStatuses([DentalCaseStatus::Draft]),
            showCreateButton: true,
        );
    }

    public function active(): Response
    {
        return $this->renderList(
            'backend/User/ActiveCases',
            'Active Cases',
            $this->casesForStatuses(DentalCaseStatus::activeCases()),
        );
    }

    public function pendingReviews(): Response
    {
        return $this->renderList(
            'backend/User/PendingReviews',
            'Pending Design Reviews',
            PortalDemoData::casesForStatuses([
                'Ready For Review',
                'Revision Requested',
            ]),
        );
    }

    public function showReview(string $case): Response
    {
        $review = PortalDemoData::review($case);

        abort_if($review === null, 404);

        return Inertia::render('backend/User/DesignReview', [
            'review' => $review,
        ]);
    }

    public function manufacturing(): Response
    {
        return Inertia::render('backend/User/ManufacturingOrders', [
            'title' => 'Manufacturing Orders',
            'cases' => PortalDemoData::manufacturingOrders(),
        ]);
    }

    public function showManufacturing(string $case): Response
    {
        $tracking = PortalDemoData::manufacturingTracking($case);

        abort_if($tracking === null, 404);

        return Inertia::render('backend/User/ManufacturingTracking', [
            'tracking' => $tracking,
        ]);
    }

    public function show(string $case): Response
    {
        $record = $this->visibleCases()
            ->with(['items.teeth', 'items.product', 'files.uploadRequirement', 'fileSlots', 'client'])
            ->where('case_number', $case)
            ->first();

        abort_if($record === null, 404);

        $user = request()->user();
        abort_unless($user?->can('view', $record), 404);

        $detail = DentalCasePresenter::toCaseDetail($record);
        $detail['can_manage_files'] = $user->can('manageFiles', $record);

        return Inertia::render('backend/User/ShowCase', [
            'caseDetail' => $detail,
            'catalog' => CaseCreateCatalog::forPortal(),
        ]);
    }

    public function downloadFiles(string $case): BinaryFileResponse
    {
        $record = $this->visibleCases()
            ->with('files')
            ->where('case_number', $case)
            ->first();

        abort_if($record === null, 404);
        abort_unless(request()->user()?->can('view', $record), 404);

        return $this->caseFileZips->download($record);
    }

    public function completed(): Response
    {
        return Inertia::render('backend/User/CompletedCases', [
            'title' => 'Completed Cases',
            'cases' => PortalDemoData::completedOrders(),
        ]);
    }

    public function showCompleted(string $case): Response
    {
        $tracking = PortalDemoData::completedTracking($case);

        abort_if($tracking === null, 404);

        return Inertia::render('backend/User/ManufacturingTracking', [
            'tracking' => $tracking,
            'backUrl' => route('cases.completed'),
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $cases
     */
    private function renderList(
        string $component,
        string $title,
        array $cases,
        bool $showCreateButton = false,
    ): Response {
        return Inertia::render($component, [
            'title' => $title,
            'cases' => $cases,
            'showCreateButton' => $showCreateButton,
        ]);
    }

    /**
     * @param  list<DentalCaseStatus>  $statuses
     * @return list<array<string, mixed>>
     */
    private function casesForStatuses(array $statuses): array
    {
        return $this->visibleCases()
            ->with(['items'])
            ->whereIn('status', $statuses)
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (DentalCase $case): array => DentalCasePresenter::toListRow($case))
            ->values()
            ->all();
    }

    /**
     * Owners see their cases; Lab also sees non-draft cases for file fulfillment.
     *
     * @return Builder<DentalCase>
     */
    private function visibleCases(): Builder
    {
        $user = request()->user();

        return DentalCase::query()
            ->where(function (Builder $query) use ($user): void {
                $query->where('created_by', $user?->id);

                if ($user?->platformRole() === AppPermissions::LAB_ROLE) {
                    $query->orWhere('status', '!=', DentalCaseStatus::Draft);
                }
            });
    }
}
