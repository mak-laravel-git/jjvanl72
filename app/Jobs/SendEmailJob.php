<?php

namespace App\Jobs;

use App\Services\EmailService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;
use Throwable;

class SendEmailJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /**
     * @var list<int>
     */
    public array $backoff = [10, 30, 60];

    public int $timeout = 120;

    /**
     * Queueable email send that delegates to EmailService.
     *
     * No-overlap: WithoutOverlapping('send-email') acquires a cache lock for the
     * duration of handle(). Only one SendEmailJob runs at a time across all workers
     * (including the dual Supervisord processes). Overlaps are released and retried
     * after releaseAfter(30), so $tries / $backoff for SMTP failures never run two
     * sends concurrently. The `emails` queue isolates these jobs; the lock enforces
     * single-flight execution.
     *
     * @param  array<string, mixed>  $data
     */
    public function __construct(
        public int|string $recipient,
        public array $data,
        public string $template,
    ) {
        $this->onQueue('emails');

        app(EmailService::class)->validate($this->recipient, $this->data);
    }

    /**
     * @return list<object>
     */
    public function middleware(): array
    {
        return [
            (new WithoutOverlapping('send-email'))
                ->releaseAfter(30)
                ->expireAfter(180),
        ];
    }

    public function handle(EmailService $emails): void
    {
        $emails->send($this->recipient, $this->data, $this->template);
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('SendEmailJob failed permanently', [
            'recipient' => $this->recipient,
            'template' => $this->template,
            'subject' => $this->data['subject'] ?? null,
            'exception' => $exception?->getMessage(),
        ]);
    }
}
