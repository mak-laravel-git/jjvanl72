<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function createScoutAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);
    $admin->searchable();

    return $admin;
}

test('user searchable array excludes secrets and includes role names', function () {
    $user = User::factory()->create([
        'phone' => '+1 555-0199',
        'location' => 'Denver, CO',
    ]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);
    $user->searchable();

    $payload = $user->toSearchableArray();

    expect($payload)
        ->toHaveKeys(['id', 'name', 'email', 'phone', 'location', 'status', 'role_names', 'created_at'])
        ->not->toHaveKey('password')
        ->not->toHaveKey('two_factor_secret')
        ->and($payload['role_names'])->toContain(AppPermissions::DENTIST_ROLE)
        ->and($payload['phone'])->toBe('+1 555-0199');
});

test('admin users index search uses scout hits', function () {
    $admin = createScoutAdmin();
    $match = User::factory()->create([
        'name' => 'Scout Mitchell',
        'email' => 'scout-mitchell@example.com',
    ]);
    $match->assignRole(AppPermissions::DENTIST_ROLE);
    $match->searchable();

    $other = User::factory()->create(['name' => 'Other Stakeholder']);
    $other->assignRole(AppPermissions::LAB_ROLE);
    $other->searchable();

    $this->actingAs($admin)
        ->get(route('admin.users.index', [
            'tab' => AppPermissions::ALL_USERS_TAB,
            'search' => 'Mitchell',
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/UserManagement')
                ->has('users.data', 1)
                ->where('users.data.0.email', 'scout-mitchell@example.com')
                ->where('filters.search', 'Mitchell')
        );
});

test('admin staff index search uses scout hits', function () {
    $admin = createScoutAdmin();

    $opsRole = Role::findOrCreate('Operations Manager', AppPermissions::GUARD);
    $opsRole->syncPermissions([
        Permission::findByName('admins.view', AppPermissions::GUARD),
    ]);

    $match = User::factory()->create([
        'name' => 'Ops Scout Lead',
        'email' => 'ops-scout@example.com',
    ]);
    $match->assignRole('Operations Manager');
    $match->searchable();

    $this->actingAs($admin)
        ->get(route('admin.staff.index', ['search' => 'Ops Scout']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Staff/Index')
                ->has('admins.data', 1)
                ->where('admins.data.0.email', 'ops-scout@example.com')
                ->where('filters.search', 'Ops Scout')
        );
});
