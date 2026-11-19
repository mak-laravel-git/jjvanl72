<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Data\NotificationPayload;
use App\Enums\NotificationType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\BroadcastNotificationRequest;
use App\Models\User;
use App\Services\NotificationService;
use App\Support\AppPermissions;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class NotificationBroadcastController extends Controller
{
    public function create(): Response
    {
        $roles = Role::query()
            ->where('guard_name', AppPermissions::GUARD)
            ->orderBy('name')
            ->pluck('name')
            ->values()
            ->all();

        $users = User::query()
            ->orderBy('name')
            ->limit(200)
            ->get(['id', 'name', 'email'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])
            ->values()
            ->all();

        return Inertia::render('backend/Admin/Notifications/Broadcast', [
            'types' => collect(NotificationType::cases())
                ->map(fn (NotificationType $type): array => [
                    'value' => $type->value,
                    'label' => $type->label(),
                ])
                ->values()
                ->all(),
            'roles' => $roles,
            'users' => $users,
        ]);
    }

    public function store(BroadcastNotificationRequest $request, NotificationService $notifications): RedirectResponse
    {
        $payload = NotificationPayload::from([
            'title' => $request->validated('title'),
            'body' => $request->validated('body'),
            'type' => $request->validated('type'),
            'reference' => $request->validated('reference'),
        ]);

        $recipients = collect();

        $roles = $request->validated('roles') ?? [];
        if ($roles !== []) {
            $recipients = $recipients->merge(
                User::query()->role($roles, AppPermissions::GUARD)->get()
            );
        }

        $userIds = $request->validated('user_ids') ?? [];
        if ($userIds !== []) {
            $recipients = $recipients->merge(
                User::query()->whereIn('id', $userIds)->get()
            );
        }

        $notifications->send(
            $payload,
            $recipients->unique('id')->values(),
            $request->user(),
        );

        return redirect()
            ->route('admin.notifications.index')
            ->with('success', 'Broadcast sent.');
    }
}
