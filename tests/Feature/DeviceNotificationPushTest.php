<?php

use App\Data\NotificationPayload;
use App\Enums\NotificationType;
use App\Events\UserNotificationCreated;
use App\Models\User;
use App\Services\DeviceNotificationService;
use App\Services\Firebase\FirebasePushService;
use App\Services\NotificationService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    if (! Schema::hasColumn('users', 'device_token')) {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('device_token', 512)->nullable();
        });
    }
});

test('notification service pushes via device notification service', function (): void {
    Event::fake([UserNotificationCreated::class]);

    $recipient = User::factory()->create([
        'device_token' => 'live-fcm-token',
    ]);

    $firebase = Mockery::mock(FirebasePushService::class);
    $firebase->shouldReceive('sendToToken')
        ->once()
        ->with('live-fcm-token', 'Push title', 'Push body', [])
        ->andReturn(true);

    $this->app->instance(FirebasePushService::class, $firebase);

    app(NotificationService::class)->send(
        NotificationPayload::from([
            'title' => 'Push title',
            'body' => 'Push body',
            'type' => NotificationType::System,
        ]),
        [$recipient],
    );
});

test('device notification service skips users without a token', function (): void {
    $user = User::factory()->create(['device_token' => null]);

    $firebase = Mockery::mock(FirebasePushService::class);
    $firebase->shouldNotReceive('sendToToken');

    $this->app->instance(FirebasePushService::class, $firebase);

    app(DeviceNotificationService::class)->pushNotification($user->id, [
        'title' => 'Ignored',
        'body' => 'Ignored',
    ]);
});

test('device notification service clears dead tokens', function (): void {
    $user = User::factory()->create([
        'device_token' => 'dead-fcm-token',
    ]);

    $firebase = Mockery::mock(FirebasePushService::class);
    $firebase->shouldReceive('sendToToken')
        ->once()
        ->andReturn(false);

    $this->app->instance(FirebasePushService::class, $firebase);

    app(DeviceNotificationService::class)->pushNotification($user->id, [
        'title' => 'Title',
        'body' => 'Body',
    ]);

    expect($user->fresh()->device_token)->toBeNull();
});
