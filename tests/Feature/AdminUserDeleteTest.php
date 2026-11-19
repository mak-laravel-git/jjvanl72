<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('super admin can permanently delete a stakeholder user', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $user = User::factory()->create(['name' => 'Delete Me']);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $user))
        ->assertRedirect(route('admin.users.index', ['tab' => 'dentists']))
        ->assertSessionHas('success');

    expect(User::query()->whereKey($user->id)->exists())->toBeFalse();
});

test('non super admins cannot permanently delete users', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo(['users.view', 'users.update']);

    $user = User::factory()->create();
    $user->assignRole(AppPermissions::LAB_ROLE);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $user))
        ->assertForbidden();

    expect(User::query()->whereKey($user->id)->exists())->toBeTrue();
});

test('super admin cannot permanently delete their own account', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($admin)
        ->from(route('admin.users.index'))
        ->delete(route('admin.users.destroy', $admin))
        ->assertRedirect(route('admin.users.index'))
        ->assertSessionHas('error');

    expect(User::query()->whereKey($admin->id)->exists())->toBeTrue();
});
