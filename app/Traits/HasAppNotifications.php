<?php

namespace App\Traits;

use App\Data\NotificationPayload;
use App\Models\Notification;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Relations\HasMany;

trait HasAppNotifications
{
    /**
     * @return HasMany<UserNotification, $this>
     */
    public function appNotifications(): HasMany
    {
        return $this->hasMany(UserNotification::class);
    }

    /**
     * @return HasMany<UserNotification, $this>
     */
    public function unreadAppNotifications(): HasMany
    {
        return $this->appNotifications()->whereNull('read_at');
    }

    public function unreadAppNotificationsCount(): int
    {
        return $this->unreadAppNotifications()->count();
    }

    public function notifyApp(NotificationPayload $payload, ?User $actor = null): Notification
    {
        return app(NotificationService::class)->send($payload, [$this], $actor);
    }
}
