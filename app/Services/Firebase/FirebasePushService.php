<?php

namespace App\Services\Firebase;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Exception\Messaging\NotFound;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;
use Kreait\Firebase\Messaging\WebPushConfig;

class FirebasePushService
{
    public function __construct(private Messaging $messaging) {}

    /**
     * Send one push to one device token. Returns false if the token
     * is dead so the caller can decide what to do with it.
     */
    public function sendToToken(string $token, string $title, ?string $body = null, array $data = []): bool
    {
        $message = $this->buildMessage($title, $body, $data)
            ->withToken($token);

        try {
            $this->messaging->send($message);

            return true;
        } catch (NotFound $e) {
            // token no longer valid on FCM's side
            return false;
        } catch (\Throwable $e) {
            Log::error('Firebase push failed', ['error' => $e->getMessage(), 'token' => $token]);

            return false;
        }
    }

    /**
     * Send to many tokens at once (more efficient than looping sendToToken).
     * Returns the tokens that failed, so the caller can clean them up.
     *
     * @param  list<string>  $tokens
     * @return list<string>
     */
    public function sendToTokens(array $tokens, string $title, ?string $body = null, array $data = []): array
    {
        if ($tokens === []) {
            return [];
        }

        $message = $this->buildMessage($title, $body, $data);

        $report = $this->messaging->sendMulticast($message, $tokens);

        $failedTokens = [];
        foreach ($report->failures()->getItems() as $failure) {
            $failedTokens[] = $failure->target()->value();
        }

        return $failedTokens;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function buildMessage(string $title, ?string $body, array $data): CloudMessage
    {
        $iconUrl = $this->assetUrl('images/push/icon.png');
        $badgeUrl = $this->assetUrl('images/push/badge.png');
        $clickLink = rtrim((string) config('app.url'), '/');

        return CloudMessage::new()
            ->withNotification(FirebaseNotification::create($title, $body ?? '', $iconUrl))
            ->withWebPushConfig(WebPushConfig::fromArray([
                'notification' => [
                    'title' => $title,
                    'body' => $body ?? '',
                    'icon' => $iconUrl,
                    'badge' => $badgeUrl,
                    'image' => $iconUrl,
                    'requireInteraction' => false,
                ],
                'fcm_options' => [
                    'link' => $clickLink,
                ],
            ]))
            ->withData($this->stringifyData([
                ...$data,
                'icon' => $iconUrl,
                'badge' => $badgeUrl,
                'click_action' => $clickLink,
            ]));
    }

    private function assetUrl(string $path): string
    {
        return rtrim((string) config('app.url'), '/').'/'.ltrim($path, '/');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, string>
     */
    private function stringifyData(array $data): array
    {
        return collect($data)->map(
            fn ($v) => is_scalar($v) ? (string) $v : json_encode($v)
        )->all();
    }
}
