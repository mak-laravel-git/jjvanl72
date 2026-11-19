<?php

namespace App\Services;

use App\Data\NotificationPayload;
use App\Events\UserNotificationCreated;
use App\Models\Notification;
use App\Models\User;
use App\Models\UserNotification;
use App\Support\AppPermissions;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;

class NotificationService
{
    public function __construct(
        private DeviceNotificationService $deviceNotificationService,
    ) {}

    /**
     * @param  iterable<int, User|int>  $users
     */
    public function send(NotificationPayload $payload, iterable $users, ?User $actor = null): Notification
    {
        $userIds = $this->normalizeUserIds($users);

        $notification = DB::transaction(function () use ($payload, $userIds, $actor): Notification {
            $notification = Notification::query()->create([
                ...$payload->toArray(),
                'created_by' => $actor?->id,
            ]);

            if ($userIds === []) {
                return $notification;
            }

            $now = now();
            $rows = array_map(
                fn (int $userId): array => [
                    'notification_id' => $notification->id,
                    'user_id' => $userId,
                    'read_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
                $userIds,
            );

            UserNotification::query()->insert($rows);

            $recipients = UserNotification::query()
                ->with('notification')
                ->where('notification_id', $notification->id)
                ->whereIn('user_id', $userIds)
                ->get();

            foreach ($recipients as $recipient) {
                Event::dispatch(new UserNotificationCreated($recipient));
            }

            return $notification;
        });

        foreach ($userIds as $userId) {
            $this->deviceNotificationService->pushNotification($userId, [
                'title' => $payload->title,
                'body' => $payload->body,
                'data' => $payload->data ?? [],
            ]);
        }

        return $notification;
    }

    /**
     * @param  string|list<string>  $roles
     */
    public function sendToRole(NotificationPayload $payload, string|array $roles, ?User $actor = null): Notification
    {
        $roleNames = is_array($roles) ? $roles : [$roles];

        $users = User::query()
            ->role($roleNames, AppPermissions::GUARD)
            ->get();

        return $this->send($payload, $users, $actor);
    }

    public function sendToPermission(NotificationPayload $payload, string $permission, ?User $actor = null): Notification
    {
        $users = User::permission($permission, AppPermissions::GUARD)->get();

        return $this->send($payload, $users, $actor);
    }

    /**
     * @param  iterable<int, User|int>  $users
     * @return list<int>
     */
    private function normalizeUserIds(iterable $users): array
    {
        return Collection::wrap($users)
            ->map(function (User|int $user): int {
                return $user instanceof User ? $user->id : $user;
            })
            ->unique()
            ->values()
            ->all();
    }
}
