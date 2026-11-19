<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('login screen can be rendered', function () {
    $this->get(route('login'))->assertOk();
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create([
        'password' => Hash::make('password'),
    ]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $response = $this->actingAs($user)->post(route('logout'));

    $this->assertGuest();
    $response->assertRedirect(route('login'));
});

test('users are rejected with invalid credentials', function () {
    $user = User::factory()->create();

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors('email');
});

test('super admins are redirected to the admin dashboard after login', function () {
    $admin = User::factory()->create([
        'email' => 'shared-priority@dev.com',
        'password' => Hash::make('password'),
    ]);
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->post(route('login.store'), [
        'email' => 'shared-priority@dev.com',
        'password' => 'password',
    ])->assertRedirect(route('admin.dashboard'));

    $this->assertAuthenticatedAs($admin);
});

test('denturists are redirected to the portal dashboard after login', function () {
    $user = User::factory()->create([
        'name' => 'Dr. Alex Smith',
        'email' => 'denturist-login@dev.com',
        'password' => Hash::make('password'),
    ]);
    $user->assignRole(AppPermissions::DENTURIST_ROLE);

    $this->post(route('login.store'), [
        'email' => 'denturist-login@dev.com',
        'password' => 'password',
    ])->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
});

test('labs are redirected to the portal dashboard after login', function () {
    $user = User::factory()->create([
        'name' => 'Valley Dental Lab',
        'email' => 'lab-login@dev.com',
        'password' => Hash::make('password'),
    ]);
    $user->assignRole(AppPermissions::LAB_ROLE);

    $this->post(route('login.store'), [
        'email' => 'lab-login@dev.com',
        'password' => 'password',
    ])->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
});

test('designers are redirected to the portal dashboard after login', function () {
    $user = User::factory()->create([
        'name' => 'Dr. Nick Smith',
        'email' => 'designer-login@dev.com',
        'password' => Hash::make('password'),
    ]);
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->post(route('login.store'), [
        'email' => 'designer-login@dev.com',
        'password' => 'password',
    ])->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
});

test('manufacturers are redirected to the portal dashboard after login', function () {
    $user = User::factory()->create([
        'name' => 'Max Smith',
        'email' => 'manufacturer-login@dev.com',
        'password' => Hash::make('password'),
    ]);
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->post(route('login.store'), [
        'email' => 'manufacturer-login@dev.com',
        'password' => 'password',
    ])->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
});
