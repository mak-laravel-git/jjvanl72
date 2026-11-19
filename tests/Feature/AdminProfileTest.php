<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

function createProfileAdmin(array $overrides = []): User
{
    test()->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create(array_merge([
        'name' => 'Admin User',
        'email' => 'admin-profile@dev.com',
        'phone' => null,
        'location' => null,
        'password' => Hash::make('password'),
    ], $overrides));

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

test('guests are redirected from admin profile', function () {
    $this->get(route('admin.profile.edit'))
        ->assertRedirect(route('login'));
});

test('portal users cannot access admin profile', function () {
    $this->seed(RolePermissionSeeder::class);

    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('admin.profile.edit'))
        ->assertForbidden();
});

test('admin can view profile settings page', function () {
    $admin = createProfileAdmin([
        'phone' => '+1 555-0100',
        'location' => 'Austin, TX',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('backend/Admin/Profile/Edit')
            ->where('profile.name', 'Admin User')
            ->where('profile.email', 'admin-profile@dev.com')
            ->where('profile.phone', '+1 555-0100')
            ->where('profile.location', 'Austin, TX')
            ->where('profile.role_label', AppPermissions::SUPER_ADMIN_ROLE)
            ->where('profile.status_label', 'Active')
            ->has('canUseTwoFactor')
            ->where('emailChange.pending', false)
        );
});

test('admin can update profile details without changing email', function () {
    $admin = createProfileAdmin();

    $this->actingAs($admin)
        ->post(route('admin.profile.update'), [
            'name' => 'Updated Admin',
            'email' => $admin->email,
            'phone' => '+1 555-0199',
            'location' => 'Dallas, TX',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.profile.edit'));

    $admin->refresh();

    expect($admin->name)->toBe('Updated Admin');
    expect($admin->email)->toBe('admin-profile@dev.com');
    expect($admin->phone)->toBe('+1 555-0199');
    expect($admin->location)->toBe('Dallas, TX');
});

test('email verification is kept when email is unchanged', function () {
    $admin = createProfileAdmin();
    $verifiedAt = $admin->email_verified_at;

    $this->actingAs($admin)
        ->post(route('admin.profile.update'), [
            'name' => 'Admin User',
            'email' => $admin->email,
            'phone' => '+1 555-0111',
            'location' => 'Houston, TX',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.profile.edit'));

    expect($admin->refresh()->email_verified_at?->eq($verifiedAt))->toBeTrue();
});

test('admin can update password with current password', function () {
    $admin = createProfileAdmin();

    $this->actingAs($admin)
        ->post(route('admin.profile.update'), [
            'name' => $admin->name,
            'email' => $admin->email,
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.profile.edit'));

    expect(Hash::check('new-password', $admin->refresh()->password))->toBeTrue();
});

test('password update requires the current password', function () {
    $admin = createProfileAdmin();

    $this->actingAs($admin)
        ->from(route('admin.profile.edit'))
        ->post(route('admin.profile.update'), [
            'name' => $admin->name,
            'email' => $admin->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertSessionHasErrors('current_password')
        ->assertRedirect(route('admin.profile.edit'));
});

test('profile update rejects duplicate emails', function () {
    createProfileAdmin(['email' => 'taken@dev.com']);
    $admin = createProfileAdmin(['email' => 'free@dev.com']);

    $this->actingAs($admin)
        ->from(route('admin.profile.edit'))
        ->post(route('admin.profile.update'), [
            'name' => $admin->name,
            'email' => 'taken@dev.com',
        ])
        ->assertSessionHasErrors('email')
        ->assertRedirect(route('admin.profile.edit'));
});
