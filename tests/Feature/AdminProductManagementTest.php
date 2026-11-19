<?php

use App\Models\Product;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

function createProductAdmin(string $email = 'products-admin@dev.com'): User
{
    test()->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

test('authenticated admins can view the products catalog from the database', function () {
    $admin = createProductAdmin();
    $product = Product::factory()->create([
        'name' => 'Porcelain Crown',
        'category' => 'Fixed',
        'material' => 'Zirconia',
        'design_price' => 85,
        'mfg_price' => 220,
        'rush_fee' => 45,
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.products.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/ProductsServices')
                ->has('products', 1)
                ->where('products.0.id', $product->id)
                ->where('products.0.name', 'Porcelain Crown')
                ->where('products.0.category', 'Fixed')
                ->where('products.0.design_price', '$85')
                ->where('products.0.mfg_price', '$220')
                ->where('products.0.rush_fee', '+$45')
                ->where('products.0.created_by', $admin->name)
                ->where('products.0.created_at', $product->created_at->timezone(config('app.timezone'))->format('M j, Y · g:i A'))
                ->where('canCreateProducts', true)
                ->where('canUpdateProducts', true)
                ->where('canDeleteProducts', true)
        );
});

test('super admins can create a product', function () {
    $admin = createProductAdmin('create-product@dev.com');

    $this->actingAs($admin)
        ->post(route('admin.products.store'), [
            'name' => 'Custom Nightguard',
            'category' => 'Removable',
            'material' => 'Hard Acrylic',
            'design_price' => 70,
            'mfg_price' => 175,
            'rush_fee' => 35,
        ])
        ->assertRedirect(route('admin.products.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('products', [
        'name' => 'Custom Nightguard',
        'category' => 'Removable',
        'material' => 'Hard Acrylic',
        'design_price' => '70.00',
        'mfg_price' => '175.00',
        'rush_fee' => '35.00',
        'created_by' => $admin->id,
    ]);
});

test('super admins can update a product', function () {
    $admin = createProductAdmin('update-product@dev.com');
    $product = Product::factory()->create([
        'name' => 'Old Crown',
        'category' => 'Fixed',
        'material' => 'Zirconia',
        'design_price' => 85,
        'mfg_price' => 220,
        'rush_fee' => 45,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.products.update', $product), [
            'name' => 'Updated Crown',
            'category' => 'Fixed',
            'material' => 'E.Max',
            'design_price' => 95,
            'mfg_price' => 250,
            'rush_fee' => 55,
        ])
        ->assertRedirect(route('admin.products.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'name' => 'Updated Crown',
        'material' => 'E.Max',
        'design_price' => '95.00',
        'mfg_price' => '250.00',
        'rush_fee' => '55.00',
    ]);
});

test('super admins can permanently delete a product', function () {
    $admin = createProductAdmin('delete-product@dev.com');
    $product = Product::factory()->create([
        'name' => 'Disposable Product',
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.products.destroy', $product))
        ->assertRedirect(route('admin.products.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('products', [
        'id' => $product->id,
    ]);
});

test('product create requires validation', function () {
    $admin = createProductAdmin('validate-product@dev.com');

    $this->actingAs($admin)
        ->from(route('admin.products.index'))
        ->post(route('admin.products.store'), [])
        ->assertRedirect(route('admin.products.index'))
        ->assertSessionHasErrors([
            'name',
            'category',
            'material',
            'design_price',
            'mfg_price',
            'rush_fee',
        ]);
});

test('users without product permissions cannot mutate the catalog', function () {
    test()->seed(RolePermissionSeeder::class);

    $dentist = User::factory()->create([
        'email' => 'dentist-products@dev.com',
    ]);
    $dentist->assignRole(AppPermissions::DENTIST_ROLE);

    $product = Product::factory()->create();

    $this->actingAs($dentist)
        ->post(route('admin.products.store'), [
            'name' => 'Blocked Product',
            'category' => 'Fixed',
            'material' => 'Zirconia',
            'design_price' => 10,
            'mfg_price' => 20,
            'rush_fee' => 5,
        ])
        ->assertForbidden();

    $this->actingAs($dentist)
        ->put(route('admin.products.update', $product), [
            'name' => 'Blocked Update',
            'category' => 'Fixed',
            'material' => 'Zirconia',
            'design_price' => 10,
            'mfg_price' => 20,
            'rush_fee' => 5,
        ])
        ->assertForbidden();

    $this->actingAs($dentist)
        ->delete(route('admin.products.destroy', $product))
        ->assertForbidden();
});
