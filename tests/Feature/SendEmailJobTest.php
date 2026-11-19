<?php

use App\Jobs\SendEmailJob;
use App\Mail\DynamicTemplateMail;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Mail\PendingMail;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Validation\ValidationException;

test('email service sends to a user by id and merges user fields without overwriting data keys', function () {
    Mail::fake();

    $user = User::factory()->create([
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
    ]);

    app(EmailService::class)->send($user->id, [
        'subject' => 'Account update',
        'custom_field' => 'value',
        'name' => 'Explicit Name',
    ], 'emails.example');

    Mail::assertSent(DynamicTemplateMail::class, function (DynamicTemplateMail $mail) use ($user): bool {
        return $mail->hasTo($user->email)
            && $mail->template === 'emails.example'
            && $mail->data['subject'] === 'Account update'
            && $mail->data['custom_field'] === 'value'
            && $mail->data['name'] === 'Explicit Name'
            && $mail->data['email'] === $user->email
            && $mail->data['user_id'] === $user->id;
    });
});

test('email service sends directly to an email address', function () {
    Mail::fake();

    app(EmailService::class)->send('test@example.com', [
        'subject' => 'Welcome!',
        'custom_field' => 'value',
    ], 'emails.example');

    Mail::assertSent(DynamicTemplateMail::class, function (DynamicTemplateMail $mail): bool {
        return $mail->hasTo('test@example.com')
            && $mail->data['subject'] === 'Welcome!'
            && $mail->data['custom_field'] === 'value'
            && ! array_key_exists('user_id', $mail->data);
    });
});

test('email service rejects a missing subject', function () {
    Mail::fake();

    expect(fn () => app(EmailService::class)->send('test@example.com', [
        'custom_field' => 'value',
    ], 'emails.example'))->toThrow(ValidationException::class);

    Mail::assertNothingSent();
});

test('email service rejects an invalid recipient', function () {
    Mail::fake();

    expect(fn () => app(EmailService::class)->send('not-an-email-or-id', [
        'subject' => 'Hello',
    ], 'emails.example'))->toThrow(ValidationException::class);

    Mail::assertNothingSent();
});

test('email service logs and rethrows when sending fails', function () {
    $pending = Mockery::mock(PendingMail::class);
    $pending->shouldReceive('send')
        ->once()
        ->andThrow(new RuntimeException('SMTP connection failed'));

    Mail::shouldReceive('to')
        ->once()
        ->with('test@example.com')
        ->andReturn($pending);

    Log::shouldReceive('error')
        ->once()
        ->withArgs(function (string $message, array $context): bool {
            return $message === 'Email send failed'
                && ($context['email'] ?? null) === 'test@example.com'
                && ($context['template'] ?? null) === 'emails.example';
        });

    expect(fn () => app(EmailService::class)->send('test@example.com', [
        'subject' => 'Welcome!',
    ], 'emails.example'))->toThrow(RuntimeException::class, 'SMTP connection failed');
});

test('send email job validates before dispatch and does not queue invalid payloads', function () {
    Queue::fake();

    expect(fn () => SendEmailJob::dispatch('bad-recipient', [
        'subject' => 'Hello',
    ], 'emails.example'))->toThrow(ValidationException::class);

    expect(fn () => SendEmailJob::dispatch('test@example.com', [
        'custom_field' => 'value',
    ], 'emails.example'))->toThrow(ValidationException::class);

    Queue::assertNothingPushed();
});

test('send email job dispatches to the emails queue with without overlapping middleware', function () {
    Queue::fake();

    SendEmailJob::dispatch('test@example.com', [
        'subject' => 'Welcome!',
        'custom_field' => 'value',
    ], 'emails.example');

    Queue::assertPushed(SendEmailJob::class, function (SendEmailJob $job): bool {
        $middleware = $job->middleware();

        return $job->queue === 'emails'
            && $job->template === 'emails.example'
            && $job->data['subject'] === 'Welcome!'
            && count($middleware) === 1
            && $middleware[0] instanceof WithoutOverlapping;
    });
});

test('send email job handle delegates to the email service', function () {
    Mail::fake();

    $job = new SendEmailJob('test@example.com', [
        'subject' => 'Welcome!',
        'custom_field' => 'value',
    ], 'emails.example');

    $job->handle(app(EmailService::class));

    Mail::assertSent(DynamicTemplateMail::class, 'test@example.com');
});
