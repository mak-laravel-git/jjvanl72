<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;

function createAdmin(): User
{
    test()->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create([
        'name' => 'Admin User',
        'email' => 'admin@dev.com',
        'password' => Hash::make('admin@dev.com'),
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

test('admin login screen redirects to the unified login page', function () {
    $this->get(route('admin.login'))->assertRedirect(route('login'));
});

test('admins can authenticate using the unified login screen', function () {
    $admin = createAdmin();

    $response = $this->post(route('login.store'), [
        'email' => 'admin@dev.com',
        'password' => 'admin@dev.com',
    ]);

    $this->assertAuthenticatedAs($admin);
    $response->assertRedirect(route('admin.dashboard'));
});

test('admins cannot authenticate with invalid password', function () {
    createAdmin();

    $this->post(route('login.store'), [
        'email' => 'admin@dev.com',
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('regular users cannot access admin routes', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('authenticated admins can access admin dashboard', function () {
    $admin = createAdmin();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk();
});

test('guests are redirected to unified login from admin routes', function () {
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('login'));
});

test('admins can logout', function () {
    $admin = createAdmin();

    $this->actingAs($admin)
        ->post(route('logout'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
});
