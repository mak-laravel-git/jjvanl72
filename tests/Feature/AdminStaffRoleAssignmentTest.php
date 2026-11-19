<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function createAccessControlAdmin(string $email = 'access-control@dev.com'): User
{
    $admin = User::factory()->create(['email' => $email]);
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

function createOperationsManagerRole(): Role
{
    $role = Role::findOrCreate('Operations Manager', AppPermissions::GUARD);
    $role->syncPermissions([
        Permission::findByName('admins.view', AppPermissions::GUARD),
        Permission::findByName('admins.create', AppPermissions::GUARD),
        Permission::findByName('admins.update', AppPermissions::GUARD),
        Permission::findByName('admins.delete', AppPermissions::GUARD),
    ]);

    return $role;
}

test('super admin can view admin staff with role assignment options', function () {
    $actor = createAccessControlAdmin();
    User::factory()->create()->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($actor)
        ->get(route('admin.staff.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Staff/Index')
                ->has('admins.data', 2)
                ->where('roles', AppPermissions::adminStaffRoleNames())
                ->where('currentAdminId', $actor->id)
        );
});

test('staff index includes custom admin roles and excludes portal users', function () {
    $actor = createAccessControlAdmin();
    createOperationsManagerRole();

    $ops = User::factory()->create(['email' => 'ops@dev.com']);
    $ops->assignRole('Operations Manager');

    $dentist = User::factory()->create(['email' => 'portal-only@dev.com']);
    $dentist->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($actor)
        ->get(route('admin.staff.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Staff/Index')
                ->has('admins.data', 2)
                ->where('roles', fn ($roles) => in_array('Operations Manager', collect($roles)->all(), true)
                    && in_array(AppPermissions::SUPER_ADMIN_ROLE, collect($roles)->all(), true)
                    && ! in_array(AppPermissions::DENTIST_ROLE, collect($roles)->all(), true))
        );
});

test('super admin can create staff with super admin role', function () {
    $actor = createAccessControlAdmin();

    $response = $this->actingAs($actor)
        ->post(route('admin.staff.store'), [
            'name' => 'Second Super Admin',
            'email' => 'second-super@dev.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'status' => 'active',
            'roles' => [
                AppPermissions::SUPER_ADMIN_ROLE,
            ],
        ]);

    $admin = User::query()->where('email', 'second-super@dev.com')->firstOrFail();

    $response->assertRedirect(route('admin.staff.show', $admin));

    expect($admin->getRoleNames()->all())->toBe([
        AppPermissions::SUPER_ADMIN_ROLE,
    ])->and($admin->isSuperAdmin())->toBeTrue();
});

test('super admin can create staff with a custom admin role', function () {
    $actor = createAccessControlAdmin();
    createOperationsManagerRole();

    $response = $this->actingAs($actor)
        ->post(route('admin.staff.store'), [
            'name' => 'Ops Lead',
            'email' => 'ops-lead@dev.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'status' => 'active',
            'roles' => ['Operations Manager'],
        ]);

    $admin = User::query()->where('email', 'ops-lead@dev.com')->firstOrFail();

    $response->assertRedirect(route('admin.staff.show', $admin));

    expect($admin->hasRole('Operations Manager'))->toBeTrue()
        ->and($admin->isSuperAdmin())->toBeFalse();
});

test('updating staff synchronizes profile fields and roles', function () {
    $actor = createAccessControlAdmin();
    createOperationsManagerRole();
    $target = User::factory()->create();
    $target->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($actor)
        ->put(route('admin.staff.update', $target), [
            'name' => 'Updated Staff Name',
            'email' => $target->email,
            'phone' => '+1 303-555-0199',
            'location' => 'Denver, CO',
            'status' => 'inactive',
            'password' => '',
            'password_confirmation' => '',
            'roles' => [AppPermissions::SUPER_ADMIN_ROLE, 'Operations Manager'],
        ])
        ->assertRedirect(route('admin.staff.show', $target));

    $target->refresh();

    expect($target->name)->toBe('Updated Staff Name')
        ->and($target->phone)->toBe('+1 303-555-0199')
        ->and($target->location)->toBe('Denver, CO')
        ->and($target->status->value)->toBe('inactive')
        ->and($target->isSuperAdmin())->toBeTrue()
        ->and($target->hasRole('Operations Manager'))->toBeTrue();
});

test('non super admins cannot grant the super admin role', function () {
    createOperationsManagerRole();
    $actor = User::factory()->create();
    $actor->assignRole('Operations Manager');

    $this->actingAs($actor)
        ->from(route('admin.staff.create'))
        ->post(route('admin.staff.store'), [
            'name' => 'Unauthorized Super Admin',
            'email' => 'unauthorized-super@dev.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'status' => 'active',
            'roles' => [AppPermissions::SUPER_ADMIN_ROLE],
        ])
        ->assertRedirect(route('admin.staff.create'))
        ->assertSessionHasErrors('roles');

    expect(User::query()->where('email', 'unauthorized-super@dev.com')->exists())->toBeFalse();
});

test('non super admins can manage custom role staff but not super admins', function () {
    createOperationsManagerRole();
    $superAdmin = createAccessControlAdmin();

    $actor = User::factory()->create();
    $actor->assignRole('Operations Manager');

    $peer = User::factory()->create(['email' => 'peer-ops@dev.com']);
    $peer->assignRole('Operations Manager');

    $this->actingAs($actor)
        ->get(route('admin.staff.edit', $superAdmin))
        ->assertForbidden();

    $this->actingAs($actor)
        ->put(route('admin.staff.update', $superAdmin), [
            'name' => 'Hijacked',
            'email' => $superAdmin->email,
            'status' => 'active',
            'roles' => [AppPermissions::SUPER_ADMIN_ROLE],
        ])
        ->assertForbidden();

    $this->actingAs($actor)
        ->delete(route('admin.staff.destroy', $superAdmin))
        ->assertForbidden();

    $this->actingAs($actor)
        ->put(route('admin.staff.update', $peer), [
            'name' => 'Peer Updated',
            'email' => $peer->email,
            'status' => 'active',
            'roles' => ['Operations Manager'],
        ])
        ->assertRedirect(route('admin.staff.show', $peer));

    expect($superAdmin->fresh()->name)->not->toBe('Hijacked')
        ->and($peer->fresh()->name)->toBe('Peer Updated');
});

test('last super admin cannot be deleted', function () {
    $actor = createAccessControlAdmin();

    $this->actingAs($actor)
        ->from(route('admin.staff.index'))
        ->delete(route('admin.staff.destroy', $actor))
        ->assertRedirect(route('admin.staff.index'))
        ->assertSessionHas('error');

    expect($actor->fresh())->not->toBeNull()
        ->and($actor->fresh()->isSuperAdmin())->toBeTrue();
});

test('last super admin role cannot be removed until another super admin exists', function () {
    createOperationsManagerRole();
    $actor = createAccessControlAdmin();

    $this->actingAs($actor)
        ->from(route('admin.staff.edit', $actor))
        ->put(route('admin.staff.update', $actor), [
            'name' => $actor->name,
            'email' => $actor->email,
            'status' => 'active',
            'roles' => ['Operations Manager'],
        ])
        ->assertRedirect(route('admin.staff.edit', $actor))
        ->assertSessionHasErrors('roles');

    expect($actor->fresh()->isSuperAdmin())->toBeTrue();

    $replacement = User::factory()->create();
    $replacement->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($actor)
        ->put(route('admin.staff.update', $actor), [
            'name' => $actor->name,
            'email' => $actor->email,
            'status' => 'active',
            'roles' => ['Operations Manager'],
        ])
        ->assertRedirect(route('admin.staff.show', $actor));

    expect($actor->fresh()->isSuperAdmin())->toBeFalse()
        ->and($actor->fresh()->hasRole('Operations Manager'))->toBeTrue()
        ->and($replacement->fresh()->isSuperAdmin())->toBeTrue();
});

test('super admin can be deleted after another super admin exists', function () {
    $actor = createAccessControlAdmin();
    $replacement = User::factory()->create();
    $replacement->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($actor)
        ->delete(route('admin.staff.destroy', $replacement))
        ->assertRedirect(route('admin.staff.index'));

    expect(User::query()->whereKey($replacement->id)->exists())->toBeFalse()
        ->and($actor->fresh()->isSuperAdmin())->toBeTrue();
});

test('staff show page works for admin staff and not portal users', function () {
    $actor = createAccessControlAdmin();
    createOperationsManagerRole();

    $ops = User::factory()->create();
    $ops->assignRole('Operations Manager');

    $dentist = User::factory()->create();
    $dentist->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($actor)
        ->get(route('admin.staff.show', $ops))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Staff/Show')
                ->where('admin.email', $ops->email)
                ->where('admin.roles', ['Operations Manager'])
        );

    $this->actingAs($actor)
        ->get(route('admin.staff.show', $dentist))
        ->assertNotFound();
});

