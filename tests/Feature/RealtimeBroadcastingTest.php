<?php

use App\Enums\NotificationType;
use App\Events\ReverbPingEvent;
use App\Events\UserNotificationCreated;
use App\Models\Notification;
use App\Models\User;
use App\Models\UserNotification;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

function createRealtimeAdmin(): User
{
    test()->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create([
        'email' => fake()->unique()->safeEmail(),
    ]);
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

function useReverbBroadcasterForAuth(): void
{
    // Null/log broadcasters no-op auth (empty 200). Reverb/Pusher run real channel checks.
    // Channels registered at boot live on the default (null) driver — re-register after switching.
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb.key' => 'test-key',
        'broadcasting.connections.reverb.secret' => 'test-secret',
        'broadcasting.connections.reverb.app_id' => 'test-id',
        'broadcasting.connections.reverb.options.host' => 'localhost',
        'broadcasting.connections.reverb.options.port' => 443,
        'broadcasting.connections.reverb.options.scheme' => 'https',
        'broadcasting.connections.reverb.options.useTLS' => true,
    ]);

    Broadcast::channel(
        'App.Models.User.{id}',
        function (User $user, int $id): bool {
            return (int) $user->id === $id;
        },
    );
}

test('guest cannot authorize private user channel', function () {
    useReverbBroadcasterForAuth();

    $user = User::factory()->create();

    $this->postJson('/broadcasting/auth', [
        'channel_name' => 'private-App.Models.User.'.$user->id,
        'socket_id' => '1234.5678',
    ])->assertForbidden();
});

test('user can authorize their own private channel', function () {
    useReverbBroadcasterForAuth();

    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/broadcasting/auth', [
            'channel_name' => 'private-App.Models.User.'.$user->id,
            'socket_id' => '1234.5678',
        ])
        ->assertSuccessful();
});

test('user cannot authorize another users private channel', function () {
    useReverbBroadcasterForAuth();

    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/broadcasting/auth', [
            'channel_name' => 'private-App.Models.User.'.$other->id,
            'socket_id' => '1234.5678',
        ])
        ->assertForbidden();
});

test('user notification created broadcasts on private user channel as notification.created', function () {
    $user = User::factory()->create();
    $recipient = UserNotification::query()->create([
        'notification_id' => Notification::query()->create([
            'type' => NotificationType::System,
            'title' => 'Channel check',
            'body' => 'Body',
            'icon' => 'notif-system.svg',
            'icon_bg' => '#e0f2fe',
        ])->id,
        'user_id' => $user->id,
    ]);

    $event = new UserNotificationCreated($recipient->load('notification'));

    expect($event->broadcastAs())->toBe('notification.created');
    expect($event->broadcastOn())->toHaveCount(1);
    expect($event->broadcastOn()[0])->toBeInstanceOf(PrivateChannel::class);
    expect($event->broadcastOn()[0]->name)->toBe('private-App.Models.User.'.$user->id);
});

test('cors allows configured origin on broadcasting auth options', function () {
    config([
        'cors.allowed_origins' => ['http://localhost:8000'],
        'cors.supports_credentials' => true,
        'cors.paths' => ['broadcasting/auth', 'broadcasting/*', 'admin/realtime/*'],
    ]);

    $response = $this->call(
        'OPTIONS',
        '/broadcasting/auth',
        [],
        [],
        [],
        [
            'HTTP_ORIGIN' => 'http://localhost:8000',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ],
    );

    $response->assertSuccessful();
    expect($response->headers->get('Access-Control-Allow-Origin'))->toBe('http://localhost:8000');
    expect($response->headers->get('Access-Control-Allow-Credentials'))->toBe('true');
});

test('cors rejects unknown origin on broadcasting auth options', function () {
    config([
        'cors.allowed_origins' => ['http://localhost:8000'],
        'cors.supports_credentials' => true,
        'cors.paths' => ['broadcasting/auth', 'broadcasting/*', 'admin/realtime/*'],
    ]);

    $response = $this->call(
        'OPTIONS',
        '/broadcasting/auth',
        [],
        [],
        [],
        [
            'HTTP_ORIGIN' => 'https://evil.example',
            'HTTP_ACCESS_CONTROL_REQUEST_METHOD' => 'POST',
        ],
    );

    expect($response->headers->get('Access-Control-Allow-Origin'))->not->toBe('https://evil.example');
});

test('guest cannot access realtime diagnostics', function () {
    $this->getJson('/admin/realtime/health')->assertUnauthorized();
    $this->getJson('/admin/realtime/ping')->assertUnauthorized();
    $this->postJson('/admin/realtime/test-notification')->assertUnauthorized();
});

test('admin can fetch realtime health without secrets', function () {
    $admin = createRealtimeAdmin();

    $response = $this->actingAs($admin)
        ->getJson('/admin/realtime/health')
        ->assertOk()
        ->assertJsonPath('status', true);

    $data = $response->json('data');
    expect($data)->toHaveKeys(['broadcast_connection', 'host', 'port', 'scheme', 'app_key_preview']);
    expect($data)->not->toHaveKey('secret');
    expect($data)->not->toHaveKey('app_secret');
});

test('admin can dispatch public reverb ping', function () {
    Event::fake([ReverbPingEvent::class]);

    $admin = createRealtimeAdmin();

    $this->actingAs($admin)
        ->getJson('/admin/realtime/ping?message=Hello')
        ->assertOk()
        ->assertJsonPath('data.channel', 'reverb-ping')
        ->assertJsonPath('data.event', 'ping');

    Event::assertDispatched(ReverbPingEvent::class, function (ReverbPingEvent $event): bool {
        return $event->message === 'Hello'
            && $event->broadcastAs() === 'ping'
            && $event->broadcastOn()[0]->name === 'reverb-ping';
    });
});

test('admin can dispatch private test notification', function () {
    Event::fake([UserNotificationCreated::class]);

    $admin = createRealtimeAdmin();

    $this->actingAs($admin)
        ->postJson('/admin/realtime/test-notification')
        ->assertOk()
        ->assertJsonPath('data.channel', 'App.Models.User.'.$admin->id)
        ->assertJsonPath('data.event', 'notification.created');

    Event::assertDispatched(UserNotificationCreated::class);
});

test('admin can open realtime console page', function () {
    $admin = createRealtimeAdmin();

    $this->actingAs($admin)
        ->withoutVite()
        ->get('/admin/realtime')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('backend/Admin/Realtime/Index'));
});
