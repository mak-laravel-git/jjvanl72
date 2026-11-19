<?php

use App\Enums\CaseService;
use App\Models\DentalMaterial;
use App\Models\DentalPackagePrice;
use App\Models\DentalProduct;
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

function createPackagePriceSuperAdmin(string $email = 'package-prices-admin@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

function createPackagePriceLimitedAdmin(array $permissions, string $email = 'package-prices-limited@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $role = Role::findOrCreate('Package Prices Limited '.$email, AppPermissions::GUARD);
    $role->syncPermissions(
        collect($permissions)
            ->map(fn (string $permission) => Permission::findByName($permission, AppPermissions::GUARD))
            ->all(),
    );
    $admin->assignRole($role);

    return $admin;
}

test('guests cannot view package prices', function () {
    $this->get(route('admin.dental-package-prices.index'))
        ->assertRedirect(route('login'));
});

test('users without view permission cannot open package prices', function () {
    $admin = createPackagePriceLimitedAdmin(['dashboard.view']);

    $this->actingAs($admin)
        ->get(route('admin.dental-package-prices.index'))
        ->assertForbidden();
});

test('super admins can list package prices', function () {
    $admin = createPackagePriceSuperAdmin();
    $group = DentalProductGroup::factory()->create(['name' => 'Crowns']);
    $product = DentalProduct::factory()->create([
        'name' => 'Implant Crown',
        'dental_product_group_id' => $group->id,
    ]);
    $row = DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'service' => CaseService::Design,
        'price_minor' => 1500,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dental-package-prices.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/DentalPackagePrices/Index')
                ->has('packagePrices', 1)
                ->where('packagePrices.0.id', $row->id)
                ->where('packagePrices.0.price', 15)
                ->where('canCreate', true)
                ->has('groupOptions')
                ->has('productOptions')
                ->where('productOptions.0.dental_product_group_id', $group->id)
        );
});

test('super admins can filter package prices by dental product', function () {
    $admin = createPackagePriceSuperAdmin('filter-by-product@dev.com');
    $productA = DentalProduct::factory()->create(['name' => 'Product A']);
    $productB = DentalProduct::factory()->create(['name' => 'Product B']);
    $match = DentalPackagePrice::factory()->create([
        'dental_product_id' => $productA->id,
        'service' => CaseService::Design,
        'price_minor' => 1000,
    ]);
    DentalPackagePrice::factory()->create([
        'dental_product_id' => $productB->id,
        'service' => CaseService::Design,
        'price_minor' => 2000,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dental-package-prices.index', [
            'filters' => ['dental_product_id' => $productA->id],
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/DentalPackagePrices/Index')
                ->has('packagePrices', 1)
                ->where('packagePrices.0.id', $match->id)
                ->where('filters.dental_product_id', (string) $productA->id)
        );
});

test('super admins can filter package prices by product group', function () {
    $admin = createPackagePriceSuperAdmin('filter-by-group@dev.com');
    $groupA = DentalProductGroup::factory()->create(['name' => 'Group A']);
    $groupB = DentalProductGroup::factory()->create(['name' => 'Group B']);
    $productA = DentalProduct::factory()->create([
        'name' => 'In Group A',
        'dental_product_group_id' => $groupA->id,
    ]);
    $productB = DentalProduct::factory()->create([
        'name' => 'In Group B',
        'dental_product_group_id' => $groupB->id,
    ]);
    $match = DentalPackagePrice::factory()->create([
        'dental_product_id' => $productA->id,
        'service' => CaseService::Design,
        'price_minor' => 1100,
    ]);
    DentalPackagePrice::factory()->create([
        'dental_product_id' => $productB->id,
        'service' => CaseService::Design,
        'price_minor' => 2200,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dental-package-prices.index', [
            'filters' => ['product.dental_product_group_id' => $groupA->id],
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/DentalPackagePrices/Index')
                ->has('packagePrices', 1)
                ->where('packagePrices.0.id', $match->id)
                ->where(
                    'filters',
                    fn ($filters): bool => (string) collect($filters)->get('product.dental_product_group_id') === (string) $groupA->id,
                )
        );
});

test('super admins can create a design package price', function () {
    $admin = createPackagePriceSuperAdmin('create-package@dev.com');
    $product = DentalProduct::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.dental-package-prices.store'), [
            'dental_product_id' => $product->id,
            'dental_material_id' => null,
            'service' => 'design',
            'price' => 10.5,
        ])
        ->assertRedirect(route('admin.dental-package-prices.index'));

    $this->assertDatabaseHas('dental_package_prices', [
        'dental_product_id' => $product->id,
        'service' => 'design',
        'manufacture_method' => null,
        'price_minor' => 1050,
    ]);
});

