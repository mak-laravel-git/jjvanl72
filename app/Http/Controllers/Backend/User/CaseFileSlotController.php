<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\User\StoreCaseFileSlotRequest;
use App\Http\Requests\Backend\User\UploadCaseFileSlotRequest;
use App\Models\DentalCase;
use App\Models\DentalCaseFileSlot;
use App\Services\DentalCaseService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CaseFileSlotController extends Controller
{
    public function __construct(
        protected DentalCaseService $cases,
    ) {}

    public function store(StoreCaseFileSlotRequest $request, DentalCase $dentalCase): RedirectResponse
    {
        $this->authorizeManage($request, $dentalCase);

        $this->cases->addFileSlot(
            $dentalCase,
            $request->user(),
            $request->validated('label'),
        );

        return back()->with('success', 'Upload field added.');
    }

    public function upload(
        UploadCaseFileSlotRequest $request,
        DentalCase $dentalCase,
        DentalCaseFileSlot $slot,
    ): RedirectResponse {
        $this->authorizeManage($request, $dentalCase);

        $this->cases->uploadToFileSlot(
            $dentalCase,
            $slot,
            $request->user(),
            $request->file('files', []),
        );

        return back()->with('success', 'Files uploaded.');
    }

    public function destroy(Request $request, DentalCase $dentalCase, DentalCaseFileSlot $slot): RedirectResponse
    {
        $this->authorizeManage($request, $dentalCase);

        $this->cases->deleteEmptyFileSlot($dentalCase, $slot);

        return back()->with('success', 'Upload field removed.');
    }

    private function authorizeManage(Request $request, DentalCase $dentalCase): void
    {
        $user = $request->user();

        if ($user === null || $user->cannot('view', $dentalCase)) {
            abort(404);
        }

        abort_unless($user->can('manageFiles', $dentalCase), 403);
    }
}
