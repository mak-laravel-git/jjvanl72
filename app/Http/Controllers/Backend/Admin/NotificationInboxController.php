<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\FilterNotificationsRequest;
use App\Models\UserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationInboxController extends Controller
{
    public function index(FilterNotificationsRequest $request): Response
    {
        $filter = $request->filter();
        $user = $request->user();

        $notifications = UserNotification::query()
            ->with('notification')
            ->where('user_id', $user->id)
            ->when($filter === 'unread', fn ($query) => $query->whereNull('read_at'))
            ->when($filter === 'read', fn ($query) => $query->whereNotNull('read_at'))
            ->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (UserNotification $item) => $this->transform($item));

        return Inertia::render('backend/Admin/Notifications/Index', [
            'notifications' => $notifications,
            'filters' => [
                'filter' => $filter,
            ],
            'unreadCount' => $user->unreadAppNotificationsCount(),
            'canBroadcast' => $user->can('notifications.broadcast'),
        ]);
    }

    public function recent(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('notifications.view'), 403);

        $items = UserNotification::query()
            ->with('notification')
            ->where('user_id', $request->user()->id)
            ->latest('id')
            ->limit(8)
            ->get()
            ->map(fn (UserNotification $item) => $this->transform($item));

        return response()->json([
            'notifications' => $items,
            'unread_count' => $request->user()->unreadAppNotificationsCount(),
        ]);
    }

    public function show(Request $request, UserNotification $userNotification): Response
    {
        $this->authorize('view', $userNotification);
        $userNotification->loadMissing('notification');
        $userNotification->markAsRead();

        return Inertia::render('backend/Admin/Notifications/Show', [
            'notification' => $this->transform($userNotification->fresh('notification')),
            'canBroadcast' => $request->user()->can('notifications.broadcast'),
        ]);
    }

    public function markRead(UserNotification $userNotification): RedirectResponse
    {
        $this->authorize('update', $userNotification);
        $userNotification->markAsRead();

        return back();
    }

    public function markUnread(UserNotification $userNotification): RedirectResponse
    {
        $this->authorize('update', $userNotification);
        $userNotification->markAsUnread();

        return back();
    }

    public function destroy(UserNotification $userNotification): RedirectResponse
    {
        $this->authorize('delete', $userNotification);
        $userNotification->delete();

        return redirect()
            ->route('admin.notifications.index')
            ->with('success', 'Notification deleted.');
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('notifications.view'), 403);

        UserNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return back()->with('success', 'All notifications marked as read.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transform(UserNotification $item): array
    {
        $notification = $item->notification;

        return [
            'id' => $item->id,
            'title' => $notification?->title ?? '',
            'message' => $notification?->body ?? '',
            'body' => $notification?->body ?? '',
            'reference' => $notification?->reference,
            'type' => $notification?->type?->value,
            'type_label' => $notification?->type?->label(),
            'icon' => $notification?->icon ?? 'notif-case.svg',
            'icon_bg' => $notification?->icon_bg ?? '#dbeafe',
            'action_url' => $notification?->action_url,
            'read' => $item->isRead(),
            'read_at' => $item->read_at?->toIso8601String(),
            'created_at' => $item->created_at?->toIso8601String(),
            'time' => $item->created_at?->diffForHumans() ?? '',
        ];
    }
}
