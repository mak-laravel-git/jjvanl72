<?php

namespace App\Services;

use App\Jobs\SendEmailJob;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class EmailChangeService
{
    public const STEP_CURRENT = 'current';

    public const STEP_NEW = 'new';

    private const CACHE_TTL_MINUTES = 15;

    private const MAX_ATTEMPTS = 5;

    private const CODE_LENGTH = 6;

    /**
     * @return array{pending: bool, pending_email: string|null, step: string|null}
     */
    public function status(User $user): array
    {
        $pendingEmail = $user->pending_email;
        $payload = $this->payload($user);

        if ($pendingEmail === null) {
            return [
                'pending' => false,
                'pending_email' => null,
                'step' => null,
            ];
        }

        return [
            'pending' => true,
            'pending_email' => $pendingEmail,
            'step' => $payload['step'] ?? self::STEP_CURRENT,
        ];
    }

    public function start(User $user, string $pendingEmail): void
    {
        $user->forceFill([
            'pending_email' => $pendingEmail,
        ])->save();

        $code = $this->generateCode();

        $this->storePayload($user, [
            'code' => $code,
            'step' => self::STEP_CURRENT,
            'pending_email' => $pendingEmail,
            'attempts' => 0,
        ]);

        $this->sendCurrentEmailCode($user, $code);
    }

    public function verifyCurrent(User $user, string $code): void
    {
        $payload = $this->requirePayload($user, self::STEP_CURRENT);

        $this->assertCodeMatches($user, $payload, $code);

        $pendingEmail = $payload['pending_email'];
        $newCode = $this->generateCode();

        $this->storePayload($user, [
            'code' => $newCode,
            'step' => self::STEP_NEW,
            'pending_email' => $pendingEmail,
            'attempts' => 0,
        ]);

        $this->sendNewEmailCode($user, $pendingEmail, $newCode);
    }

    public function verifyNew(User $user, string $code): void
    {
        $payload = $this->requirePayload($user, self::STEP_NEW);

        $this->assertCodeMatches($user, $payload, $code);

        $pendingEmail = $payload['pending_email'];

        $user->forceFill([
            'email' => $pendingEmail,
            'pending_email' => null,
            'email_verified_at' => now(),
        ])->save();

        $user->searchable();

        $this->forget($user);
    }

    public function resend(User $user): void
    {
        $payload = $this->requirePayload($user);

        $code = $this->generateCode();
        $payload['code'] = $code;
        $payload['attempts'] = 0;

        $this->storePayload($user, $payload);

        if ($payload['step'] === self::STEP_NEW) {
            $this->sendNewEmailCode($user, $payload['pending_email'], $code);

            return;
        }

        $this->sendCurrentEmailCode($user, $code);
    }

    public function cancel(User $user): void
    {
        $user->forceFill([
            'pending_email' => null,
        ])->save();

        $this->forget($user);
    }

    /**
     * @return array{code: string, step: string, pending_email: string, attempts: int}|null
     */
    public function payload(User $user): ?array
    {
        /** @var array{code: string, step: string, pending_email: string, attempts: int}|null $payload */
        $payload = Cache::get($this->cacheKey($user));

        return $payload;
    }

    private function sendCurrentEmailCode(User $user, string $code): void
    {
        SendEmailJob::dispatch($user->id, [
            'subject' => 'Confirm your current email',
            'name' => $user->name,
            'code' => $code,
        ], 'emails.profile-verify-current');
    }

    private function sendNewEmailCode(User $user, string $pendingEmail, string $code): void
    {
        SendEmailJob::dispatch($pendingEmail, [
            'subject' => 'Confirm your new email',
            'name' => $user->name,
            'code' => $code,
            'pending_email' => $pendingEmail,
        ], 'emails.profile-verify-new');
    }

    /**
     * @return array{code: string, step: string, pending_email: string, attempts: int}
     */
    private function requirePayload(User $user, ?string $expectedStep = null): array
    {
        if ($user->pending_email === null) {
            throw ValidationException::withMessages([
                'code' => 'There is no pending email change to verify.',
            ]);
        }

        $payload = $this->payload($user);

        if ($payload === null) {
            throw ValidationException::withMessages([
                'code' => 'Your verification code has expired. Please request a new one.',
            ]);
        }

        if ($expectedStep !== null && ($payload['step'] ?? null) !== $expectedStep) {
            throw ValidationException::withMessages([
                'code' => 'This verification step is not available right now.',
            ]);
        }

        return $payload;
    }

    /**
     * @param  array{code: string, step: string, pending_email: string, attempts: int}  $payload
     */
    private function assertCodeMatches(User $user, array $payload, string $code): void
    {
        if (($payload['attempts'] ?? 0) >= self::MAX_ATTEMPTS) {
            $this->forget($user);

            throw ValidationException::withMessages([
                'code' => 'Too many incorrect attempts. Please restart the email change.',
            ]);
        }

        if (! hash_equals($payload['code'], $code)) {
            $payload['attempts'] = ($payload['attempts'] ?? 0) + 1;
            $this->storePayload($user, $payload);

            throw ValidationException::withMessages([
                'code' => 'The verification code is invalid.',
            ]);
        }
    }

    /**
     * @param  array{code: string, step: string, pending_email: string, attempts: int}  $payload
     */
    private function storePayload(User $user, array $payload): void
    {
        Cache::put(
            $this->cacheKey($user),
            $payload,
            now()->addMinutes(self::CACHE_TTL_MINUTES),
        );
    }

    private function forget(User $user): void
    {
        Cache::forget($this->cacheKey($user));
    }

    private function cacheKey(User $user): string
    {
        return 'email-change:'.$user->id;
    }

    private function generateCode(): string
    {
        return str_pad((string) random_int(0, 999_999), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }
}
