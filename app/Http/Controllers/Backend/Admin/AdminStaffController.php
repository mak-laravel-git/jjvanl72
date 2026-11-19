<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\StoreAdminRequest;
use App\Http\Requests\Backend\Admin\UpdateAdminRequest;
use App\Models\User;
use App\Support\AppPermissions;
use App\Support\SuperAdmin;
use App\Support\UserSearch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class AdminStaffController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $role = trim((string) $request->query('role', ''));
        $adminRoleNames = AppPermissions::adminStaffRoleNames();

        $admins = User::query()
            ->whereHas(
                'roles',
                fn (Builder $query): Builder => $query
                    ->where('guard_name', AppPermissions::GUARD)
                    ->whereIn('name', $adminRoleNames),
            )
            ->with(['roles' => fn ($query) => $query
                ->where('guard_name', AppPermissions::GUARD)
                ->whereIn('name', $adminRoleNames)
                ->select('id', 'name')])
            ->tap(fn (Builder $query) => UserSearch::constrain($query, $search))
            ->when(
                $role !== '' && in_array($role, $adminRoleNames, true),
                fn (Builder $query): Builder => $query->role($role, AppPermissions::GUARD),
            )
            ->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $admin): array => $this->mapStaffRow($admin));

        return Inertia::render('backend/Admin/Staff/Index', [
            'admins' => $admins,
            'roles' => $adminRoleNames,
            'filters' => [
                'search' => $search,
                'role' => $role,
            ],
            'currentAdminId' => $request->user()?->id,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('backend/Admin/Staff/Create', [
            'roles' => $this->roles(),
            'statuses' => UserStatus::values(),
            'actorIsSuperAdmin' => $request->user()?->isSuperAdmin() ?? false,
        ]);
    }

    public function store(StoreAdminRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $admin = DB::transaction(function () use ($data, $request): User {
            $payload = collect($data)->except(['roles', 'password_confirmation', 'avatar'])->all();

            if ($request->hasFile('avatar')) {
                $payload['avatar'] = $request->file('avatar')->store('avatars', 'public');
            }

            $admin = User::query()->create([
                ...$payload,
                'email_verified_at' => now(),
            ]);
            $admin->syncRoles($request->validated('roles'));
            $admin->searchable();

            return $admin;
        });

        return redirect()
            ->route('admin.staff.show', $admin)
            ->with('success', 'Admin staff account created successfully.');
    }

    public function show(Request $request, User $adminStaff): Response
    {
        $this->ensureAdminStaff($adminStaff);

        return Inertia::render('backend/Admin/Staff/Show', [
            'admin' => $this->staffPayload($adminStaff),
            'canUpdateAdmins' => ($request->user()?->can('admins.update') ?? false)
                && (! $adminStaff->isSuperAdmin() || ($request->user()?->isSuperAdmin() ?? false)),
            'canDeleteAdmins' => ($request->user()?->can('admins.delete') ?? false)
                && ! $request->user()?->is($adminStaff)
                && ! SuperAdmin::isLast($adminStaff)
                && (! $adminStaff->isSuperAdmin() || ($request->user()?->isSuperAdmin() ?? false)),
        ]);
    }

    public function edit(Request $request, User $adminStaff): Response
    {
        $this->ensureAdminStaff($adminStaff);
        $this->ensureCanManageSuperAdmin($request, $adminStaff);

        return Inertia::render('backend/Admin/Staff/Edit', [
            'admin' => $this->staffPayload($adminStaff),
            'roles' => $this->roles(),
            'statuses' => UserStatus::values(),
            'actorIsSuperAdmin' => $request->user()?->isSuperAdmin() ?? false,
        ]);
    }

    public function update(UpdateAdminRequest $request, User $adminStaff): RedirectResponse
    {
        $this->ensureAdminStaff($adminStaff);

        $data = $request->validated();

        DB::transaction(function () use ($adminStaff, $data, $request): void {
            $payload = collect($data)
                ->except(['roles', 'password', 'password_confirmation', 'avatar', 'remove_avatar'])
                ->all();

            if ($request->boolean('remove_avatar') && $adminStaff->avatar) {
                Storage::disk('public')->delete($adminStaff->avatar);
                $payload['avatar'] = null;
            }

            if ($request->hasFile('avatar')) {
                if ($adminStaff->avatar) {
                    Storage::disk('public')->delete($adminStaff->avatar);
                }

                $payload['avatar'] = $request->file('avatar')->store('avatars', 'public');
            }

            if (! empty($data['password'])) {
                $payload['password'] = $data['password'];
            }

            $adminStaff->update($payload);
            $adminStaff->syncRoles($request->validated('roles'));
            $adminStaff->searchable();
        });

        return redirect()
            ->route('admin.staff.show', $adminStaff)
            ->with('success', 'Admin staff account updated successfully.');
    }

    public function destroy(Request $request, User $adminStaff): RedirectResponse
    {
        abort_unless($request->user()?->can('admins.delete'), 403);
        $this->ensureAdminStaff($adminStaff);
        $this->ensureCanManageSuperAdmin($request, $adminStaff);

        if ($request->user()?->is($adminStaff)) {
            return back()->with('error', 'You cannot delete your own admin account.');
        }

        if (SuperAdmin::isLast($adminStaff)) {
            return back()->with(
                'error',
                'The system must keep at least one Super Admin. Assign the Super Admin role to another admin, then delete or change this account.',
            );
        }

        if ($adminStaff->avatar) {
            Storage::disk('public')->delete($adminStaff->avatar);
        }

        $adminStaff->delete();

        return redirect()
            ->route('admin.staff.index')
            ->with('success', 'Admin staff account deleted successfully.');
    }

    private function ensureAdminStaff(User $adminStaff): void
    {
        $hasAdminRole = $adminStaff->roles()
            ->where('guard_name', AppPermissions::GUARD)
            ->whereIn('name', AppPermissions::adminStaffRoleNames())
            ->exists();

        abort_unless($hasAdminRole, 404);
    }

    private function ensureCanManageSuperAdmin(Request $request, User $adminStaff): void
    {
        if ($adminStaff->isSuperAdmin() && ! $request->user()?->isSuperAdmin()) {
            abort(403);
        }
    }

    /**
     * @return Collection<int, Role>
     */
    private function roles(): Collection
    {
        return Role::query()
            ->where('guard_name', AppPermissions::GUARD)
            ->whereNotIn('name', AppPermissions::stakeholderRoles())
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    /**
     * @return list<string>
     */
    private function adminRoleNamesFor(User $admin): array
    {
        return $admin->getRoleNames()
            ->filter(fn (string $role): bool => AppPermissions::isAdminStaffRole($role))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function mapStaffRow(User $admin): array
    {
        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'phone' => $admin->phone,
            'location' => $admin->location ?: '—',
            'avatar_url' => $admin->avatar_url,
            'initials' => $admin->initials(),
            'status' => $admin->statusLabel(),
            'status_value' => ($admin->status ?? UserStatus::Active)->value,
            'roles' => $this->adminRoleNamesFor($admin),
            'is_super_admin' => $admin->isSuperAdmin(),
            'is_last_super_admin' => SuperAdmin::isLast($admin),
            'joined' => optional($admin->created_at)?->toDateString() ?? '',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function staffPayload(User $admin): array
    {
        return [
            'id' => $admin->id,
            'name' => $admin->name,
            'email' => $admin->email,
            'phone' => $admin->phone,
            'location' => $admin->location,
            'status' => ($admin->status ?? UserStatus::Active)->value,
            'status_label' => $admin->statusLabel(),
            'avatar_url' => $admin->avatar_url,
            'initials' => $admin->initials(),
            'roles' => $this->adminRoleNamesFor($admin),
            'is_super_admin' => $admin->isSuperAdmin(),
            'is_last_super_admin' => SuperAdmin::isLast($admin),
            'email_verified_at' => optional($admin->email_verified_at)?->toDateTimeString(),
            'joined' => optional($admin->created_at)?->toDateString() ?? '',
            'updated_at' => optional($admin->updated_at)?->toDateTimeString(),
        ];
    }
}
