<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\AppPermissions;
use App\Support\UserSearch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $tab = $request->string('tab', AppPermissions::ALL_USERS_TAB)->toString();
        $search = trim((string) $request->query('search', ''));

        if (! AppPermissions::isUserManagementTab($tab)) {
            $tab = AppPermissions::ALL_USERS_TAB;
        }

        $roleName = AppPermissions::roleFromTab($tab);

        $users = User::query()
            ->with('roles:id,name')
            ->when(
                $roleName !== null,
                fn (Builder $query) => $query->role($roleName, AppPermissions::GUARD),
                fn (Builder $query) => $query->role(AppPermissions::stakeholderRoles(), AppPermissions::GUARD),
            )
            ->tap(fn (Builder $query) => UserSearch::constrain($query, $search))
            ->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $user): array => $this->mapUser($user));

        return Inertia::render('backend/Admin/UserManagement', [
            'activeTab' => $tab,
            'tabs' => $this->tabs(),
            'users' => $users,
            'roles' => AppPermissions::stakeholderRoles(),
            'filters' => [
                'search' => $search,
            ],
            'canAssignRoles' => $request->user()?->isSuperAdmin() ?? false,
            'canManageUsers' => $request->user()?->isSuperAdmin() ?? false,
            'canCreateUsers' => $request->user()?->can('users.create') ?? false,
            'canUpdateUsers' => $request->user()?->can('users.update') ?? false,
        ]);
    }

    /**
     * @return list<array{id: string, label: string, role: string|null}>
     */
    private function tabs(): array
    {
        return collect(AppPermissions::userManagementTabs())
            ->map(fn (?string $role, string $id): array => [
                'id' => $id,
                'label' => $id === AppPermissions::ALL_USERS_TAB
                    ? 'All'
                    : str($id)->replace('_', ' ')->title()->toString(),
                'role' => $role,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function mapUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'initials' => $user->initials(),
            'email' => $user->email,
            'phone' => $user->phone,
            'location' => $user->location ?: '—',
            'avatar_url' => $user->avatar_url,
            'status' => $user->statusLabel(),
            'status_value' => ($user->status ?? UserStatus::Active)->value,
            'joined' => optional($user->created_at)?->toDateString() ?? '',
            'role' => $user->platformRole(),
        ];
    }
}
