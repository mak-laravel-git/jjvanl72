<?php

use App\Jobs\SendEmailJob;
use App\Services\DeviceNotificationService;
use Illuminate\Support\Facades\Route;

require __DIR__ . '/settings.php';
require __DIR__ . '/frontend.php';
require __DIR__ . '/fortify-extra.php';
require __DIR__ . '/user.php';
require __DIR__ . '/admin.php';

Route::get('/test-notification', function () {
    $deviceNotificationService = app(DeviceNotificationService::class);
    $deviceNotificationService->pushNotification(2, [
        'title' => 'Test Notification',
        'body' => 'This is a test notification',
    ]);
    return response()->json(['message' => 'Notification sent']);
});

Route::get('/test-email', function () {
    // dispatchSync runs immediately (no worker needed). Async use:
    // SendEmailJob::dispatch(...) with `php artisan queue:work redis --queue=emails`
    try {
        SendEmailJob::dispatchSync(1, [
            'subject' => 'Test Email',
            'body' => 'This is a test email',
        ], 'emails.example');
    } catch (Throwable $exception) {
        return response()->json([
            'message' => 'Email failed',
            'error' => $exception->getMessage(),
        ], 500);
    }

    return response()->json(['message' => 'Email sent']);
});
