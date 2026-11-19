<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('super admin can update a stakeholder password', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $user = User::factory()->create([
        'password' => Hash::make('old-password'),
    ]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($admin)
        ->put(route('admin.users.password.update', $user), [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertRedirect(route('admin.users.index', ['tab' => 'dentists']))
        ->assertSessionHas('success');

    expect(Hash::check('new-password', $user->fresh()->password))->toBeTrue();
});

test('non super admins cannot update stakeholder passwords', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo(['users.view', 'users.update']);

    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($admin)
        ->put(route('admin.users.password.update', $user), [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertForbidden();
});

test('password update requires confirmation', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $user = User::factory()->create();
    $user->assignRole(AppPermissions::LAB_ROLE);

    $this->actingAs($admin)
        ->from(route('admin.users.index', ['tab' => 'labs']))
        ->put(route('admin.users.password.update', $user), [
            'password' => 'new-password',
            'password_confirmation' => 'mismatch',
        ])
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('admin.users.index', ['tab' => 'labs']));
});
