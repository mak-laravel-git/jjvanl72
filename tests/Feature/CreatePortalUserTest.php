<?php

use App\Enums\UserStatus;
use App\Models\DentalClient;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('super admins can open the create user page for a type', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($admin)
        ->get(route('admin.users.create', ['tab' => 'designers']))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Users/Create')
                ->where('activeTab', 'designers')
                ->where('role', AppPermissions::DESIGNER_ROLE)
                ->has('roles', 5)
                ->has('statuses', 2)
        );
});

test('super admins can create a portal user under a type', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);
    $client = DentalClient::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Dr. New Dentist',
            'email' => 'new-dentist@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'status' => UserStatus::Active->value,
            'role' => AppPermissions::DENTIST_ROLE,
            'client_id' => $client->id,
        ])
        ->assertRedirect(route('admin.users.index', ['tab' => 'dentists']));

    $user = User::query()->where('email', 'new-dentist@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->name)->toBe('Dr. New Dentist')
        ->and($user->client_id)->toBe($client->id)
        ->and($user->hasRole(AppPermissions::DENTIST_ROLE))->toBeTrue();
});

test('creating a dentist requires a dental client', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Dr. No Client',
            'email' => 'no-client@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'status' => UserStatus::Active->value,
            'role' => AppPermissions::DENTIST_ROLE,
        ])
        ->assertSessionHasErrors('client_id');
});

test('creating a designer does not require a dental client', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Design User',
            'email' => 'new-designer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => AppPermissions::DESIGNER_ROLE,
        ])
        ->assertRedirect(route('admin.users.index', ['tab' => 'designers']));

    $user = User::query()->where('email', 'new-designer@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->client_id)->toBeNull();
});

test('a created portal user can authenticate to the portal dashboard', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);
    $client = DentalClient::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Lab User',
            'email' => 'new-lab@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => AppPermissions::LAB_ROLE,
            'client_id' => $client->id,
        ]);

    $this->post(route('logout'));

    $this->post(route('login.store'), [
        'email' => 'new-lab@example.com',
        'password' => 'password123',
    ])->assertRedirect(route('dashboard'));

    $user = User::query()->where('email', 'new-lab@example.com')->first();

    $this->assertAuthenticatedAs($user);
});

test('admins with users.create can create a portal user', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo(['users.view', 'users.create']);
    $client = DentalClient::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Assigned Denturist',
            'email' => 'created-denturist@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => AppPermissions::DENTURIST_ROLE,
            'client_id' => $client->id,
        ])
        ->assertRedirect(route('admin.users.index', ['tab' => 'denturists']));

    expect(
        User::query()->where('email', 'created-denturist@example.com')->first()?->hasRole(AppPermissions::DENTURIST_ROLE),
    )->toBeTrue();
});

test('users.create is required to create a portal user', function () {
    $admin = User::factory()->create();
    $admin->givePermissionTo(['users.view', 'users.update']);

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Blocked User',
            'email' => 'blocked@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => AppPermissions::DENTIST_ROLE,
        ])
        ->assertForbidden();
});

test('portal users cannot be created with an admin role', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Fake Admin',
            'email' => 'fake-admin@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => AppPermissions::SUPER_ADMIN_ROLE,
        ])
        ->assertSessionHasErrors('role');
});

test('creating a portal user requires a unique email', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    User::factory()->create([
        'email' => 'taken@example.com',
        'password' => Hash::make('password'),
    ]);
    $client = DentalClient::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Duplicate Email',
            'email' => 'taken@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => AppPermissions::DENTURIST_ROLE,
            'client_id' => $client->id,
        ])
        ->assertSessionHasErrors('email');
});

test('updating a designer does not require a dental client', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $user = User::factory()->create([
        'name' => 'Design User',
        'email' => 'designer-update@example.com',
    ]);
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($admin)
        ->put(route('admin.users.update', $user), [
            'name' => 'Design User Updated',
            'email' => 'designer-update@example.com',
            'status' => UserStatus::Active->value,
            'role' => AppPermissions::DESIGNER_ROLE,
        ])
        ->assertRedirect(route('admin.users.show', $user));

    expect($user->fresh()->client_id)->toBeNull();
});
