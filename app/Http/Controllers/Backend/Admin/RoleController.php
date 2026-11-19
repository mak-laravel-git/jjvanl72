<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\StoreRoleRequest;
use App\Http\Requests\Backend\Admin\UpdateRoleRequest;
use App\Support\AppPermissions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $type = trim((string) $request->query('type', ''));
        $type = in_array($type, ['protected', 'custom'], true) ? $type : '';

        $roles = Role::query()
            ->where('guard_name', AppPermissions::GUARD)
            ->whereNotIn('name', AppPermissions::stakeholderRoles())
            ->with('permissions:id,name')
            ->withCount('users')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($type === 'protected', function (Builder $query): void {
                $query->where('name', AppPermissions::SUPER_ADMIN_ROLE);
            })
            ->when($type === 'custom', function (Builder $query): void {
                $query->where('name', '!=', AppPermissions::SUPER_ADMIN_ROLE);
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Role $role): array => $this->mapRoleRow($role));

        return Inertia::render('backend/Admin/Roles/Index', [
            'roles' => $roles,
            'filters' => [
                'search' => $search,
                'type' => $type,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('backend/Admin/Roles/Create', [
            'permissionGroups' => $this->permissionGroupsPayload(),
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $role = Role::create([
                'name' => $request->string('name')->toString(),
                'guard_name' => AppPermissions::GUARD,
            ]);

            $role->syncPermissions((array) $request->validated('permissions', []));
        });

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Role created successfully.');
    }

    public function edit(Role $role): Response
    {
        abort_unless($role->guard_name === AppPermissions::GUARD, 404);
        abort_if(AppPermissions::isPortalType($role->name), 404);

        return Inertia::render('backend/Admin/Roles/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->name === AppPermissions::SUPER_ADMIN_ROLE
                    ? AppPermissions::adminPermissions()
                    : $role->permissions->pluck('name')->values()->all(),
                'is_super_admin' => $role->name === AppPermissions::SUPER_ADMIN_ROLE,
            ],
            'permissionGroups' => $this->permissionGroupsPayload(),
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        abort_unless($role->guard_name === AppPermissions::GUARD, 404);
        abort_if(AppPermissions::isPortalType($role->name), 404);

        DB::transaction(function () use ($request, $role): void {
            if ($role->name === AppPermissions::SUPER_ADMIN_ROLE) {
                return;
            }

            $role->update([
                'name' => $request->string('name')->toString(),
            ]);

            $role->syncPermissions((array) $request->validated('permissions', []));
        });

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        abort_unless($role->guard_name === AppPermissions::GUARD, 404);

        if ($role->name === AppPermissions::SUPER_ADMIN_ROLE) {
            return redirect()
                ->route('admin.roles.index')
                ->with('error', 'The Super Admin role cannot be deleted.');
        }

        abort_if(AppPermissions::isPortalType($role->name), 404);

        if ($role->users()->count() > 0) {
            return redirect()
                ->route('admin.roles.index')
                ->with('error', 'Remove all users from this role before deleting it.');
        }

        $role->delete();
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()
            ->route('admin.roles.index')
            ->with('success', 'Role deleted successfully.');
    }

    /**
     * @return array{
     *     id: int,
     *     name: string,
     *     users_count: int,
     *     permissions_count: int,
     *     permissions: list<string>,
     *     is_super_admin: bool
     * }
     */
    private function mapRoleRow(Role $role): array
    {
        $isSuperAdmin = $role->name === AppPermissions::SUPER_ADMIN_ROLE;

        return [
            'id' => $role->id,
            'name' => $role->name,
            'users_count' => (int) $role->users_count,
            'permissions_count' => $isSuperAdmin
                ? count(AppPermissions::adminPermissions())
                : $role->permissions->count(),
            'permissions' => $isSuperAdmin
                ? AppPermissions::adminPermissions()
                : $role->permissions->pluck('name')->values()->all(),
            'is_super_admin' => $isSuperAdmin,
        ];
    }

    /**
     * @return list<array{group: string, permissions: list<array{name: string, label: string}>}>
     */
    private function permissionGroupsPayload(): array
    {
        return collect(AppPermissions::adminGrouped())
            ->map(fn (array $permissions, string $group): array => [
                'group' => $group,
                'permissions' => collect($permissions)
                    ->map(fn (string $permission): array => [
                        'name' => $permission,
                        'label' => AppPermissions::label($permission),
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();
    }
}
