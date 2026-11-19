<?php

namespace App\Services;

use App\Models\User;
use App\Services\Firebase\FirebasePushService;
use Illuminate\Support\Facades\Log;
use Throwable;

class DeviceNotificationService
{
    /**
     * @param  array{title?: string, body?: string|null, data?: array<string, mixed>}  $payload
     */
    public function pushNotification(int $userId, array $payload = []): void
    {
        $user = User::query()->find($userId);

        if (! $user) {
            Log::error('User not found for Firebase push notification', ['user_id' => $userId]);

            return;
        }

        $token = $user->device_token;

        if (! is_string($token) || $token === '') {
            return;
        }

        try {
            $sent = app(FirebasePushService::class)->sendToToken(
                $token,
                $payload['title'] ?? '',
                $payload['body'] ?? null,
                $payload['data'] ?? [],
            );
        } catch (Throwable $exception) {
            Log::warning('Firebase push skipped; messaging is unavailable.', [
                'user_id' => $userId,
                'error' => $exception->getMessage(),
            ]);

            return;
        }

        if (! $sent) {
            $user->forceFill(['device_token' => null])->save();
        }
    }
}
