<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Models\UserNotification;
use App\Support\AppPermissions;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Laravel\Fortify\Features;

class HandleInertiaRequests extends Middleware
{
    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $permissions = match (true) {
            $user?->isSuperAdmin() => AppPermissions::adminPermissions(),
            $user !== null => $user->getAllPermissions()->pluck('name')->values()->all(),
            default => [],
        };

        $roles = $user
            ? $user->getRoleNames()->values()->all()
            : [];

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? array_merge(
                    $user->only([
                        'id',
                        'email',
                        'name',
                        'phone_number',
                        'employee_code',
                        'avatar',
                    ]),
                    [
                        'name' => $this->displayName($user),
                        'roles' => $roles,
                        'role' => $roles[0] ?? null,
                        'role_label' => $user->role_label,
                        'permissions' => $permissions,
                        'is_super_admin' => $user->isSuperAdmin(),
                        'can_access_admin_panel' => $user->canAccessAdminPanel(),
                        'avatar_url' => $user->avatar_url,
                    ]
                ) : null,
                'permissions' => $permissions,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'email_change_started' => fn () => $request->session()->get('email_change_started'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'features' => [
                'canRegister' => Features::enabled(Features::registration()),
                'canResetPassword' => Features::enabled(Features::resetPasswords()),
                'canVerifyEmail' => false,
                'canUseTwoFactorAuthentication' => Features::canManageTwoFactorAuthentication(),
            ],
            'platformRoles' => AppPermissions::stakeholderRoles(),
            'unreadNotificationsCount' => fn () => $user instanceof User
                ? UserNotification::query()
                    ->where('user_id', $user->id)
                    ->whereNull('read_at')
                    ->count()
                : 0,
        ];
    }

    private function displayName($user): string
    {
        return ! empty($user->name) ? $user->name : $user->email;
    }
}
