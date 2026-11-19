<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\DeleteParameterGroupRequest;
use App\Http\Requests\Backend\Admin\StoreParameterGroupRequest;
use App\Http\Requests\Backend\Admin\UpdateParameterGroupRequest;
use App\Models\ParameterGroup;
use App\Services\ParameterGroupService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParameterGroupController extends Controller
{
    public function __construct(
        protected ParameterGroupService $parameterGroups,
    ) {}

    public function index(Request $request): Response
    {
        $table = $this->parameterGroups->paginateForIndex($request);

        return Inertia::render('backend/Admin/ParameterGroups/Index', [
            'groups' => $table['data'],
            'pagination' => $table['pagination'],
            'offset' => $table['offset'],
            'search' => $table['search'],
            'filters' => $table['filters'],
            'sort_by' => $table['sort_by'],
            'sort_order' => $table['sort_order'],
            'canCreate' => $request->user()?->can('parameter-groups.create') ?? false,
            'canUpdate' => $request->user()?->can('parameter-groups.update') ?? false,
            'canDelete' => $request->user()?->can('parameter-groups.delete') ?? false,
        ]);
    }

    public function store(StoreParameterGroupRequest $request): RedirectResponse
    {
        $group = $this->parameterGroups->create($request->validated());

        return redirect()
            ->route('admin.parameter-groups.index')
            ->with('success', "{$group->name} was added.");
    }

    public function update(
        UpdateParameterGroupRequest $request,
        ParameterGroup $parameterGroup,
    ): RedirectResponse {
        $group = $this->parameterGroups->update(
            $parameterGroup->id,
            $request->validated(),
        );

        return redirect()
            ->route('admin.parameter-groups.index')
            ->with('success', "{$group->name} was updated.");
    }

    public function destroy(
        DeleteParameterGroupRequest $request,
        ParameterGroup $parameterGroup,
    ): RedirectResponse {
        $name = $parameterGroup->name;
        $this->parameterGroups->delete($parameterGroup);

        return redirect()
            ->route('admin.parameter-groups.index')
            ->with('success', "{$name} was permanently deleted.");
    }
}
