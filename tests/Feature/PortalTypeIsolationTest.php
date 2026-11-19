<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('labs cannot open manufacturer portal urls', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::LAB_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.assigned'))
        ->assertForbidden();
});

test('dentists cannot open designer portal urls', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('designer.assigned'))
        ->assertForbidden();
});

test('designers cannot open submitter case urls', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('cases.create'))
        ->assertForbidden();
});

test('manufacturers cannot open designer portal urls', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('designer.assigned'))
        ->assertForbidden();
});

test('super admins cannot use the portal dashboard', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertForbidden();
});

test('labs can still open submitter manufacturing pages', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::LAB_ROLE);

    $this->actingAs($user)
        ->get(route('cases.manufacturing'))
        ->assertOk();
});
