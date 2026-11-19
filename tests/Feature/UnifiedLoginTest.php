<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('guests are redirected from home to the unified login page', function () {
    $this->get('/')
        ->assertRedirect(route('login'));
});

test('admin login url redirects to the unified login page', function () {
    $this->get(route('admin.login'))
        ->assertRedirect(route('login'));
});

test('super admins can authenticate through the unified login page', function () {
    $admin = User::factory()->create([
        'email' => 'unified-admin@dev.com',
        'password' => Hash::make('password'),
    ]);
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->post(route('login.store'), [
        'email' => 'unified-admin@dev.com',
        'password' => 'password',
    ])
        ->assertRedirect(route('admin.dashboard'));

    $this->assertAuthenticatedAs($admin);
});

test('platform users can authenticate through the unified login page', function () {
    $user = User::factory()->create([
        'email' => 'dentist@example.com',
        'password' => Hash::make('password'),
    ]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->post(route('login.store'), [
        'email' => 'dentist@example.com',
        'password' => 'password',
    ])
        ->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
});

test('platform users only receive access granted by their role permissions', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();

    $this->actingAs($user)
        ->get(route('user-profile.edit'))
        ->assertOk();
});

test('platform users without a permission are forbidden', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('profile.view');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertForbidden();
});

test('registration is disabled', function () {
    $this->get('/register')->assertNotFound();
});
