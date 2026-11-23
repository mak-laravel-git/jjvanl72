<?php

use App\Enums\UserAvailability;
use App\Jobs\SendEmailJob;
use App\Models\DentalClient;
use App\Models\User;
use App\Services\EmailChangeService;
use App\Support\AppPermissions;
use App\Support\UserProfilePreferences;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

function createDentist(array $overrides = []): User
{
    test()->seed(RolePermissionSeeder::class);

    if (! array_key_exists('client_id', $overrides)) {
        $overrides['client_id'] = DentalClient::factory()->create([
            'name' => 'SmileWorks Dental Clinic',
        ])->id;
    }

    $dentist = User::factory()->create(array_merge([
        'name' => 'Dr. Sarah Mitchell',
        'email' => 'dentist-profile@dev.com',
        'phone' => '+1 512-555-0142',
        'location' => 'Austin, TX',
        'password' => Hash::make('password'),
    ], $overrides));

    $dentist->assignRole(AppPermissions::DENTIST_ROLE);

    return $dentist;
}

test('dentist can view dynamic profile settings', function () {
    $dentist = createDentist();

    $this->actingAs($dentist)
        ->get(route('user-profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('backend/User/ProfileSettings')
            ->where('profile.name', 'Dr. Sarah Mitchell')
            ->where('profile.email', 'dentist-profile@dev.com')
            ->where('profile.phone', '+1 512-555-0142')
            ->where('profile.location', 'Austin, TX')
            ->where('profile.business_name', 'SmileWorks Dental Clinic')
            ->where('profile.can_manage_business_name', true)
            ->where('profile.role_label', AppPermissions::DENTIST_ROLE)
            ->where('profile.availability', UserAvailability::Available->value)
            ->where('profile.notification_preferences.push_notifications', true)
            ->where('profile.notification_preferences.system_notifications', true)
            ->where('profile.notification_preferences.email_notifications', true)
            ->where('profile.notification_preference_labels.push_notifications', 'Push Notifications')
            ->missing('profile.notification_preferences.design_ready_for_review')
            ->has('canUseTwoFactor')
            ->where('emailChange.pending', false)
        );
});

test('dentist can update profile details without changing email', function () {
    $dentist = createDentist();

    $this->actingAs($dentist)
        ->post(route('user-profile.update'), [
            'name' => 'Dr. Updated Mitchell',
            'email' => $dentist->email,
            'business_name' => 'Updated Smile Clinic',
            'phone' => '+1 555-0199',
            'location' => 'Dallas, TX',
            'availability' => UserAvailability::Available->value,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('user-profile.edit'));

    $dentist->refresh();

    expect($dentist->name)->toBe('Dr. Updated Mitchell');
    expect($dentist->email)->toBe('dentist-profile@dev.com');
    expect($dentist->phone)->toBe('+1 555-0199');
    expect($dentist->location)->toBe('Dallas, TX');
    expect($dentist->client?->name)->toBe('Updated Smile Clinic');
});

test('dentist can update availability and notification preferences', function () {
    $dentist = createDentist();

    $preferences = UserProfilePreferences::defaults();
    $preferences[UserProfilePreferences::PUSH_NOTIFICATIONS] = false;
    $preferences[UserProfilePreferences::SYSTEM_NOTIFICATIONS] = false;

    $this->actingAs($dentist)
        ->post(route('user-profile.update'), [
            'name' => $dentist->name,
            'email' => $dentist->email,
            'business_name' => 'SmileWorks Dental Clinic',
            'availability' => UserAvailability::Busy->value,
            'notification_preferences' => $preferences,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('user-profile.edit'));

    $dentist->refresh();

    expect($dentist->availability)->toBe(UserAvailability::Busy);
    expect($dentist->wants_push_notifications)->toBeFalse();
    expect($dentist->wants_system_notifications)->toBeFalse();
    expect($dentist->wants_email_notifications)->toBeTrue();
});

test('dentist can update password with current password', function () {
    $dentist = createDentist();

    $this->actingAs($dentist)
        ->post(route('user-profile.update'), [
            'name' => $dentist->name,
            'email' => $dentist->email,
            'business_name' => 'SmileWorks Dental Clinic',
            'availability' => UserAvailability::Available->value,
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('user-profile.edit'));

    expect(Hash::check('new-password', $dentist->refresh()->password))->toBeTrue();
});

test('dentist password update requires the current password', function () {
    $dentist = createDentist();

    $this->actingAs($dentist)
        ->from(route('user-profile.edit'))
        ->post(route('user-profile.update'), [
            'name' => $dentist->name,
            'email' => $dentist->email,
            'business_name' => 'SmileWorks Dental Clinic',
            'availability' => UserAvailability::Available->value,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertSessionHasErrors('current_password')
        ->assertRedirect(route('user-profile.edit'));
});

test('dentist profile update requires business name when linked to a client', function () {
    $dentist = createDentist();

    $this->actingAs($dentist)
        ->from(route('user-profile.edit'))
        ->post(route('user-profile.update'), [
            'name' => $dentist->name,
            'email' => $dentist->email,
            'business_name' => '',
            'availability' => UserAvailability::Available->value,
        ])
        ->assertSessionHasErrors('business_name')
        ->assertRedirect(route('user-profile.edit'));
});

function createDesigner(array $overrides = []): User
{
    test()->seed(RolePermissionSeeder::class);

    $designer = User::factory()->create(array_merge([
        'name' => 'Alex Rivera',
        'email' => 'designer-profile@dev.com',
        'phone' => '+1 512-555-0188',
        'location' => 'Austin, TX',
        'password' => Hash::make('password'),
    ], $overrides));

    $designer->assignRole(AppPermissions::DESIGNER_ROLE);

    return $designer;
}

test('designer can view dynamic profile settings', function () {
    $designer = createDesigner();

    $this->actingAs($designer)
        ->get(route('user-profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('backend/User/ProfileSettings')
            ->where('profile.name', 'Alex Rivera')
            ->where('profile.email', 'designer-profile@dev.com')
            ->where('profile.phone', '+1 512-555-0188')
            ->where('profile.location', 'Austin, TX')
            ->where('profile.role_label', AppPermissions::DESIGNER_ROLE)
            ->where('profile.availability', UserAvailability::Available->value)
            ->where('profile.notification_preferences.push_notifications', true)
            ->where('profile.notification_preference_labels.email_notifications', 'Email Notifications')
            ->missing('profile.notification_preferences.new_case_assigned')
            ->has('canUseTwoFactor')
        );
});

test('designer can update availability and notification preferences', function () {
    $designer = createDesigner();

    $preferences = UserProfilePreferences::defaults();
    $preferences[UserProfilePreferences::EMAIL_NOTIFICATIONS] = false;
    $preferences[UserProfilePreferences::SYSTEM_NOTIFICATIONS] = false;

    $this->actingAs($designer)
        ->post(route('user-profile.update'), [
            'name' => $designer->name,
            'email' => $designer->email,
            'availability' => UserAvailability::Away->value,
            'notification_preferences' => $preferences,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('user-profile.edit'));

    $designer->refresh();

    expect($designer->availability)->toBe(UserAvailability::Away);
    expect($designer->wants_email_notifications)->toBeFalse();
    expect($designer->wants_system_notifications)->toBeFalse();
    expect($designer->wants_push_notifications)->toBeTrue();
});

function createManufacturer(array $overrides = []): User
{
    test()->seed(RolePermissionSeeder::class);

    $manufacturer = User::factory()->create(array_merge([
        'name' => 'Max Smith',
        'email' => 'manufacturer-profile-update@dev.com',
        'phone' => '+1 303-555-0177',
        'location' => 'Denver, CO',
        'password' => Hash::make('password'),
    ], $overrides));

    $manufacturer->assignRole(AppPermissions::MANUFACTURER_ROLE);

    return $manufacturer;
}

test('manufacturer can view dynamic profile settings', function () {
    $manufacturer = createManufacturer([
        'company_name' => 'Precision Manufacturing Inc.',
        'business_registration' => 'BN123456789',
        'production_capacity' => 15,
    ]);

    $this->actingAs($manufacturer)
        ->get(route('user-profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('backend/User/ProfileSettings')
            ->where('profile.name', 'Max Smith')
            ->where('profile.email', 'manufacturer-profile-update@dev.com')
            ->where('profile.phone', '+1 303-555-0177')
            ->where('profile.location', 'Denver, CO')
            ->where('profile.company_name', 'Precision Manufacturing Inc.')
            ->where('profile.business_registration', 'BN123456789')
            ->where('profile.production_capacity', 15)
            ->where('profile.role_label', AppPermissions::MANUFACTURER_ROLE)
            ->where('profile.notification_preferences.push_notifications', true)
            ->where('profile.notification_preference_labels.system_notifications', 'System Notifications')
            ->missing('profile.notification_preferences.new_job_assignments')
            ->has('canUseTwoFactor')
        );
});

test('manufacturer can update company details and notification preferences', function () {
    $manufacturer = createManufacturer();

    $preferences = UserProfilePreferences::defaults();
    $preferences[UserProfilePreferences::PUSH_NOTIFICATIONS] = false;
    $preferences[UserProfilePreferences::SYSTEM_NOTIFICATIONS] = false;

    $this->actingAs($manufacturer)
        ->post(route('user-profile.update'), [
            'name' => 'Max Updated',
            'email' => $manufacturer->email,
            'phone' => '+1 303-555-0199',
            'location' => 'Boulder, CO',
            'company_name' => 'Texure Factory',
            'business_registration' => 'BN987654321',
            'production_capacity' => 20,
            'availability' => UserAvailability::Available->value,
            'notification_preferences' => $preferences,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('user-profile.edit'));

    $manufacturer->refresh();

    expect($manufacturer->name)->toBe('Max Updated');
    expect($manufacturer->email)->toBe('manufacturer-profile-update@dev.com');
    expect($manufacturer->phone)->toBe('+1 303-555-0199');
    expect($manufacturer->location)->toBe('Boulder, CO');
    expect($manufacturer->company_name)->toBe('Texure Factory');
    expect($manufacturer->business_registration)->toBe('BN987654321');
    expect($manufacturer->production_capacity)->toBe(20);
    expect($manufacturer->wants_push_notifications)->toBeFalse();
    expect($manufacturer->wants_system_notifications)->toBeFalse();
    expect($manufacturer->wants_email_notifications)->toBeTrue();
});

test('portal email change keeps current email and queues verification', function () {
    Queue::fake();

    $dentist = createDentist([
        'email_verified_at' => now(),
    ]);
    $verifiedAt = $dentist->email_verified_at;

    $this->actingAs($dentist)
        ->post(route('user-profile.update'), [
            'name' => 'Dr. Updated Mitchell',
            'email' => 'new-dentist@dev.com',
            'business_name' => 'SmileWorks Dental Clinic',
            'phone' => '+1 555-0199',
            'location' => 'Dallas, TX',
            'availability' => UserAvailability::Available->value,
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('email_change_started', true)
        ->assertRedirect(route('user-profile.edit'));

    $dentist->refresh();

    expect($dentist->name)->toBe('Dr. Updated Mitchell');
    expect($dentist->email)->toBe('dentist-profile@dev.com');
    expect($dentist->pending_email)->toBe('new-dentist@dev.com');
    expect($dentist->email_verified_at?->eq($verifiedAt))->toBeTrue();

    Queue::assertPushed(SendEmailJob::class, function (SendEmailJob $job) use ($dentist): bool {
        return $job->recipient === $dentist->id
            && $job->template === 'emails.profile-verify-current';
    });
});

test('portal email change completes after both otp steps', function () {
    Queue::fake();

    $dentist = createDentist();
    $service = app(EmailChangeService::class);
    $service->start($dentist, 'final-dentist@dev.com');
    $service->verifyCurrent($dentist, $service->payload($dentist)['code']);

    $code = $service->payload($dentist)['code'];

    $this->actingAs($dentist)
        ->post(route('user-profile.email-change.verify-new'), [
            'code' => $code,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('user-profile.edit'));

    $dentist->refresh();

    expect($dentist->email)->toBe('final-dentist@dev.com');
    expect($dentist->pending_email)->toBeNull();
    expect($dentist->email_verified_at)->not->toBeNull();
});
