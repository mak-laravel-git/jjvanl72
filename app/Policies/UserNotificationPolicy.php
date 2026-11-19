<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserNotification;

class UserNotificationPolicy
{
    public function view(User $user, UserNotification $userNotification): bool
    {
        return $this->owns($user, $userNotification) && $user->can('notifications.view');
    }

    public function update(User $user, UserNotification $userNotification): bool
    {
        return $this->owns($user, $userNotification) && $user->can('notifications.view');
    }

    public function delete(User $user, UserNotification $userNotification): bool
    {
        return $this->owns($user, $userNotification) && $user->can('notifications.view');
    }

    private function owns(User $user, UserNotification $userNotification): bool
    {
        return (int) $userNotification->user_id === (int) $user->id;
    }
}