test('precognition reports a taken staff email without creating a user', function () {
    $actor = createAccessControlAdmin();

    User::factory()->create([
        'email' => 'taken-staff@example.com',
        'password' => Hash::make('password'),
    ]);

    $userCount = User::query()->count();

    $this->actingAs($actor)
        ->withPrecognition()
        ->withHeaders(['Precognition-Validate-Only' => 'email'])
        ->postJson(route('admin.staff.store'), [
            'email' => 'taken-staff@example.com',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    expect(User::query()->count())->toBe($userCount);
});

test('precognition accepts an available staff email without creating a user', function () {
    $actor = createAccessControlAdmin();
    $userCount = User::query()->count();

    $this->actingAs($actor)
        ->withPrecognition()
        ->withHeaders(['Precognition-Validate-Only' => 'email'])
        ->postJson(route('admin.staff.store'), [
            'email' => 'available-staff@example.com',
        ])
        ->assertSuccessfulPrecognition();

    expect(User::query()->count())->toBe($userCount);
});

test('permissions page lists developer defined permissions by group', function () {
    $actor = createAccessControlAdmin();

    $this->actingAs($actor)
        ->get(route('admin.permissions.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Permissions/Index')
                ->has('groupedPermissions')
                ->has('groupedPermissions.0.permissions.0.label')
                ->has('groupedPermissions.0.permissions.0.roles')
                ->where('summary.permissions', count(AppPermissions::adminPermissions()))
                ->where('summary.roles', 1)
        );
});

test('super admin gate grants all abilities without permission pivots', function () {
    $actor = createAccessControlAdmin();
    $role = Role::findByName(
        AppPermissions::SUPER_ADMIN_ROLE,
        AppPermissions::GUARD,
    );

    expect($role->permissions)->toHaveCount(0)
        ->and($actor->can('admins.create'))->toBeTrue()
        ->and($actor->can('permissions.view'))->toBeTrue()
        ->and($actor->can('dental-product-groups.view'))->toBeTrue()
        ->and($actor->can('cases.create'))->toBeFalse()
        ->and($actor->can('profile.view'))->toBeFalse();

    foreach (AppPermissions::adminPermissions() as $permission) {
        expect($actor->can($permission))->toBeTrue();
    }
});

test('every admin route permission middleware is registered for super admin', function () {
    $registered = AppPermissions::adminPermissions();

    $routePermissions = collect(app('router')->getRoutes())
        ->filter(fn ($route) => str_starts_with((string) $route->getName(), 'admin.'))
        ->flatMap(function ($route) {
            return collect($route->gatherMiddleware())
                ->filter(fn (string $middleware) => str_starts_with($middleware, 'permission:'))
                ->flatMap(function (string $middleware) {
                    $abilities = substr($middleware, strlen('permission:'));

                    return preg_split('/[|,]/', $abilities) ?: [];
                });
        })
        ->map(fn (string $permission) => trim($permission))
        ->filter()
        ->unique()
        ->values()
        ->all();

    expect($routePermissions)->not->toBeEmpty();

    foreach ($routePermissions as $permission) {
        expect($registered)->toContain($permission);
    }
});
