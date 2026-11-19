<?php

use App\Models\User;
use App\Providers\TelescopeServiceProvider;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Laravel\Telescope\TelescopeServiceProvider as TelescopePackageServiceProvider;

function enableTelescope(): void
{
    config(['telescope.enabled' => true]);

    app()->register(TelescopePackageServiceProvider::class);
    app()->register(TelescopeServiceProvider::class);
}

test('telescope is not found when disabled in testing', function () {
    $this->get('/telescope')->assertNotFound();
});

test('dentists are forbidden from telescope when it is enabled', function () {
    $this->seed(RolePermissionSeeder::class);

    $dentist = User::factory()->create();
    $dentist->assignRole(AppPermissions::DENTIST_ROLE);

    enableTelescope();

    $this->actingAs($dentist)
        ->get('/telescope')
        ->assertForbidden();
});

test('super admins can open telescope when it is enabled', function () {
    $this->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    enableTelescope();

    $this->actingAs($admin)
        ->get('/telescope')
        ->assertOk();
});
