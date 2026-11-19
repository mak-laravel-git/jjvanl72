<?php

use App\Data\NotificationPayload;
use App\Models\Notification;
use App\Models\User;
use App\Services\NotificationService;

if (! function_exists('notify_user')) {
    function notify_user(User $user, NotificationPayload|array $payload, ?User $actor = null): Notification
    {
        $payload = $payload instanceof NotificationPayload
            ? $payload
            : NotificationPayload::from($payload);

        return app(NotificationService::class)->send($payload, [$user], $actor);
    }
}

if (! function_exists('notify_users')) {
    /**
     * @param  iterable<int, User|int>  $users
     */
    function notify_users(iterable $users, NotificationPayload|array $payload, ?User $actor = null): Notification
    {
        $payload = $payload instanceof NotificationPayload
            ? $payload
            : NotificationPayload::from($payload);

        return app(NotificationService::class)->send($payload, $users, $actor);
    }
}
