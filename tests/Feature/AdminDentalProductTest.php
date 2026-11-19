<?php

use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use App\Models\DentalProductGroup;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function createDentalProductsSuperAdmin(string $email = 'dental-products-admin@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

function createDentalProductsLimitedAdmin(array $permissions, string $email = 'dental-products-limited@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $role = Role::findOrCreate('Dental Products Limited '.$email, AppPermissions::GUARD);
    $role->syncPermissions(
        collect($permissions)
            ->map(fn (string $permission) => Permission::findByName($permission, AppPermissions::GUARD))
            ->all(),
    );
    $admin->assignRole($role);

    return $admin;
}

test('guests cannot view dental products', function () {
    $this->get(route('admin.dental-products.index'))
        ->assertRedirect(route('login'));
});

test('users without view permission cannot open dental products', function () {
    $admin = createDentalProductsLimitedAdmin(['dashboard.view']);

    $this->actingAs($admin)
        ->get(route('admin.dental-products.index'))
        ->assertForbidden();
});

test('super admins can list dental products with index props', function () {
    $admin = createDentalProductsSuperAdmin();
    $group = DentalProductGroup::factory()->create(['code' => null, 'name' => 'Crowns']);
    $product = DentalProduct::factory()->create([
        'code' => '#AA00B8',
        'name' => 'Full Contour',

        'dental_product_group_id' => $group->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dental-products.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/DentalProducts/Index')
                ->has('products', 1)
                ->where('products.0.id', $product->id)
                ->where('products.0.code', '#AA00B8')
                ->where('products.0.name', 'Full Contour')
                ->where('products.0.group_code', null)
                ->where('canCreate', true)
                ->where('canUpdate', true)
                ->where('canDelete', true)
                ->has('groupOptions')
                ->has('materialOptions')
                ->has('pagination')
                ->where('pagination.total', 1)
        );
});

test('super admins can open the create dental product page', function () {
    $admin = createDentalProductsSuperAdmin('create-page-products@dev.com');

    $this->actingAs($admin)
        ->get(route('admin.dental-products.create'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/DentalProducts/Create')
                ->has('groupOptions')
                ->has('materialOptions')
        );
});

test('users without create permission cannot open the create dental product page', function () {
    $admin = createDentalProductsLimitedAdmin(
        ['dental-products.view'],
        'no-create-page-products@dev.com',
    );

    $this->actingAs($admin)
        ->get(route('admin.dental-products.create'))
        ->assertForbidden();
});

test('super admins can open the edit dental product page', function () {
    $admin = createDentalProductsSuperAdmin('edit-page-products@dev.com');
    $product = DentalProduct::factory()->create([
        'code' => '#21C287',
        'name' => 'Crown',
    ]);
    $material = DentalMaterial::factory()->create();
    $product->materials()->attach($material->id, [
        'is_default' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dental-products.edit', $product))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/DentalProducts/Edit')
                ->where('product.id', $product->id)
                ->where('product.name', 'Crown')
                ->where('product.materials.0.id', $material->id)
                ->has('groupOptions')
                ->has('materialOptions')
        );
});

test('users without update permission cannot open the edit dental product page', function () {
    $admin = createDentalProductsLimitedAdmin(
        ['dental-products.view'],
        'no-edit-page-products@dev.com',
    );
    $product = DentalProduct::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.dental-products.edit', $product))
        ->assertForbidden();
});

test('super admins can search dental products', function () {
    $admin = createDentalProductsSuperAdmin('search-products@dev.com');
    DentalProduct::factory()->create(['code' => '#AA00B8', 'name' => 'Crown A']);
    DentalProduct::factory()->create(['code' => '#C31D4C', 'name' => 'Bridge B']);

    $this->actingAs($admin)
        ->get(route('admin.dental-products.index', ['search' => 'Bridge']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('products', 1)
                ->where('products.0.code', '#C31D4C')
                ->where('search', 'Bridge')
        );
});

test('super admins can sort dental products by name', function () {
    $admin = createDentalProductsSuperAdmin('sort-products@dev.com');
    DentalProduct::factory()->create(['code' => '#111111', 'name' => 'Zirconia', 'sort_order' => 1]);
    DentalProduct::factory()->create(['code' => '#222222', 'name' => 'Acrylic', 'sort_order' => 2]);

    $this->actingAs($admin)
        ->get(route('admin.dental-products.index', [
            'sort_by' => 'name',
            'sort_order' => 'asc',
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('products.0.name', 'Acrylic')
                ->where('products.1.name', 'Zirconia')
                ->where('sort_by', 'name')
        );
});

test('super admins can filter inactive dental products', function () {
    $admin = createDentalProductsSuperAdmin('filter-products@dev.com');
    DentalProduct::factory()->create(['name' => 'Active Product', 'is_active' => true]);
    DentalProduct::factory()->inactive()->create(['name' => 'Inactive Product']);

    $this->actingAs($admin)
        ->get(route('admin.dental-products.index', [
            'filters' => ['is_active' => '0'],
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('products', 1)
                ->where('products.0.name', 'Inactive Product')
                ->where('products.0.is_active', false)
        );
});

test('super admins can filter dental products by group', function () {
    $admin = createDentalProductsSuperAdmin('filter-group-products@dev.com');
    $groupA = DentalProductGroup::factory()->create(['code' => null]);
    $groupB = DentalProductGroup::factory()->create(['code' => null]);
    DentalProduct::factory()->create([
        'name' => 'In Group A',
        'dental_product_group_id' => $groupA->id,
    ]);
    DentalProduct::factory()->create([
        'name' => 'In Group B',
        'dental_product_group_id' => $groupB->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dental-products.index', [
            'filters' => ['dental_product_group_id' => $groupA->id],
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('products', 1)
                ->where('products.0.name', 'In Group A')
                ->where('products.0.dental_product_group_id', $groupA->id)
        );
});

test('super admins can paginate dental products', function () {
    $admin = createDentalProductsSuperAdmin('paginate-products@dev.com');
    DentalProduct::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.dental-products.index', [
            'per_page' => 2,
            'page' => 2,
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('products', 1)
                ->where('pagination.current_page', 2)
                ->where('pagination.per_page', 2)
                ->where('pagination.total', 3)
                ->where('pagination.last_page', 2)
        );
});

test('super admins can create a dental product with a jpg icon', function () {
    Storage::fake('public');

    $admin = createDentalProductsSuperAdmin('create-products@dev.com');
    $group = DentalProductGroup::factory()->create();
    $icon = UploadedFile::fake()->image('crown.jpg');

    $this->actingAs($admin)
        ->post(route('admin.dental-products.store'), [
            'code' => '#aa00b8',
            'name' => 'Full Contour',
            'icon' => $icon,

            'is_active' => '1',
            'dental_product_group_id' => $group->id,
        ])
        ->assertRedirect(route('admin.dental-products.index'))
        ->assertSessionHas('success');

    $product = DentalProduct::query()->where('code', '#AA00B8')->first();

    expect($product)->not->toBeNull()
        ->and($product?->name)->toBe('Full Contour')
        ->and($product?->icon)->not->toBeNull()
        ->and($product?->dental_product_group_id)->toBe($group->id);

    Storage::disk('public')->assertExists($product?->icon);
});

test('creating a dental product rejects non image icons', function () {
    $admin = createDentalProductsSuperAdmin('invalid-icon-products@dev.com');
    $group = DentalProductGroup::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.dental-products.store'), [
            'code' => '#ABCDEF',
            'name' => 'Bad Icon',
            'icon' => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),

            'is_active' => '1',
            'dental_product_group_id' => $group->id,
        ])
        ->assertSessionHasErrors(['icon']);
});

test('creating a dental product validates unique code', function () {
    $admin = createDentalProductsSuperAdmin('validate-create-products@dev.com');
    $group = DentalProductGroup::factory()->create();
    DentalProduct::factory()->create(['code' => '#AA00B8']);

    $this->actingAs($admin)
        ->post(route('admin.dental-products.store'), [
            'code' => '#AA00B8',
            'name' => 'Duplicate Code',

            'is_active' => '1',
            'dental_product_group_id' => $group->id,
        ])
        ->assertSessionHasErrors(['code']);
});

test('super admins can update a dental product and replace the icon', function () {
    Storage::fake('public');

    $admin = createDentalProductsSuperAdmin('update-products@dev.com');
    $group = DentalProductGroup::factory()->create();
    $otherGroup = DentalProductGroup::factory()->create();
    $oldIcon = UploadedFile::fake()->image('old.png')->store('dental-products/icons', 'public');
    $product = DentalProduct::factory()->create([
        'code' => '#010101',
        'name' => 'Old Name',
        'icon' => $oldIcon,

        'is_active' => true,
        'dental_product_group_id' => $group->id,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.dental-products.update', $product), [
            'code' => '#fefefe',
            'name' => 'New Name',
            'icon' => UploadedFile::fake()->image('new.jpg'),

            'is_active' => '0',
            'dental_product_group_id' => $otherGroup->id,
        ])
        ->assertRedirect(route('admin.dental-products.index'))
        ->assertSessionHas('success');

    $product->refresh();

    expect($product->code)->toBe('#FEFEFE')
        ->and($product->name)->toBe('New Name')
        ->and($product->sort_order)->toBe(0)
        ->and($product->is_active)->toBeFalse()
        ->and($product->dental_product_group_id)->toBe($otherGroup->id)
        ->and($product->icon)->not->toBe($oldIcon);

    Storage::disk('public')->assertMissing($oldIcon);
    Storage::disk('public')->assertExists($product->icon);
});

test('super admins can remove a dental product icon', function () {
    Storage::fake('public');

    $admin = createDentalProductsSuperAdmin('remove-icon-products@dev.com');
    $iconPath = UploadedFile::fake()->image('keep.png')->store('dental-products/icons', 'public');
    $product = DentalProduct::factory()->create([
        'icon' => $iconPath,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.dental-products.update', $product), [
            'code' => $product->code,
            'name' => $product->name,

            'is_active' => '1',
            'dental_product_group_id' => $product->dental_product_group_id,
            'remove_icon' => '1',
        ])
        ->assertRedirect(route('admin.dental-products.index'))
        ->assertSessionHas('success');

    $product->refresh();

    expect($product->icon)->toBeNull();
    Storage::disk('public')->assertMissing($iconPath);
});

test('users without create permission cannot store dental products', function () {
    $admin = createDentalProductsLimitedAdmin(
        ['dental-products.view'],
        'no-create-products@dev.com',
    );
    $group = DentalProductGroup::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.dental-products.store'), [
            'code' => '#AA00B8',
            'name' => 'Blocked',

            'is_active' => '1',
            'dental_product_group_id' => $group->id,
        ])
        ->assertForbidden();
});

test('users without update permission cannot update dental products', function () {
    $admin = createDentalProductsLimitedAdmin(
        ['dental-products.view'],
        'no-update-products@dev.com',
    );
    $product = DentalProduct::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.dental-products.update', $product), [
            'code' => '#ABCDEF',
            'name' => 'Edited',

            'is_active' => '1',
            'dental_product_group_id' => $product->dental_product_group_id,
        ])
        ->assertForbidden();
});

test('super admins can delete a dental product', function () {
    Storage::fake('public');

    $admin = createDentalProductsSuperAdmin('delete-products@dev.com');
    $iconPath = UploadedFile::fake()->image('gone.png')->store('dental-products/icons', 'public');
    $product = DentalProduct::factory()->create([
        'name' => 'Removable',
        'icon' => $iconPath,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.dental-products.destroy', $product))
        ->assertRedirect(route('admin.dental-products.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('dental_products', [
        'id' => $product->id,
    ]);

    Storage::disk('public')->assertMissing($iconPath);
});

test('users without delete permission cannot delete dental products', function () {
    $admin = createDentalProductsLimitedAdmin(
        ['dental-products.view'],
        'view-only-products@dev.com',
    );
    $product = DentalProduct::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.dental-products.destroy', $product))
        ->assertForbidden();

    $this->assertDatabaseHas('dental_products', [
        'id' => $product->id,
    ]);
});

test('super admins can create a dental product with materials', function () {
    $admin = createDentalProductsSuperAdmin('create-with-materials@dev.com');
    $group = DentalProductGroup::factory()->create();
    $materialA = DentalMaterial::factory()->create();
    $materialB = DentalMaterial::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.dental-products.store'), [
            'code' => '#21c287',
            'name' => 'With Materials',

            'is_active' => '1',
            'dental_product_group_id' => $group->id,
            'materials' => [
                [
                    'id' => $materialA->id,
                    'is_default' => '1',
                ],
                [
                    'id' => $materialB->id,
                    'is_default' => '1',
                ],
            ],
        ])
        ->assertRedirect(route('admin.dental-products.index'))
        ->assertSessionHas('success');

    $product = DentalProduct::query()->where('code', '#21C287')->first();

    expect($product)->not->toBeNull();

    $this->assertDatabaseHas('dental_material_dental_product', [
        'dental_product_id' => $product?->id,
        'dental_material_id' => $materialA->id,
        'is_default' => 1,
    ]);

    // Second default is normalized off so only one default remains.
    $this->assertDatabaseHas('dental_material_dental_product', [
        'dental_product_id' => $product?->id,
        'dental_material_id' => $materialB->id,
        'is_default' => 0,
    ]);
});

test('super admins can update a dental product materials sync', function () {
    $admin = createDentalProductsSuperAdmin('update-with-materials@dev.com');
    $product = DentalProduct::factory()->create();
    $keep = DentalMaterial::factory()->create();
    $drop = DentalMaterial::factory()->create();
    $add = DentalMaterial::factory()->create();

    $product->materials()->attach([
        $keep->id => ['sort_order' => 0, 'is_default' => true],
        $drop->id => ['sort_order' => 1, 'is_default' => false],
    ]);

    $this->actingAs($admin)
        ->put(route('admin.dental-products.update', $product), [
            'code' => $product->code,
            'name' => $product->name,

            'is_active' => '1',
            'dental_product_group_id' => $product->dental_product_group_id,
            'materials' => [
                [
                    'id' => $keep->id,
                    'is_default' => '0',
                ],
                [
                    'id' => $add->id,
                    'is_default' => '1',
                ],
            ],
        ])
        ->assertRedirect(route('admin.dental-products.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('dental_material_dental_product', [
        'dental_product_id' => $product->id,
        'dental_material_id' => $keep->id,
        'is_default' => 0,
    ]);

    $this->assertDatabaseHas('dental_material_dental_product', [
        'dental_product_id' => $product->id,
        'dental_material_id' => $add->id,
        'is_default' => 1,
    ]);

    $this->assertDatabaseMissing('dental_material_dental_product', [
        'dental_product_id' => $product->id,
        'dental_material_id' => $drop->id,
    ]);
});

test('creating a dental product rejects invalid material ids', function () {
    $admin = createDentalProductsSuperAdmin('invalid-material-products@dev.com');
    $group = DentalProductGroup::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.dental-products.store'), [
            'code' => '#FF0000',
            'name' => 'Bad Material',

            'is_active' => '1',
            'dental_product_group_id' => $group->id,
            'materials' => [
                ['id' => 999999, 'is_default' => '0'],
            ],
        ])
        ->assertSessionHasErrors(['materials.0.id']);
});
