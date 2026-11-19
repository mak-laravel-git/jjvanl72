<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function createUserManagerAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

test('platform role seeder creates web guard stakeholder roles', function () {
    expect(Role::query()->where('guard_name', AppPermissions::GUARD)->count())
        ->toBe(6)
        ->and(AppPermissions::stakeholderRoles())->toContain(
            AppPermissions::DENTIST_ROLE,
            AppPermissions::DESIGNER_ROLE,
        );
});

test('user management lists dentists from the database', function () {
    $admin = createUserManagerAdmin();
    $dentist = User::factory()->create(['name' => 'Dr. Tab Dentist']);
    $dentist->assignRole(AppPermissions::DENTIST_ROLE);

    User::factory()->create()->assignRole(AppPermissions::LAB_ROLE);

    $this->actingAs($admin)
        ->get(route('admin.users.index', ['tab' => 'dentists']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/UserManagement')
                ->where('activeTab', 'dentists')
                ->has('users.data', 1)
                ->where('users.data.0.email', $dentist->email)
                ->has('roles', 5)
                ->where('canAssignRoles', true)
                ->where('canManageUsers', true)
                ->where('canCreateUsers', true)
        );
});

test('admins can assign a stakeholder role to a platform user', function () {
    $admin = createUserManagerAdmin();
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($admin)
        ->put(route('admin.users.role.update', $user), [
            'role' => AppPermissions::DESIGNER_ROLE,
        ])
        ->assertRedirect(route('admin.users.index', ['tab' => 'designers']));

    expect($user->fresh()->getRoleNames()->all())->toBe([
        AppPermissions::DESIGNER_ROLE,
    ]);
});

test('admins without users.update cannot assign roles', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo(['users.view']);
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($admin)
        ->put(route('admin.users.role.update', $user), [
            'role' => AppPermissions::LAB_ROLE,
        ])
        ->assertForbidden();
});

test('non super admins only receive view access flags on user management', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo(['users.view', 'users.update']);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/UserManagement')
                ->where('canAssignRoles', false)
                ->where('canManageUsers', false)
                ->where('canCreateUsers', false)
        );
});
