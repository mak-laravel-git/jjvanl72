<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Support\AppPermissions;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionController extends Controller
{
    public function index(): Response
    {
        $adminRoleNames = AppPermissions::adminStaffRoleNames();

        $permissions = Permission::query()
            ->where('guard_name', AppPermissions::GUARD)
            ->whereIn('name', AppPermissions::adminPermissions())
            ->with([
                'roles' => fn ($query) => $query
                    ->where('guard_name', AppPermissions::GUARD)
                    ->whereIn('name', $adminRoleNames)
                    ->select('id', 'name'),
            ])
            ->orderBy('group')
            ->orderBy('name')
            ->get(['id', 'name', 'group'])
            ->groupBy(fn (Permission $permission): string => $permission->group ?? 'Other')
            ->map(fn ($items, string $group): array => [
                'group' => $group,
                'permissions' => $items
                    ->map(fn (Permission $permission): array => [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'label' => AppPermissions::label($permission->name),
                        'roles' => $permission->roles->pluck('name')->values()->all(),
                        'roles_count' => $permission->roles->count(),
                    ])
                    ->values()
                    ->all(),
            ])
            ->values();

        $adminRolesCount = Role::query()
            ->where('guard_name', AppPermissions::GUARD)
            ->whereIn('name', $adminRoleNames)
            ->count();

        return Inertia::render('backend/Admin/Permissions/Index', [
            'groupedPermissions' => $permissions,
            'summary' => [
                'permissions' => $permissions->sum(
                    fn (array $group): int => count($group['permissions']),
                ),
                'groups' => $permissions->count(),
                'roles' => $adminRolesCount,
            ],
        ]);
    }
}
