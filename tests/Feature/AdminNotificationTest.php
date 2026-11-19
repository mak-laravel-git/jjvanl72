<?php

use App\Data\NotificationPayload;
use App\Enums\NotificationType;
use App\Events\UserNotificationCreated;
use App\Models\Notification;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\NotificationService;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

function createNotificationAdmin(array $permissions = ['notifications.view', 'notifications.broadcast']): User
{
    test()->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create([
        'email' => fake()->unique()->safeEmail(),
    ]);

    if (in_array('notifications.broadcast', $permissions, true)) {
        $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);
    } else {
        $admin->givePermissionTo([
            'admins.view',
            ...$permissions,
        ]);
    }

    return $admin;
}

test('notification service creates master and recipient rows', function () {
    Event::fake([UserNotificationCreated::class]);

    $admin = createNotificationAdmin();
    $recipient = User::factory()->create();

    $notification = app(NotificationService::class)->send(
        NotificationPayload::from([
            'title' => 'Test title',
            'body' => 'Test body',
            'type' => NotificationType::System,
        ]),
        [$recipient],
        $admin,
    );

    expect($notification)->toBeInstanceOf(Notification::class)
        ->and(UserNotification::query()->where('notification_id', $notification->id)->count())->toBe(1);

    Event::assertDispatched(UserNotificationCreated::class);
});

test('admins can view their notification inbox with filters', function () {
    Event::fake([UserNotificationCreated::class]);

    $admin = createNotificationAdmin();
    $other = createNotificationAdmin(['notifications.view']);

    app(NotificationService::class)->send(
        NotificationPayload::from([
            'title' => 'For admin',
            'body' => 'Hello',
            'type' => NotificationType::Case,
        ]),
        [$admin],
    );

    app(NotificationService::class)->send(
        NotificationPayload::from([
            'title' => 'For other',
            'body' => 'Hidden',
            'type' => NotificationType::Case,
        ]),
        [$other],
    );

    $this->actingAs($admin)
        ->get(route('admin.notifications.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('backend/Admin/Notifications/Index')
            ->has('notifications.data', 1)
            ->where('notifications.data.0.title', 'For admin'));

    $this->actingAs($admin)
        ->get(route('admin.notifications.index', ['filter' => 'unread']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('notifications.data', 1));
});

test('users cannot view another users notification', function () {
    Event::fake([UserNotificationCreated::class]);

    $admin = createNotificationAdmin();
    $other = createNotificationAdmin(['notifications.view']);

    app(NotificationService::class)->send(
        NotificationPayload::from([
            'title' => 'Private',
            'body' => 'Secret',
            'type' => NotificationType::System,
        ]),
        [$other],
    );

    $userNotification = UserNotification::query()->where('user_id', $other->id)->firstOrFail();

    $this->actingAs($admin)
        ->get(route('admin.notifications.show', $userNotification))
        ->assertForbidden();
});

test('mark read unread soft delete and mark all read work', function () {
    Event::fake([UserNotificationCreated::class]);

    $admin = createNotificationAdmin();

    app(NotificationService::class)->send(
        NotificationPayload::from([
            'title' => 'One',
            'body' => 'Body',
            'type' => NotificationType::System,
        ]),
        [$admin],
    );

    app(NotificationService::class)->send(
        NotificationPayload::from([
            'title' => 'Two',
            'body' => 'Body',
            'type' => NotificationType::System,
        ]),
        [$admin],
    );

    $first = UserNotification::query()->where('user_id', $admin->id)->oldest('id')->firstOrFail();
    $second = UserNotification::query()->where('user_id', $admin->id)->latest('id')->firstOrFail();

    $this->actingAs($admin)
        ->patch(route('admin.notifications.read', $first))
        ->assertRedirect();

    expect($first->fresh()->read_at)->not->toBeNull();

    $this->actingAs($admin)
        ->patch(route('admin.notifications.unread', $first))
        ->assertRedirect();

    expect($first->fresh()->read_at)->toBeNull();

    $this->actingAs($admin)
        ->post(route('admin.notifications.mark-all-read'))
        ->assertRedirect();

    expect(UserNotification::query()->where('user_id', $admin->id)->whereNull('read_at')->count())->toBe(0);

    $this->actingAs($admin)
        ->delete(route('admin.notifications.destroy', $second))
        ->assertRedirect(route('admin.notifications.index'));

    expect(UserNotification::withTrashed()->find($second->id)?->trashed())->toBeTrue()
        ->and(UserNotification::query()->find($second->id))->toBeNull();
});

test('broadcast endpoint requires permission and creates rows', function () {
    Event::fake([UserNotificationCreated::class]);

    $admin = createNotificationAdmin();
    $viewer = createNotificationAdmin(['notifications.view']);
    $recipient = User::factory()->create();
    $recipient->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($viewer)
        ->get(route('admin.notifications.broadcast'))
        ->assertForbidden();

    $this->actingAs($admin)
        ->post(route('admin.notifications.broadcast.store'), [
            'title' => 'Broadcast title',
            'body' => 'Broadcast body',
            'type' => NotificationType::Broadcast->value,
            'roles' => [AppPermissions::DENTIST_ROLE],
            'user_ids' => [],
        ])
        ->assertRedirect(route('admin.notifications.index'));

    expect(Notification::query()->where('title', 'Broadcast title')->exists())->toBeTrue()
        ->and(UserNotification::query()->where('user_id', $recipient->id)->exists())->toBeTrue();
});

test('shared unread count decreases after read', function () {
    Event::fake([UserNotificationCreated::class]);

    $admin = createNotificationAdmin();

    app(NotificationService::class)->send(
        NotificationPayload::from([
            'title' => 'Counted',
            'body' => 'Body',
            'type' => NotificationType::System,
        ]),
        [$admin],
    );

    $this->actingAs($admin)
        ->get(route('admin.notifications.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('unreadNotificationsCount', 1)
            ->where('unreadCount', 1));

    $item = UserNotification::query()->where('user_id', $admin->id)->firstOrFail();

    $this->actingAs($admin)
        ->get(route('admin.notifications.show', $item))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('admin.notifications.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('unreadNotificationsCount', 0)
            ->where('unreadCount', 0));
});

test('helpers notify user and users', function () {
    Event::fake([UserNotificationCreated::class]);

    $user = User::factory()->create();
    $other = User::factory()->create();

    notify_user($user, [
        'title' => 'Helper single',
        'body' => 'Body',
        'type' => NotificationType::User->value,
    ]);

    notify_users([$user, $other], [
        'title' => 'Helper multi',
        'body' => 'Body',
        'type' => NotificationType::User->value,
    ]);

    expect(UserNotification::query()->where('user_id', $user->id)->count())->toBe(2)
        ->and(UserNotification::query()->where('user_id', $other->id)->count())->toBe(1);
});
