<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\DeleteDentalProductGroupRequest;
use App\Http\Requests\Backend\Admin\StoreDentalProductGroupRequest;
use App\Http\Requests\Backend\Admin\UpdateDentalProductGroupRequest;
use App\Models\DentalProductGroup;
use App\Services\DentalProductGroupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DentalProductGroupController extends Controller
{
    public function __construct(
        protected DentalProductGroupService $dentalProductGroups,
    ) {}

    public function index(Request $request): Response
    {
        $table = $this->dentalProductGroups->paginateForIndex($request);

        return Inertia::render('backend/Admin/DentalProductGroups/Index', [
            'groups' => $table['data'],
            'pagination' => $table['pagination'],
            'offset' => $table['offset'],
            'search' => $table['search'],
            'filters' => $table['filters'],
            'sort_by' => $table['sort_by'],
            'sort_order' => $table['sort_order'],
            'canCreate' => $request->user()?->can('dental-product-groups.create') ?? false,
            'canUpdate' => $request->user()?->can('dental-product-groups.update') ?? false,
            'canDelete' => $request->user()?->can('dental-product-groups.delete') ?? false,
        ]);
    }

    public function store(StoreDentalProductGroupRequest $request): RedirectResponse
    {
        $group = $this->dentalProductGroups->create($request->validated());

        return redirect()
            ->route('admin.dental-product-groups.index')
            ->with('success', "{$group->name} was added.");
    }

    public function update(
        UpdateDentalProductGroupRequest $request,
        DentalProductGroup $dentalProductGroup,
    ): RedirectResponse {
        $group = $this->dentalProductGroups->update(
            $dentalProductGroup->id,
            $request->validated(),
        );

        return redirect()
            ->route('admin.dental-product-groups.index')
            ->with('success', "{$group->name} was updated.");
    }

    public function destroy(
        DeleteDentalProductGroupRequest $request,
        DentalProductGroup $dentalProductGroup,
    ): RedirectResponse {
        $name = $dentalProductGroup->name;
        $this->dentalProductGroups->delete($dentalProductGroup);

        return redirect()
            ->route('admin.dental-product-groups.index')
            ->with('success', "{$name} was permanently deleted.");
    }
}
