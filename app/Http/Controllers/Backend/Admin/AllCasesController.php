<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Backend\User\CreateCaseController;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\UpdateDentalCaseRequest;
use App\Models\DentalCase;
use App\Services\AdminCaseService;
use App\Services\DentalCaseFileZipService;
use App\Services\DentalCaseService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AllCasesController extends Controller
{
    public function __construct(
        protected AdminCaseService $cases,
        protected DentalCaseFileZipService $caseFileZips,
        protected DentalCaseService $dentalCases,
        protected CreateCaseController $createCases,
    ) {}

    public function __invoke(Request $request): Response
    {
        $table = $this->cases->paginateForIndex($request);

        return Inertia::render('backend/Admin/AllCases', [
            'cases' => $table['data'],
            'pagination' => $table['pagination'],
            'offset' => $table['offset'],
            'search' => $table['search'],
            'filters' => $table['filters'],
            'sort_by' => $table['sort_by'],
            'sort_order' => $table['sort_order'],
            'total' => $table['total'],
            'active' => $table['active'],
            'statusOptions' => $table['statusOptions'],
            'clientOptions' => $table['clientOptions'],
            'serviceOptions' => $table['serviceOptions'],
        ]);
    }

    public function edit(DentalCase $dentalCase): Response
    {
        $user = request()->user();

        abort_if($user === null || $user->cannot('view', $dentalCase), 404);
        abort_unless($user->can('update', $dentalCase), 403);

        $dentalCase->load(['client', 'patient', 'items.teeth', 'items.product', 'files']);

        return Inertia::render(
            'backend/User/CreateCase',
            $this->createCases->pageProps($user, $dentalCase, adminMode: true),
        );
    }

    public function update(UpdateDentalCaseRequest $request, DentalCase $dentalCase): RedirectResponse
    {
        $payload = $request->validated();
        $payload['files'] = $request->file('files') ?? [];

        $case = $this->dentalCases->update($dentalCase, $request->user(), $payload);

        if (($request->validated('intent') ?? 'draft') === 'submit') {
            return redirect()
                ->route('admin.cases.index')
                ->with('success', "Case {$case->case_number} was submitted.");
        }

        return redirect()
            ->route('admin.cases.index')
            ->with('success', "Case {$case->case_number} was saved.");
    }

    public function downloadFiles(string $case): BinaryFileResponse
    {
        abort_unless(request()->user()?->can('cases.view') ?? false, 403);

        $record = DentalCase::query()
            ->with('files')
            ->where('case_number', $case)
            ->first();

        abort_if($record === null, 404);

        return $this->caseFileZips->download($record);
    }
}
