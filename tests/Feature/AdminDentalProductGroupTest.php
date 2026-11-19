<?php

use App\Models\DentalProductGroup;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function createDentalGroupsSuperAdmin(string $email = 'dental-groups-admin@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

function createDentalGroupsLimitedAdmin(array $permissions, string $email = 'dental-groups-limited@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $role = Role::findOrCreate('Dental Groups Limited '.$email, AppPermissions::GUARD);
    $role->syncPermissions(
        collect($permissions)
            ->map(fn (string $permission) => Permission::findByName($permission, AppPermissions::GUARD))
            ->all(),
    );
    $admin->assignRole($role);

    return $admin;
}

test('guests cannot view dental product groups', function () {
    $this->get(route('admin.dental-product-groups.index'))
        ->assertRedirect(route('login'));
});

test('users without view permission cannot open dental product groups', function () {
    $admin = createDentalGroupsLimitedAdmin(['dashboard.view']);

    $this->actingAs($admin)
        ->get(route('admin.dental-product-groups.index'))
        ->assertForbidden();
});

test('super admins can list dental product groups with datatable props', function () {
    $admin = createDentalGroupsSuperAdmin();
    $group = DentalProductGroup::factory()->create([
        'name' => 'Crowns',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dental-product-groups.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/DentalProductGroups/Index')
                ->has('groups', 1)
                ->where('groups.0.id', $group->id)
                ->where('groups.0.name', 'Crowns')
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

test('super admins can search dental product groups', function () {
    $admin = createDentalGroupsSuperAdmin('search-groups@dev.com');
    DentalProductGroup::factory()->create(['name' => 'Crowns']);
    DentalProductGroup::factory()->create(['name' => 'Bridges']);

    $this->actingAs($admin)
        ->get(route('admin.dental-product-groups.index', ['search' => 'Bridge']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('groups', 1)
                ->where('groups.0.name', 'Bridges')
                ->where('search', 'Bridge')
        );
});

test('super admins can sort dental product groups by name', function () {
    $admin = createDentalGroupsSuperAdmin('sort-groups@dev.com');
    DentalProductGroup::factory()->create(['name' => 'Zirconia']);
    DentalProductGroup::factory()->create(['name' => 'Acrylic']);

    $this->actingAs($admin)
        ->get(route('admin.dental-product-groups.index', [
            'sort_by' => 'name',
            'sort_order' => 'asc',
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('groups.0.name', 'Acrylic')
                ->where('groups.1.name', 'Zirconia')
                ->where('sort_by', 'name')
                ->where('sort_order', 'asc')
        );
});

test('super admins can filter inactive dental product groups', function () {
    $admin = createDentalGroupsSuperAdmin('filter-groups@dev.com');
    DentalProductGroup::factory()->create(['name' => 'Active Group', 'is_active' => true]);
    DentalProductGroup::factory()->inactive()->create(['name' => 'Inactive Group']);

    $this->actingAs($admin)
        ->get(route('admin.dental-product-groups.index', [
            'filters' => ['is_active' => '0'],
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('groups', 1)
                ->where('groups.0.name', 'Inactive Group')
                ->where('groups.0.is_active', false)
        );
});

test('super admins can paginate dental product groups', function () {
    $admin = createDentalGroupsSuperAdmin('paginate-groups@dev.com');
    DentalProductGroup::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.dental-product-groups.index', [
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

test('super admins can create a dental product group without code or sort order', function () {
    $admin = createDentalGroupsSuperAdmin('create-groups@dev.com');

    $this->actingAs($admin)
        ->post(route('admin.dental-product-groups.store'), [
            'name' => 'Crowns',
            'is_active' => '1',
        ])
        ->assertRedirect(route('admin.dental-product-groups.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('dental_product_groups', [
        'name' => 'Crowns',
        'code' => null,
        'sort_order' => null,
        'is_active' => 1,
    ]);
});

test('creating a dental product group ignores submitted code and sort order', function () {
    $admin = createDentalGroupsSuperAdmin('ignore-fields-groups@dev.com');

    $this->actingAs($admin)
        ->post(route('admin.dental-product-groups.store'), [
            'name' => 'Ignored Fields',
            'code' => 'CRWN',
            'sort_order' => 10,
            'is_active' => '1',
        ])
        ->assertRedirect(route('admin.dental-product-groups.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('dental_product_groups', [
        'name' => 'Ignored Fields',
        'code' => null,
        'sort_order' => null,
    ]);
});

test('creating a dental product group validates unique name', function () {
    $admin = createDentalGroupsSuperAdmin('validate-create-groups@dev.com');
    DentalProductGroup::factory()->create([
        'name' => 'Crowns',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.dental-product-groups.store'), [
            'name' => 'Crowns',
            'is_active' => '1',
        ])
        ->assertSessionHasErrors(['name']);
});

test('super admins can update a dental product group', function () {
    $admin = createDentalGroupsSuperAdmin('update-groups@dev.com');
    $group = DentalProductGroup::factory()->create([
        'code' => 'OLD',
        'name' => 'Old Name',
        'sort_order' => 1,
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.dental-product-groups.update', $group), [
            'name' => 'New Name',
            'code' => 'NEW',
            'sort_order' => 5,
            'is_active' => '0',
        ])
        ->assertRedirect(route('admin.dental-product-groups.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('dental_product_groups', [
        'id' => $group->id,
        'code' => 'OLD',
        'name' => 'New Name',
        'sort_order' => 1,
        'is_active' => 0,
    ]);
});

test('users without create permission cannot store dental product groups', function () {
    $admin = createDentalGroupsLimitedAdmin(
        ['dental-product-groups.view'],
        'no-create-groups@dev.com',
    );

    $this->actingAs($admin)
        ->post(route('admin.dental-product-groups.store'), [
            'name' => 'Crowns',
            'is_active' => '1',
        ])
        ->assertForbidden();
});

test('users without update permission cannot update dental product groups', function () {
    $admin = createDentalGroupsLimitedAdmin(
        ['dental-product-groups.view'],
        'no-update-groups@dev.com',
    );
    $group = DentalProductGroup::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.dental-product-groups.update', $group), [
            'name' => 'Edited',
            'is_active' => '1',
        ])
        ->assertForbidden();
});

test('super admins can delete a dental product group', function () {
    $admin = createDentalGroupsSuperAdmin('delete-groups@dev.com');
    $group = DentalProductGroup::factory()->create(['name' => 'Removable']);

    $this->actingAs($admin)
        ->delete(route('admin.dental-product-groups.destroy', $group))
        ->assertRedirect(route('admin.dental-product-groups.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('dental_product_groups', [
        'id' => $group->id,
    ]);
});

test('users without delete permission cannot delete dental product groups', function () {
    $admin = createDentalGroupsLimitedAdmin(
        ['dental-product-groups.view'],
        'view-only-groups@dev.com',
    );
    $group = DentalProductGroup::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.dental-product-groups.destroy', $group))
        ->assertForbidden();

    $this->assertDatabaseHas('dental_product_groups', [
        'id' => $group->id,
    ]);
});
