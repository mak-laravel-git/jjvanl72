<?php

use App\Models\DentalClient;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function createDentalClientsSuperAdmin(string $email = 'dental-clients-admin@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

function createDentalClientsLimitedAdmin(array $permissions, string $email = 'dental-clients-limited@dev.com'): User
{
    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $role = Role::findOrCreate('Dental Clients Limited '.$email, AppPermissions::GUARD);
    $role->syncPermissions(
        collect($permissions)
            ->map(fn (string $permission) => Permission::findByName($permission, AppPermissions::GUARD))
            ->all(),
    );
    $admin->assignRole($role);

    return $admin;
}

test('guests cannot view dental clients', function () {
    $this->get(route('admin.dental-clients.index'))
        ->assertRedirect(route('login'));
});

test('users without view permission cannot open dental clients', function () {
    $admin = createDentalClientsLimitedAdmin(['dashboard.view']);

    $this->actingAs($admin)
        ->get(route('admin.dental-clients.index'))
        ->assertForbidden();
});

test('super admins can list dental clients with index props', function () {
    $admin = createDentalClientsSuperAdmin();
    $client = DentalClient::factory()->create([
        'code' => 'BRIGHT01',
        'name' => 'Bright Dental',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.dental-clients.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/DentalClients/Index')
                ->has('clients', 1)
                ->where('clients.0.id', $client->id)
                ->where('clients.0.code', 'BRIGHT01')
                ->where('clients.0.name', 'Bright Dental')
                ->where('canCreate', true)
                ->where('canUpdate', true)
                ->where('canDelete', true)
        );
});

test('super admins can create a dental client', function () {
    $admin = createDentalClientsSuperAdmin('create-clients@dev.com');

    $this->actingAs($admin)
        ->post(route('admin.dental-clients.store'), [
            'code' => 'valley01',
            'name' => 'Valley Dental Lab',
            'is_active' => '1',
        ])
        ->assertRedirect(route('admin.dental-clients.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('dental_clients', [
        'code' => 'VALLEY01',
        'name' => 'Valley Dental Lab',
        'is_active' => 1,
    ]);
});

test('creating a dental client validates unique code', function () {
    $admin = createDentalClientsSuperAdmin('unique-clients@dev.com');
    DentalClient::factory()->create(['code' => 'BRIGHT01']);

    $this->actingAs($admin)
        ->post(route('admin.dental-clients.store'), [
            'code' => 'BRIGHT01',
            'name' => 'Duplicate',
            'is_active' => '1',
        ])
        ->assertSessionHasErrors(['code']);
});

test('super admins can update a dental client', function () {
    $admin = createDentalClientsSuperAdmin('update-clients@dev.com');
    $client = DentalClient::factory()->create([
        'code' => 'OLD01',
        'name' => 'Old Name',
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.dental-clients.update', $client), [
            'code' => 'NEW01',
            'name' => 'New Name',
            'is_active' => '0',
        ])
        ->assertRedirect(route('admin.dental-clients.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('dental_clients', [
        'id' => $client->id,
        'code' => 'NEW01',
        'name' => 'New Name',
        'is_active' => 0,
    ]);
});

test('super admins can soft delete a dental client', function () {
    $admin = createDentalClientsSuperAdmin('delete-clients@dev.com');
    $client = DentalClient::factory()->create(['name' => 'Removable']);

    $this->actingAs($admin)
        ->delete(route('admin.dental-clients.destroy', $client))
        ->assertRedirect(route('admin.dental-clients.index'))
        ->assertSessionHas('success');

    $this->assertSoftDeleted('dental_clients', [
        'id' => $client->id,
    ]);
});

test('users without delete permission cannot delete dental clients', function () {
    $admin = createDentalClientsLimitedAdmin(
        ['dental-clients.view'],
        'view-only-clients@dev.com',
    );
    $client = DentalClient::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.dental-clients.destroy', $client))
        ->assertForbidden();

    $this->assertDatabaseHas('dental_clients', [
        'id' => $client->id,
        'deleted_at' => null,
    ]);
});
