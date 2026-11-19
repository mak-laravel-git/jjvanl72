<?php

namespace App\Support;

use App\Models\User;

class UserProfilePreferences
{
    public const PUSH_NOTIFICATIONS = 'push_notifications';

    public const SYSTEM_NOTIFICATIONS = 'system_notifications';

    public const EMAIL_NOTIFICATIONS = 'email_notifications';

    /**
     * Shared channel preference keys for all portal users.
     *
     * @return array<string, string>
     */
    public static function channelLabels(): array
    {
        return [
            self::PUSH_NOTIFICATIONS => 'Push Notifications',
            self::SYSTEM_NOTIFICATIONS => 'System Notifications',
            self::EMAIL_NOTIFICATIONS => 'Email Notifications',
        ];
    }

    /**
     * @return list<string>
     */
    public static function channelKeys(): array
    {
        return array_keys(self::channelLabels());
    }

    /**
     * @return array<string, string>
     */
    public static function labelsFor(User $user): array
    {
        return self::channelLabels();
    }

    /**
     * @param  array<string, string>  $labels
     * @return array<string, bool>
     */
    public static function defaultsFromLabels(array $labels): array
    {
        return array_map(static fn (): bool => true, $labels);
    }

    /**
     * @return array<string, bool>
     */
    public static function defaults(): array
    {
        return self::defaultsFromLabels(self::channelLabels());
    }

    /**
     * @param  array<string, mixed>|null  $stored
     * @param  array<string, string>  $labels
     * @return array<string, bool>
     */
    public static function mergeNotifications(?array $stored, array $labels): array
    {
        $defaults = self::defaultsFromLabels($labels);

        if ($stored === null) {
            return $defaults;
        }

        $merged = $defaults;

        foreach ($defaults as $key => $default) {
            if (array_key_exists($key, $stored)) {
                $merged[$key] = (bool) $stored[$key];
            }
        }

        return $merged;
    }

    /**
     * @param  array<string, mixed>|null  $stored
     * @return array<string, bool>
     */
    public static function mergeFor(User $user, ?array $stored = null): array
    {
        return self::mergeNotifications(
            $stored ?? $user->notification_preferences,
            self::labelsFor($user),
        );
    }

    public static function wants(User $user, string $key): bool
    {
        $preferences = self::mergeFor($user);

        return (bool) ($preferences[$key] ?? true);
    }
}
