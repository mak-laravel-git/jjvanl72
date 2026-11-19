<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\DentalCaseAssignmentRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\DestroyCaseAssignmentRequest;
use App\Http\Requests\Backend\Admin\StoreCaseAssignmentRequest;
use App\Models\DentalCase;
use App\Models\DentalCaseAssignment;
use App\Services\CaseAssignmentService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentCenterController extends Controller
{
    public function __construct(
        private CaseAssignmentService $assignments,
    ) {}

    public function index(): Response
    {
        return Inertia::render(
            'backend/Admin/AssignmentCenter',
            $this->assignments->assignmentCenterPayload(),
        );
    }

    public function store(StoreCaseAssignmentRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $case = DentalCase::query()->findOrFail($data['dental_case_id']);
        $role = DentalCaseAssignmentRole::from($data['role']);

        $created = $this->assignments->assign(
            $case,
            $role,
            $data['user_ids'],
            $request->user(),
        );

        $message = count($created) === 0
            ? 'Selected users were already assigned.'
            : count($created).' assignment(s) created.';

        return redirect()
            ->route('admin.assignments.index')
            ->with('success', $message);
    }

    public function destroy(
        DestroyCaseAssignmentRequest $request,
        DentalCaseAssignment $assignment,
    ): RedirectResponse {
        $this->assignments->unassign($assignment);

        return redirect()
            ->route('admin.assignments.index')
            ->with('success', 'Assignment removed.');
    }
}