test('super admins can create a manufacture package price', function () {
    $admin = createPackagePriceSuperAdmin('create-mfg-package@dev.com');
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();
    $material->products()->attach($product->id);

    $this->actingAs($admin)
        ->post(route('admin.dental-package-prices.store'), [
            'dental_product_id' => $product->id,
            'dental_material_id' => $material->id,
            'service' => 'manufacture',
            'output' => 'applianceModels',
            'price' => 110,
        ])
        ->assertRedirect(route('admin.dental-package-prices.index'));

    $this->assertDatabaseHas('dental_package_prices', [
        'dental_product_id' => $product->id,
        'dental_material_id' => $material->id,
        'service' => 'manufacture',
        'manufacture_method' => null,
        'output' => 'applianceModels',
        'model_service' => null,
        'price_minor' => 11000,
    ]);
});

test('manufacture package price requires an output', function () {
    $admin = createPackagePriceSuperAdmin('mfg-needs-output@dev.com');
    $product = DentalProduct::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.dental-package-prices.store'), [
            'dental_product_id' => $product->id,
            'service' => 'manufacture',
            'price' => 50,
        ])
        ->assertSessionHasErrors('output');

    $this->assertDatabaseCount('dental_package_prices', 0);
});

test('legacy method and model service inputs are ignored when saving', function () {
    $admin = createPackagePriceSuperAdmin('legacy-inputs@dev.com');
    $product = DentalProduct::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.dental-package-prices.store'), [
            'dental_product_id' => $product->id,
            'service' => 'manufacture',
            'output' => 'appliance',
            'manufacture_method' => 'print',
            'model_service' => 'designPrint',
            'price' => 80,
        ])
        ->assertRedirect(route('admin.dental-package-prices.index'));

    $this->assertDatabaseHas('dental_package_prices', [
        'dental_product_id' => $product->id,
        'service' => 'manufacture',
        'manufacture_method' => null,
        'model_service' => null,
        'output' => 'appliance',
    ]);
});

test('manufacture prices are unique per product, material and output', function () {
    $admin = createPackagePriceSuperAdmin('mfg-unique@dev.com');
    $product = DentalProduct::factory()->create();

    DentalPackagePrice::factory()->manufacture()->create([
        'dental_product_id' => $product->id,
        'output' => 'appliance',
        'price_minor' => 1000,
    ]);

    // Same key — rejected even though a client might post legacy fields.
    $this->actingAs($admin)
        ->post(route('admin.dental-package-prices.store'), [
            'dental_product_id' => $product->id,
            'service' => 'manufacture',
            'output' => 'appliance',
            'manufacture_method' => 'print',
            'price' => 12,
        ])
        ->assertSessionHasErrors('service');

    // A different output is a different key.
    $this->actingAs($admin)
        ->post(route('admin.dental-package-prices.store'), [
            'dental_product_id' => $product->id,
            'service' => 'manufacture',
            'output' => 'applianceModels',
            'price' => 15,
        ])
        ->assertRedirect(route('admin.dental-package-prices.index'));

    expect(DentalPackagePrice::query()->where('dental_product_id', $product->id)->count())->toBe(2);
});

test('duplicate package combo is rejected', function () {
    $admin = createPackagePriceSuperAdmin('dup-package@dev.com');
    $product = DentalProduct::factory()->create();

    DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'service' => CaseService::Design,
        'price_minor' => 1000,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.dental-package-prices.store'), [
            'dental_product_id' => $product->id,
            'service' => 'design',
            'price' => 12,
        ])
        ->assertSessionHasErrors('service');
});

test('super admins can update and delete package prices', function () {
    $admin = createPackagePriceSuperAdmin('edit-del-package@dev.com');
    $product = DentalProduct::factory()->create();
    $row = DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'service' => CaseService::Design,
        'price_minor' => 1000,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.dental-package-prices.update', $row), [
            'dental_product_id' => $product->id,
            'service' => 'design',
            'price' => 22,
        ])
        ->assertRedirect(route('admin.dental-package-prices.index'));

    expect($row->fresh()->price_minor)->toBe(2200);

    $this->actingAs($admin)
        ->delete(route('admin.dental-package-prices.destroy', $row))
        ->assertRedirect(route('admin.dental-package-prices.index'));

    $this->assertDatabaseMissing('dental_package_prices', ['id' => $row->id]);
});
