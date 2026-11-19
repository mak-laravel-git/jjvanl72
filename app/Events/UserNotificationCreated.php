<?php

namespace App\Events;

use App\Models\UserNotification;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserNotificationCreated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public UserNotification $userNotification,
    ) {
        $this->userNotification->loadMissing('notification');
    }

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.'.$this->userNotification->user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.created';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $notification = $this->userNotification->notification;

        return [
            'id' => $this->userNotification->id,
            'title' => $notification?->title,
            'body' => $notification?->body,
            'reference' => $notification?->reference,
            'type' => $notification?->type?->value,
            'icon' => $notification?->icon,
            'icon_bg' => $notification?->icon_bg,
            'read' => $this->userNotification->isRead(),
            'created_at' => $this->userNotification->created_at?->toIso8601String(),
            'unread_count' => UserNotification::query()
                ->where('user_id', $this->userNotification->user_id)
                ->whereNull('read_at')
                ->count(),
        ];
    }
}
