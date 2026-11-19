<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function createPrivilegedAdmin(string $email = 'super-admin@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

function createLimitedAdmin(array $permissions, string $email = 'limited@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $admin->givePermissionTo($permissions);

    return $admin;
}

test('role permission seeder creates web guard roles and permissions', function () {
    expect(Role::query()->where('guard_name', AppPermissions::GUARD)->count())->toBe(6)
        ->and(AppPermissions::all())->toContain('dashboard.view', 'roles.view', 'profile.view', 'users.create')
        ->and(AppPermissions::roles())->toEqualCanonicalizing([
            AppPermissions::SUPER_ADMIN_ROLE,
            AppPermissions::DENTIST_ROLE,
            AppPermissions::DENTURIST_ROLE,
            AppPermissions::LAB_ROLE,
            AppPermissions::DESIGNER_ROLE,
            AppPermissions::MANUFACTURER_ROLE,
        ]);
});

test('users without permission cannot view protected pages', function () {
    $admin = createLimitedAdmin(['dashboard.view']);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertForbidden();
});

test('super admins can access roles index and receive permission props', function () {
    $admin = createPrivilegedAdmin();

    $this->actingAs($admin)
        ->get(route('admin.roles.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Roles/Index')
                ->has('roles.data')
                ->has('filters')
                ->where('auth.user.roles.0', AppPermissions::SUPER_ADMIN_ROLE)
                ->has('auth.permissions')
        );
});

test('super admins can create a role', function () {
    $admin = createPrivilegedAdmin();

    $this->actingAs($admin)
        ->post(route('admin.roles.store'), [
            'name' => 'Clinic Lead',
            'permissions' => ['dashboard.view', 'cases.view'],
        ])
        ->assertRedirect(route('admin.roles.index'));

    $role = Role::query()
        ->where('guard_name', AppPermissions::GUARD)
        ->where('name', 'Clinic Lead')
        ->first();

    expect($role)->not->toBeNull()
        ->and($role->permissions->pluck('name')->all())->toEqualCanonicalizing([
            'dashboard.view',
            'cases.view',
        ]);
});

test('a role can be created without permissions and assigned later', function () {
    $admin = createPrivilegedAdmin();

    $this->actingAs($admin)
        ->post(route('admin.roles.store'), [
            'name' => 'Pending Access',
            'permissions' => [],
        ])
        ->assertRedirect(route('admin.roles.index'));

    expect(
        Role::findByName('Pending Access', AppPermissions::GUARD)->permissions,
    )->toHaveCount(0);
});

test('reserved and invalid permission values are rejected', function () {
    $admin = createPrivilegedAdmin();

    $this->actingAs($admin)
        ->post(route('admin.roles.store'), [
            'name' => AppPermissions::SUPER_ADMIN_ROLE,
            'permissions' => ['not-a-real-permission'],
        ])
        ->assertSessionHasErrors(['name', 'permissions.0']);
});

test('super admins can update a role', function () {
    $admin = createPrivilegedAdmin();
    $role = Role::findOrCreate('Support Lead', AppPermissions::GUARD);
    $role->syncPermissions(['dashboard.view']);

    $this->actingAs($admin)
        ->put(route('admin.roles.update', $role), [
            'name' => 'Support Lead',
            'permissions' => ['dashboard.view', 'users.view', 'notifications.view'],
        ])
        ->assertRedirect(route('admin.roles.index'));

    expect($role->fresh()->permissions->pluck('name')->all())->toEqualCanonicalizing([
        'dashboard.view',
        'users.view',
        'notifications.view',
    ]);
});

test('roles index lists admin staff roles and hides portal types', function () {
    $admin = createPrivilegedAdmin();

    $this->actingAs($admin)
        ->get(route('admin.roles.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Roles/Index')
                ->has('roles.data', 1)
                ->where('roles.data.0.name', AppPermissions::SUPER_ADMIN_ROLE)
                ->where('filters.search', '')
                ->where('filters.type', '')
        );
});

test('roles index search filters by role name', function () {
    $admin = createPrivilegedAdmin();
    Role::findOrCreate('Clinic Lead', AppPermissions::GUARD);
    Role::findOrCreate('Billing Desk', AppPermissions::GUARD);

    $this->actingAs($admin)
        ->get(route('admin.roles.index', ['search' => 'Clinic']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Roles/Index')
                ->has('roles.data', 1)
                ->where('roles.data.0.name', 'Clinic Lead')
                ->where('filters.search', 'Clinic')
        );
});

test('roles index type filter distinguishes protected and custom roles', function () {
    $admin = createPrivilegedAdmin();
    Role::findOrCreate('Clinic Lead', AppPermissions::GUARD);

    $this->actingAs($admin)
        ->get(route('admin.roles.index', ['type' => 'protected']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Roles/Index')
                ->has('roles.data', 1)
                ->where('roles.data.0.name', AppPermissions::SUPER_ADMIN_ROLE)
                ->where('filters.type', 'protected')
        );

    $this->actingAs($admin)
        ->get(route('admin.roles.index', ['type' => 'custom']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Roles/Index')
                ->has('roles.data', 1)
                ->where('roles.data.0.name', 'Clinic Lead')
                ->where('filters.type', 'custom')
        );
});

test('portal types cannot be edited or have their permissions changed', function () {
    $admin = createPrivilegedAdmin();
    $role = Role::findByName(AppPermissions::DENTIST_ROLE, AppPermissions::GUARD);

    $this->actingAs($admin)
        ->get(route('admin.roles.edit', $role))
        ->assertNotFound();

    $this->actingAs($admin)
        ->put(route('admin.roles.update', $role), [
            'name' => AppPermissions::DENTIST_ROLE,
            'permissions' => ['dashboard.view', 'profile.view'],
        ])
        ->assertForbidden();

    expect($role->fresh()->permissions->pluck('name')->all())->toContain('cases.create');
});

test('the super admin role cannot be renamed or have permissions directly assigned', function () {
    $admin = createPrivilegedAdmin();
    $role = Role::findByName(
        AppPermissions::SUPER_ADMIN_ROLE,
        AppPermissions::GUARD,
    );

    $this->actingAs($admin)
        ->put(route('admin.roles.update', $role), [
            'name' => 'Renamed Super Admin',
            'permissions' => ['dashboard.view'],
        ])
        ->assertRedirect(route('admin.roles.index'));

    $role->refresh();

    expect($role->name)->toBe(AppPermissions::SUPER_ADMIN_ROLE)
        ->and($role->permissions)->toHaveCount(0);
});

test('super admin role cannot be deleted', function () {
    $admin = createPrivilegedAdmin();
    $role = Role::findByName(AppPermissions::SUPER_ADMIN_ROLE, AppPermissions::GUARD);

    $this->actingAs($admin)
        ->delete(route('admin.roles.destroy', $role))
        ->assertRedirect(route('admin.roles.index'));

    expect(Role::query()->where('name', AppPermissions::SUPER_ADMIN_ROLE)->exists())->toBeTrue();
});

test('portal types cannot be deleted', function () {
    $admin = createPrivilegedAdmin();
    $role = Role::findByName(AppPermissions::DENTIST_ROLE, AppPermissions::GUARD);

    $this->actingAs($admin)
        ->delete(route('admin.roles.destroy', $role))
        ->assertNotFound();

    expect($role->fresh())->not->toBeNull();
});

test('a custom role assigned to users cannot be deleted', function () {
    $admin = createPrivilegedAdmin();
    $role = Role::findOrCreate('Clinic Lead', AppPermissions::GUARD);
    $assigned = User::factory()->create();
    $assigned->assignRole('Clinic Lead');

    $this->actingAs($admin)
        ->delete(route('admin.roles.destroy', $role))
        ->assertRedirect(route('admin.roles.index'))
        ->assertSessionHas('error');

    expect($role->fresh())->not->toBeNull();
});

test('admin roles cannot be assigned portal-only permissions', function () {
    $admin = createPrivilegedAdmin();

    $this->actingAs($admin)
        ->post(route('admin.roles.store'), [
            'name' => 'Clinic Lead',
            'permissions' => ['dashboard.view', 'cases.create', 'profile.view'],
        ])
        ->assertSessionHasErrors(['permissions.1', 'permissions.2']);
});

test('admins with roles.create can open the create page', function () {
    $admin = createLimitedAdmin(['roles.view', 'roles.create']);

    $this->actingAs($admin)
        ->get(route('admin.roles.create'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Roles/Create')
                ->has('permissionGroups')
        );
});

test('permission cache is cleared after role mutations', function () {
    $admin = createPrivilegedAdmin();

    $this->actingAs($admin)
        ->post(route('admin.roles.store'), [
            'name' => 'Cache Check',
            'permissions' => ['dashboard.view'],
        ])
        ->assertRedirect(route('admin.roles.index'));

    expect(app(PermissionRegistrar::class)->getPermissions()->isNotEmpty())->toBeTrue();
});
