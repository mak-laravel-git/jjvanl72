<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\StorePortalUserRequest;
use App\Http\Requests\Backend\Admin\UpdatePortalUserRequest;
use App\Models\User;
use App\Services\DentalClientService;
use App\Support\AppPermissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PortalUserController extends Controller
{
    public function __construct(
        protected DentalClientService $dentalClients,
    ) {}

    public function create(Request $request): Response
    {
        $tab = $this->resolveTab($request->string('tab', AppPermissions::ALL_USERS_TAB)->toString());
        $role = AppPermissions::roleFromTab($tab);

        return Inertia::render('backend/Admin/Users/Create', [
            'activeTab' => $tab,
            'role' => $role,
            'roles' => AppPermissions::stakeholderRoles(),
            'statuses' => UserStatus::values(),
            'tabs' => $this->tabs(),
            'clients' => $this->dentalClients->optionsForForms(),
            'submitterRoles' => AppPermissions::submitterTypes(),
        ]);
    }

    public function store(StorePortalUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $role = $data['role'];

        DB::transaction(function () use ($request, $data, $role): void {
            $payload = collect($data)->except(['role', 'password_confirmation', 'avatar'])->all();

            if ($request->hasFile('avatar')) {
                $payload['avatar'] = $request->file('avatar')->store('avatars', 'public');
            }

            $user = User::query()->create([
                ...$payload,
                'email_verified_at' => now(),
            ]);

            $user->syncRoles([$role]);
            $user->searchable();
        });

        $tab = AppPermissions::tabFromRole($role) ?? AppPermissions::ALL_USERS_TAB;

        return redirect()
            ->route('admin.users.index', ['tab' => $tab])
            ->with('success', "{$data['name']} was created as a {$role}.");
    }

    public function show(User $user): Response
    {
        $this->ensurePortalUser($user);

        return Inertia::render('backend/Admin/Users/Show', [
            'user' => $this->userPayload($user),
            'activeTab' => AppPermissions::tabFromRole($user->platformRole() ?? '') ?? AppPermissions::ALL_USERS_TAB,
            'canManageUsers' => request()->user()?->isSuperAdmin() ?? false,
            'canUpdateUsers' => request()->user()?->can('users.update') ?? false,
        ]);
    }

    public function edit(Request $request, User $user): Response
    {
        $this->ensurePortalUser($user);

        abort_unless($request->user()?->can('users.update'), 403);

        return Inertia::render('backend/Admin/Users/Edit', [
            'user' => $this->userPayload($user),
            'roles' => AppPermissions::stakeholderRoles(),
            'statuses' => UserStatus::values(),
            'activeTab' => AppPermissions::tabFromRole($user->platformRole() ?? '') ?? AppPermissions::ALL_USERS_TAB,
            'canAssignRoles' => $request->user()?->isSuperAdmin() ?? false,
            'clients' => $this->dentalClients->optionsForForms(),
            'submitterRoles' => AppPermissions::submitterTypes(),
        ]);
    }

    public function update(UpdatePortalUserRequest $request, User $user): RedirectResponse
    {
        $this->ensurePortalUser($user);

        $data = $request->validated();

        DB::transaction(function () use ($request, $user, $data): void {
            $payload = collect($data)
                ->except(['role', 'password', 'password_confirmation', 'avatar', 'remove_avatar'])
                ->all();

            if ($request->boolean('remove_avatar') && $user->avatar) {
                Storage::disk('public')->delete($user->avatar);
                $payload['avatar'] = null;
            }

            if ($request->hasFile('avatar')) {
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }

                $payload['avatar'] = $request->file('avatar')->store('avatars', 'public');
            }

            if (! empty($data['password'])) {
                $payload['password'] = $data['password'];
            }

            $user->update($payload);

            if ($request->user()?->isSuperAdmin() && ! empty($data['role'])) {
                $user->syncRoles([$data['role']]);
                $user->searchable();
            }
        });

        return redirect()
            ->route('admin.users.show', $user)
            ->with('success', "{$user->name} was updated successfully.");
    }

    private function ensurePortalUser(User $user): void
    {
        abort_if($user->isSuperAdmin() || $user->platformRole() === null, 404);
    }

    private function resolveTab(string $tab): string
    {
        return AppPermissions::isUserManagementTab($tab)
            ? $tab
            : AppPermissions::ALL_USERS_TAB;
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
    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'location' => $user->location,
            'status' => ($user->status ?? UserStatus::Active)->value,
            'status_label' => $user->statusLabel(),
            'avatar_url' => $user->avatar_url,
            'initials' => $user->initials(),
            'role' => $user->platformRole(),
            'client_id' => $user->client_id,
            'email_verified_at' => optional($user->email_verified_at)?->toDateTimeString(),
            'two_factor_enabled' => $user->two_factor_confirmed_at !== null,
            'joined' => optional($user->created_at)?->toDateString() ?? '',
            'updated_at' => optional($user->updated_at)?->toDateTimeString(),
        ];
    }
}
