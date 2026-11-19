<?php

namespace App\Services;

use App\Mail\DynamicTemplateMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class EmailService
{
    /**
     * Send an email to a user ID or email address using a Blade template.
     *
     * @param  array<string, mixed>  $data
     */
    public function send(int|string $recipient, array $data, string $template): void
    {
        $this->validate($recipient, $data);

        [$email, $viewData] = $this->resolveRecipient($recipient, $data);

        try {
            Mail::to($email)->send(new DynamicTemplateMail($template, $viewData));
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            Log::error('Email send failed', [
                'recipient' => $recipient,
                'email' => $email,
                'template' => $template,
                'subject' => $viewData['subject'] ?? null,
                'exception' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    /**
     * Fail fast when the recipient or subject is invalid (also used by SendEmailJob at dispatch time).
     *
     * @param  array<string, mixed>  $data
     */
    public function validate(int|string $recipient, array $data): void
    {
        if (! array_key_exists('subject', $data) || blank($data['subject'])) {
            throw ValidationException::withMessages([
                'subject' => 'A subject is required for every email.',
            ]);
        }

        if ($this->isEmailAddress($recipient)) {
            return;
        }

        if ($this->isUserId($recipient)) {
            $user = User::query()->find((int) $recipient);

            if ($user === null) {
                throw ValidationException::withMessages([
                    'recipient' => "No user found for ID [{$recipient}].",
                ]);
            }

            return;
        }

        throw ValidationException::withMessages([
            'recipient' => 'Recipient must be a valid user ID or email address.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{0: string, 1: array<string, mixed>}
     */
    private function resolveRecipient(int|string $recipient, array $data): array
    {
        if ($this->isEmailAddress($recipient)) {
            return [(string) $recipient, $data];
        }

        $user = User::query()->findOrFail((int) $recipient);

        $userFields = [
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];

        return [$user->email, array_merge($userFields, $data)];
    }

    private function isEmailAddress(int|string $recipient): bool
    {
        return is_string($recipient)
            && filter_var($recipient, FILTER_VALIDATE_EMAIL) !== false;
    }

    private function isUserId(int|string $recipient): bool
    {
        return is_int($recipient) || (is_string($recipient) && is_numeric($recipient));
    }
}
