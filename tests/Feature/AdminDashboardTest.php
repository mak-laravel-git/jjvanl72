<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

function createDashboardAdmin(): User
{
    test()->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create([
        'name' => 'Dr. Nick Smith',
        'email' => 'admin-dashboard@dev.com',
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

test('authenticated admins see the command center dashboard', function () {
    $admin = createDashboardAdmin();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(
            fn(Assert $page) => $page
                ->component('backend/Admin/AdminDashboard')
        );
});

test('guests cannot view the admin command center', function () {
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('login'));
});
