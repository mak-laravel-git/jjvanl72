<?php

use App\Models\DentalMaterial;
use App\Models\DentalProduct;
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

function createDentalMaterialsSuperAdmin(string $email = 'dental-materials-admin@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

function createDentalMaterialsLimitedAdmin(array $permissions, string $email = 'dental-materials-limited@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $role = Role::findOrCreate('Dental Materials Limited '.$email, AppPermissions::GUARD);
    $role->syncPermissions(
        collect($permissions)
            ->map(fn (string $permission) => Permission::findByName($permission, AppPermissions::GUARD))
            ->all(),
    );
    $admin->assignRole($role);

    return $admin;
}

test('guests cannot view dental materials', function () {
    $this->get(route('admin.dental-materials.index'))
        ->assertRedirect(route('login'));
});

test('users without view permission cannot open dental materials', function () {
    $admin = createDentalMaterialsLimitedAdmin(['dashboard.view']);

    $this->actingAs($admin)
        ->get(route('admin.dental-materials.index'))
        ->assertForbidden();
});

test('super admins can list dental materials with index props', function () {
    $admin = createDentalMaterialsSuperAdmin();
    $material = DentalMaterial::factory()->create([
        'code' => '#E6E9E9',
        'name' => 'Zirconia',

    ]);
    $product = DentalProduct::factory()->create();
    $material->products()->attach($product->id, [
        'is_default' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dental-materials.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/DentalMaterials/Index')
                ->has('materials', 1)
                ->where('materials.0.id', $material->id)
                ->where('materials.0.code', '#E6E9E9')
                ->where('materials.0.name', 'Zirconia')
                ->where('materials.0.products_count', 1)
                ->where('materials.0.products.0.id', $product->id)
                ->where('canCreate', true)
                ->where('canUpdate', true)
                ->where('canDelete', true)
                ->has('productOptions')
                ->has('pagination')
                ->where('pagination.total', 1)
        );
});

test('super admins can open the create dental material page', function () {
    $admin = createDentalMaterialsSuperAdmin('create-page-materials@dev.com');

    $this->actingAs($admin)
        ->get(route('admin.dental-materials.create'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/DentalMaterials/Create')
                ->has('productOptions')
        );
});

test('users without create permission cannot open the create dental material page', function () {
    $admin = createDentalMaterialsLimitedAdmin(
        ['dental-materials.view'],
        'no-create-page-materials@dev.com',
    );

    $this->actingAs($admin)
        ->get(route('admin.dental-materials.create'))
        ->assertForbidden();
});

test('super admins can open the edit dental material page', function () {
    $admin = createDentalMaterialsSuperAdmin('edit-page-materials@dev.com');
    $material = DentalMaterial::factory()->create([
        'code' => '#E6E9E9',
        'name' => 'Zirconia',
    ]);
    $product = DentalProduct::factory()->create();
    $material->products()->attach($product->id, [
        'is_default' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dental-materials.edit', $material))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/DentalMaterials/Edit')
                ->where('material.id', $material->id)
                ->where('material.name', 'Zirconia')
                ->where('material.products.0.id', $product->id)
                ->has('productOptions')
        );
});

test('users without update permission cannot open the edit dental material page', function () {
    $admin = createDentalMaterialsLimitedAdmin(
        ['dental-materials.view'],
        'no-edit-page-materials@dev.com',
    );
    $material = DentalMaterial::factory()->create();

    $this->actingAs($admin)
        ->get(route('admin.dental-materials.edit', $material))
        ->assertForbidden();
});

test('super admins can search dental materials', function () {
    $admin = createDentalMaterialsSuperAdmin('search-materials@dev.com');
    DentalMaterial::factory()->create(['code' => '#E6E9E9', 'name' => 'Zirconia']);
    DentalMaterial::factory()->create(['code' => '#F0ECE0', 'name' => 'E.max']);

    $this->actingAs($admin)
        ->get(route('admin.dental-materials.index', ['search' => 'E.max']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('materials', 1)
                ->where('materials.0.code', '#F0ECE0')
                ->where('search', 'E.max')
        );
});

test('super admins can sort dental materials by name', function () {
    $admin = createDentalMaterialsSuperAdmin('sort-materials@dev.com');
    DentalMaterial::factory()->create(['code' => '#111111', 'name' => 'Zirconia', 'sort_order' => 1]);
    DentalMaterial::factory()->create(['code' => '#222222', 'name' => 'Acrylic', 'sort_order' => 2]);

    $this->actingAs($admin)
        ->get(route('admin.dental-materials.index', [
            'sort_by' => 'name',
            'sort_order' => 'asc',
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('materials.0.name', 'Acrylic')
                ->where('materials.1.name', 'Zirconia')
                ->where('sort_by', 'name')
                ->where('sort_order', 'asc')
        );
});

test('super admins can filter inactive dental materials', function () {
    $admin = createDentalMaterialsSuperAdmin('filter-materials@dev.com');
    DentalMaterial::factory()->create(['name' => 'Active Material', 'is_active' => true]);
    DentalMaterial::factory()->inactive()->create(['name' => 'Inactive Material']);

    $this->actingAs($admin)
        ->get(route('admin.dental-materials.index', [
            'filters' => ['is_active' => '0'],
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('materials', 1)
                ->where('materials.0.name', 'Inactive Material')
                ->where('materials.0.is_active', false)
        );
});

test('super admins can paginate dental materials', function () {
    $admin = createDentalMaterialsSuperAdmin('paginate-materials@dev.com');
    DentalMaterial::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.dental-materials.index', [
            'per_page' => 2,
            'page' => 2,
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('materials', 1)
                ->where('pagination.current_page', 2)
                ->where('pagination.per_page', 2)
                ->where('pagination.total', 3)
                ->where('pagination.last_page', 2)
        );
});

test('super admins can create a dental material with products', function () {
    $admin = createDentalMaterialsSuperAdmin('create-materials@dev.com');
    $productA = DentalProduct::factory()->create();
    $productB = DentalProduct::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.dental-materials.store'), [
            'code' => '#e6e9e9',
            'name' => 'Zirconia',

            'is_active' => '1',
            'products' => [
                [
                    'id' => $productA->id,
                    'is_default' => '1',
                ],
                [
                    'id' => $productB->id,
                    'is_default' => '0',
                ],
            ],
        ])
        ->assertRedirect(route('admin.dental-materials.index'))
        ->assertSessionHas('success');

    $material = DentalMaterial::query()->where('code', '#E6E9E9')->first();

    expect($material)->not->toBeNull()
        ->and($material?->name)->toBe('Zirconia');

    $this->assertDatabaseHas('dental_material_dental_product', [
        'dental_material_id' => $material?->id,
        'dental_product_id' => $productA->id,
        'is_default' => 1,
    ]);

    $this->assertDatabaseHas('dental_material_dental_product', [
        'dental_material_id' => $material?->id,
        'dental_product_id' => $productB->id,
        'is_default' => 0,
    ]);
});

test('creating a dental material validates unique code and product ids', function () {
    $admin = createDentalMaterialsSuperAdmin('validate-create-materials@dev.com');
    DentalMaterial::factory()->create(['code' => '#E6E9E9']);

    $this->actingAs($admin)
        ->post(route('admin.dental-materials.store'), [
            'code' => '#E6E9E9',
            'name' => 'Duplicate',

            'is_active' => '1',
            'products' => [
                ['id' => 999999, 'is_default' => '0'],
            ],
        ])
        ->assertSessionHasErrors(['code', 'products.0.id']);
});

test('super admins can update a dental material and sync products', function () {
    $admin = createDentalMaterialsSuperAdmin('update-materials@dev.com');
    $material = DentalMaterial::factory()->create([
        'code' => '#010101',
        'name' => 'Old Name',

        'is_active' => true,
    ]);
    $keep = DentalProduct::factory()->create();
    $drop = DentalProduct::factory()->create();
    $add = DentalProduct::factory()->create();
    $material->products()->attach([
        $keep->id => ['sort_order' => 0, 'is_default' => true],
        $drop->id => ['sort_order' => 1, 'is_default' => false],
    ]);

    $this->actingAs($admin)
        ->put(route('admin.dental-materials.update', $material), [
            'code' => '#fefefe',
            'name' => 'New Name',

            'is_active' => '0',
            'products' => [
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
        ->assertRedirect(route('admin.dental-materials.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('dental_materials', [
        'id' => $material->id,
        'code' => '#FEFEFE',
        'name' => 'New Name',

        'is_active' => 0,
    ]);

    $this->assertDatabaseHas('dental_material_dental_product', [
        'dental_material_id' => $material->id,
        'dental_product_id' => $keep->id,
        'is_default' => 0,
    ]);

    $this->assertDatabaseHas('dental_material_dental_product', [
        'dental_material_id' => $material->id,
        'dental_product_id' => $add->id,
        'is_default' => 1,
    ]);

    $this->assertDatabaseMissing('dental_material_dental_product', [
        'dental_material_id' => $material->id,
        'dental_product_id' => $drop->id,
    ]);
});

test('syncing a material as default clears other defaults for that product', function () {
    $admin = createDentalMaterialsSuperAdmin('default-clear-materials@dev.com');
    $product = DentalProduct::factory()->create();
    $existingDefault = DentalMaterial::factory()->create();
    $incoming = DentalMaterial::factory()->create();

    $existingDefault->products()->attach($product->id, [
        'is_default' => true,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.dental-materials.update', $incoming), [
            'code' => $incoming->code,
            'name' => $incoming->name,
            'sort_order' => $incoming->sort_order,
            'is_active' => '1',
            'products' => [
                [
                    'id' => $product->id,
                    'is_default' => '1',
                ],
            ],
        ])
        ->assertRedirect(route('admin.dental-materials.index'));

    $this->assertDatabaseHas('dental_material_dental_product', [
        'dental_material_id' => $incoming->id,
        'dental_product_id' => $product->id,
        'is_default' => 1,
    ]);

    $this->assertDatabaseHas('dental_material_dental_product', [
        'dental_material_id' => $existingDefault->id,
        'dental_product_id' => $product->id,
        'is_default' => 0,
    ]);
});

test('users without create permission cannot store dental materials', function () {
    $admin = createDentalMaterialsLimitedAdmin(
        ['dental-materials.view'],
        'no-create-materials@dev.com',
    );

    $this->actingAs($admin)
        ->post(route('admin.dental-materials.store'), [
            'code' => '#E6E9E9',
            'name' => 'Zirconia',

            'is_active' => '1',
        ])
        ->assertForbidden();
});

test('users without update permission cannot update dental materials', function () {
    $admin = createDentalMaterialsLimitedAdmin(
        ['dental-materials.view'],
        'no-update-materials@dev.com',
    );
    $material = DentalMaterial::factory()->create();

    $this->actingAs($admin)
        ->put(route('admin.dental-materials.update', $material), [
            'code' => '#ABCDEF',
            'name' => 'Edited',

            'is_active' => '1',
        ])
        ->assertForbidden();
});

test('super admins can delete a dental material', function () {
    $admin = createDentalMaterialsSuperAdmin('delete-materials@dev.com');
    $material = DentalMaterial::factory()->create(['name' => 'Removable']);
    $product = DentalProduct::factory()->create();
    $material->products()->attach($product->id, [
        'is_default' => false,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.dental-materials.destroy', $material))
        ->assertRedirect(route('admin.dental-materials.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('dental_materials', [
        'id' => $material->id,
    ]);

    $this->assertDatabaseMissing('dental_material_dental_product', [
        'dental_material_id' => $material->id,
    ]);
});

test('users without delete permission cannot delete dental materials', function () {
    $admin = createDentalMaterialsLimitedAdmin(
        ['dental-materials.view'],
        'view-only-materials@dev.com',
    );
    $material = DentalMaterial::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.dental-materials.destroy', $material))
        ->assertForbidden();

    $this->assertDatabaseHas('dental_materials', [
        'id' => $material->id,
    ]);
});

test('super admins can create a dental material with a jpg icon', function () {
    Storage::fake('public');

    $admin = createDentalMaterialsSuperAdmin('create-icon-materials@dev.com');
    $icon = UploadedFile::fake()->image('zirconia.jpg');

    $this->actingAs($admin)
        ->post(route('admin.dental-materials.store'), [
            'code' => '#aabbcc',
            'name' => 'With Icon',
            'icon' => $icon,
            'is_active' => '1',
        ])
        ->assertRedirect(route('admin.dental-materials.index'))
        ->assertSessionHas('success');

    $material = DentalMaterial::query()->where('code', '#AABBCC')->first();

    expect($material)->not->toBeNull()
        ->and($material?->icon)->not->toBeNull();

    Storage::disk('public')->assertExists($material?->icon);
});

test('super admins can remove a dental material icon', function () {
    Storage::fake('public');

    $admin = createDentalMaterialsSuperAdmin('remove-icon-materials@dev.com');
    $iconPath = UploadedFile::fake()->image('keep.png')->store('dental-materials/icons', 'public');
    $material = DentalMaterial::factory()->create([
        'icon' => $iconPath,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.dental-materials.update', $material), [
            'code' => $material->code,
            'name' => $material->name,
            'is_active' => '1',
            'remove_icon' => '1',
        ])
        ->assertRedirect(route('admin.dental-materials.index'))
        ->assertSessionHas('success');

    $material->refresh();

    expect($material->icon)->toBeNull();
    Storage::disk('public')->assertMissing($iconPath);
});
