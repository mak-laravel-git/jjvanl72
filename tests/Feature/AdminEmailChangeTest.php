<?php

use App\Jobs\SendEmailJob;
use App\Models\User;
use App\Services\EmailChangeService;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

function createEmailChangeAdmin(array $overrides = []): User
{
    test()->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create(array_merge([
        'name' => 'Admin User',
        'email' => 'admin-email-change@dev.com',
        'phone' => null,
        'location' => null,
        'password' => Hash::make('password'),
    ], $overrides));

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

test('email change keeps current email and queues current verification code', function () {
    Queue::fake();

    $admin = createEmailChangeAdmin([
        'email_verified_at' => now(),
    ]);
    $verifiedAt = $admin->email_verified_at;

    $this->actingAs($admin)
        ->post(route('admin.profile.update'), [
            'name' => 'Updated Admin',
            'email' => 'new-admin@dev.com',
            'phone' => '+1 555-0199',
            'location' => 'Dallas, TX',
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('email_change_started', true)
        ->assertRedirect(route('admin.profile.edit'));

    $admin->refresh();

    expect($admin->name)->toBe('Updated Admin');
    expect($admin->email)->toBe('admin-email-change@dev.com');
    expect($admin->pending_email)->toBe('new-admin@dev.com');
    expect($admin->phone)->toBe('+1 555-0199');
    expect($admin->location)->toBe('Dallas, TX');
    expect($admin->email_verified_at?->eq($verifiedAt))->toBeTrue();

    Queue::assertPushed(SendEmailJob::class, function (SendEmailJob $job) use ($admin): bool {
        return $job->recipient === $admin->id
            && $job->template === 'emails.profile-verify-current'
            && ($job->data['subject'] ?? null) === 'Confirm your current email'
            && isset($job->data['code']);
    });
});

test('profile page exposes pending email change state', function () {
    Queue::fake();

    $admin = createEmailChangeAdmin();

    app(EmailChangeService::class)->start($admin, 'pending@dev.com');

    $this->actingAs($admin)
        ->get(route('admin.profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('backend/Admin/Profile/Edit')
            ->where('emailChange.pending', true)
            ->where('emailChange.pending_email', 'pending@dev.com')
            ->where('emailChange.step', EmailChangeService::STEP_CURRENT)
        );
});

test('verifying current email advances to new email step', function () {
    Queue::fake();

    $admin = createEmailChangeAdmin();
    $service = app(EmailChangeService::class);
    $service->start($admin, 'new-admin@dev.com');

    $code = $service->payload($admin)['code'];

    Queue::fake();

    $this->actingAs($admin)
        ->post(route('admin.profile.email-change.verify-current'), [
            'code' => $code,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.profile.edit'));

    expect($service->status($admin->fresh())['step'])->toBe(EmailChangeService::STEP_NEW);

    Queue::assertPushed(SendEmailJob::class, function (SendEmailJob $job): bool {
        return $job->recipient === 'new-admin@dev.com'
            && $job->template === 'emails.profile-verify-new'
            && ($job->data['subject'] ?? null) === 'Confirm your new email';
    });
});

test('verifying new email applies pending address', function () {
    Queue::fake();

    $admin = createEmailChangeAdmin([
        'email_verified_at' => now()->subDay(),
    ]);
    $service = app(EmailChangeService::class);
    $service->start($admin, 'final-admin@dev.com');
    $service->verifyCurrent($admin, $service->payload($admin)['code']);

    $code = $service->payload($admin)['code'];

    $this->actingAs($admin)
        ->post(route('admin.profile.email-change.verify-new'), [
            'code' => $code,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.profile.edit'));

    $admin->refresh();

    expect($admin->email)->toBe('final-admin@dev.com');
    expect($admin->pending_email)->toBeNull();
    expect($admin->email_verified_at)->not->toBeNull();
    expect($service->status($admin)['pending'])->toBeFalse();
});

test('invalid verification code is rejected', function () {
    Queue::fake();

    $admin = createEmailChangeAdmin();
    app(EmailChangeService::class)->start($admin, 'new-admin@dev.com');

    $this->actingAs($admin)
        ->from(route('admin.profile.edit'))
        ->post(route('admin.profile.email-change.verify-current'), [
            'code' => '000000',
        ])
        ->assertSessionHasErrors('code')
        ->assertRedirect(route('admin.profile.edit'));
});

test('email change can be cancelled', function () {
    Queue::fake();

    $admin = createEmailChangeAdmin();
    app(EmailChangeService::class)->start($admin, 'new-admin@dev.com');

    $this->actingAs($admin)
        ->post(route('admin.profile.email-change.cancel'))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.profile.edit'));

    $admin->refresh();

    expect($admin->pending_email)->toBeNull();
    expect($admin->email)->toBe('admin-email-change@dev.com');
});

test('profile update rejects email taken as another pending email', function () {
    Queue::fake();

    $other = createEmailChangeAdmin(['email' => 'other@dev.com']);
    $other->forceFill(['pending_email' => 'held@dev.com'])->save();

    $admin = createEmailChangeAdmin(['email' => 'free-admin@dev.com']);

    $this->actingAs($admin)
        ->from(route('admin.profile.edit'))
        ->post(route('admin.profile.update'), [
            'name' => $admin->name,
            'email' => 'held@dev.com',
        ])
        ->assertSessionHasErrors('email')
        ->assertRedirect(route('admin.profile.edit'));
});
