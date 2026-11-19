<?php

use App\Models\ParameterGroup;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function createParameterGroupsSuperAdmin(string $email = 'parameter-groups-admin@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

function createParameterGroupsLimitedAdmin(array $permissions, string $email = 'parameter-groups-limited@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $role = Role::findOrCreate('Parameter Groups Limited '.$email, AppPermissions::GUARD);
    $role->syncPermissions(
        collect($permissions)
            ->map(fn (string $permission) => Permission::findByName($permission, AppPermissions::GUARD))
            ->all(),
    );
    $admin->assignRole($role);

    return $admin;
}

test('guests cannot view parameter groups', function () {
    $this->get(route('admin.parameter-groups.index'))
        ->assertRedirect(route('login'));
});

test('users without view permission cannot open parameter groups', function () {
    $admin = createParameterGroupsLimitedAdmin(['dashboard.view']);

    $this->actingAs($admin)
        ->get(route('admin.parameter-groups.index'))
        ->assertForbidden();
});

test('super admins can list parameter groups with datatable props', function () {
    $admin = createParameterGroupsSuperAdmin();
    $group = ParameterGroup::factory()->create([
        'name' => 'Shade',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.parameter-groups.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/ParameterGroups/Index')
                ->has('groups', 1)
                ->where('groups.0.id', $group->id)
                ->where('groups.0.title', 'Shade')
                ->missing('groups.0.code')
                ->missing('groups.0.sort_order')
                ->where('canCreate', true)
                ->where('canUpdate', true)
                ->where('canDelete', true)
                ->has('pagination')
                ->where('pagination.total', 1)
                ->has('search')
                ->has('filters')
                ->has('sort_by')
                ->has('sort_order')
        );
});

test('super admins can search parameter groups', function () {
    $admin = createParameterGroupsSuperAdmin('search-parameter-groups@dev.com');
    ParameterGroup::factory()->create(['name' => 'Shade']);
    ParameterGroup::factory()->create(['name' => 'Size']);

    $this->actingAs($admin)
        ->get(route('admin.parameter-groups.index', ['search' => 'Size']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('groups', 1)
                ->where('groups.0.title', 'Size')
                ->where('search', 'Size')
        );
});

test('super admins can sort parameter groups by title', function () {
    $admin = createParameterGroupsSuperAdmin('sort-parameter-groups@dev.com');
    ParameterGroup::factory()->create(['name' => 'Zirconia']);
    ParameterGroup::factory()->create(['name' => 'Acrylic']);

    $this->actingAs($admin)
        ->get(route('admin.parameter-groups.index', [
            'sort_by' => 'name',
            'sort_order' => 'asc',
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('groups.0.title', 'Acrylic')
                ->where('groups.1.title', 'Zirconia')
                ->where('sort_by', 'name')
                ->where('sort_order', 'asc')
        );
});

test('super admins can paginate parameter groups', function () {
    $admin = createParameterGroupsSuperAdmin('paginate-parameter-groups@dev.com');
    ParameterGroup::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.parameter-groups.index', [
            'per_page' => 2,
            'page' => 2,
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('groups', 1)
                ->where('pagination.current_page', 2)
                ->where('pagination.per_page', 2)
                ->where('pagination.total', 3)
                ->where('pagination.last_page', 2)
        );
});

test('super admins can create a parameter group with title only', function () {
    $admin = createParameterGroupsSuperAdmin('create-parameter-groups@dev.com');

    $this->actingAs($admin)
        ->post(route('admin.parameter-groups.store'), [
            'title' => 'Shade',
        ])
        ->assertRedirect(route('admin.parameter-groups.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('parameter_groups', [
        'name' => 'Shade',
        'code' => null,
        'sort_order' => null,
        'is_active' => 1,
    ]);
});

test('creating a parameter group ignores submitted code and sort order', function () {
    $admin = createParameterGroupsSuperAdmin('ignore-fields-parameter-groups@dev.com');

    $this->actingAs($admin)
        ->post(route('admin.parameter-groups.store'), [
            'title' => 'Ignored Fields',
            'code' => 'SHADE',
            'sort_order' => 10,
            'is_active' => '0',
        ])
        ->assertRedirect(route('admin.parameter-groups.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('parameter_groups', [
        'name' => 'Ignored Fields',
        'code' => null,
        'sort_order' => null,
        'is_active' => 1,
    ]);
});

test('creating a parameter group validates unique title', function () {
    $admin = createParameterGroupsSuperAdmin('validate-create-parameter-groups@dev.com');
    ParameterGroup::factory()->create([
        'name' => 'Shade',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.parameter-groups.store'), [
            'title' => 'Shade',
        ])
        ->assertSessionHasErrors(['title']);
});

test('super admins can update a parameter group', function () {
    $admin = createParameterGroupsSuperAdmin('update-parameter-groups@dev.com');
    $group = ParameterGroup::factory()->create([
        'code' => 'OLD',
        'name' => 'Old Name',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.parameter-groups.update', $group), [
            'title' => 'New Name',
            'code' => 'NEW',
            'sort_order' => 5,
            'is_active' => '0',
        ])
        ->assertRedirect(route('admin.parameter-groups.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('parameter_groups', [
        'id' => $group->id,
        'code' => 'OLD',
        'name' => 'New Name',
        'sort_order' => 1,
        'is_active' => 1,
    ]);
});

test('users without create permission cannot store parameter groups', function () {
    $admin = createParameterGroupsLimitedAdmin(
        ['parameter-groups.view'],
        'no-create-parameter-groups@dev.com',
    );

    $this->actingAs($admin)
        ->post(route('admin.parameter-groups.store'), [
            'title' => 'Shade',
        ])
        ->assertForbidden();
});

test('users without update permission cannot update parameter groups', function () {
    $admin = createParameterGroupsLimitedAdmin(
        ['parameter-groups.view'],
        'no-update-parameter-groups@dev.com',
    );
    $group = ParameterGroup::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.parameter-groups.update', $group), [
            'title' => 'Edited',
        ])
        ->assertForbidden();
});

test('super admins can delete a parameter group', function () {
    $admin = createParameterGroupsSuperAdmin('delete-parameter-groups@dev.com');
    $group = ParameterGroup::factory()->create(['name' => 'Removable']);

    $this->actingAs($admin)
        ->delete(route('admin.parameter-groups.destroy', $group))
        ->assertRedirect(route('admin.parameter-groups.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('parameter_groups', [
        'id' => $group->id,
    ]);
});

test('users without delete permission cannot delete parameter groups', function () {
    $admin = createParameterGroupsLimitedAdmin(
        ['parameter-groups.view'],
        'view-only-parameter-groups@dev.com',
    );
    $group = ParameterGroup::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.parameter-groups.destroy', $group))
        ->assertForbidden();

    $this->assertDatabaseHas('parameter_groups', [
        'id' => $group->id,
    ]);
});
