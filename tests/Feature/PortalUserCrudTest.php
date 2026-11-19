<?php

use App\Enums\UserStatus;
use App\Models\DentalClient;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function createPortalCrudAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

test('user management defaults to the all tab and paginates stakeholders', function () {
    $admin = createPortalCrudAdmin();
    $dentist = User::factory()->create(['name' => 'All Tab Dentist']);
    $dentist->assignRole(AppPermissions::DENTIST_ROLE);
    $lab = User::factory()->create(['name' => 'All Tab Lab']);
    $lab->assignRole(AppPermissions::LAB_ROLE);
    User::factory()->create()->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/UserManagement')
                ->where('activeTab', AppPermissions::ALL_USERS_TAB)
                ->has('tabs', 6)
                ->where('tabs.0.id', AppPermissions::ALL_USERS_TAB)
                ->has('users.data', 2)
                ->where('canUpdateUsers', true)
        );
});

test('user management search filters stakeholders across tabs', function () {
    $admin = createPortalCrudAdmin();
    $match = User::factory()->create([
        'name' => 'Searchable Mitchell',
        'email' => 'searchable@example.com',
        'location' => 'Austin',
    ]);
    $match->assignRole(AppPermissions::DENTIST_ROLE);
    User::factory()->create(['name' => 'Other User'])->assignRole(AppPermissions::LAB_ROLE);

    $this->actingAs($admin)
        ->get(route('admin.users.index', [
            'tab' => AppPermissions::ALL_USERS_TAB,
            'search' => 'Mitchell',
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('users.data', 1)
                ->where('users.data.0.email', 'searchable@example.com')
                ->where('filters.search', 'Mitchell')
        );
});

test('super admins can view a portal user details page', function () {
    $admin = createPortalCrudAdmin();
    $user = User::factory()->create([
        'phone' => '+1 555-0100',
        'location' => 'Dallas',
        'status' => UserStatus::Active,
    ]);
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($admin)
        ->get(route('admin.users.show', $user))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/Users/Show')
                ->where('user.email', $user->email)
                ->where('user.phone', '+1 555-0100')
                ->where('user.location', 'Dallas')
                ->where('user.role', AppPermissions::DESIGNER_ROLE)
        );
});

test('super admins can update a portal user profile fields', function () {
    Storage::fake('public');

    $admin = createPortalCrudAdmin();
    $client = DentalClient::factory()->create();
    $user = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'old@example.com',
        'client_id' => $client->id,
    ]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($admin)
        ->put(route('admin.users.update', $user), [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'phone' => '+1 555-9999',
            'location' => 'Houston',
            'status' => UserStatus::Inactive->value,
            'role' => AppPermissions::LAB_ROLE,
            'client_id' => $client->id,
            'avatar' => UploadedFile::fake()->image('avatar.jpg'),
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])
        ->assertRedirect(route('admin.users.show', $user));

    $user->refresh();

    expect($user->name)->toBe('Updated Name')
        ->and($user->email)->toBe('updated@example.com')
        ->and($user->phone)->toBe('+1 555-9999')
        ->and($user->location)->toBe('Houston')
        ->and($user->status)->toBe(UserStatus::Inactive)
        ->and($user->avatar)->not->toBeNull()
        ->and($user->hasRole(AppPermissions::LAB_ROLE))->toBeTrue()
        ->and($user->hasRole(AppPermissions::DENTIST_ROLE))->toBeFalse();

    Storage::disk('public')->assertExists($user->avatar);
});

test('admins cannot open show pages for super admins on users routes', function () {
    $admin = createPortalCrudAdmin();
    $otherAdmin = User::factory()->create();
    $otherAdmin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $this->actingAs($admin)
        ->get(route('admin.users.show', $otherAdmin))
        ->assertNotFound();
});

test('creating a portal user stores optional profile fields', function () {
    $admin = createPortalCrudAdmin();
    $client = DentalClient::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.users.store'), [
            'name' => 'Profiled Denturist',
            'email' => 'profiled@example.com',
            'phone' => '+1 555-1234',
            'location' => 'Seattle',
            'status' => UserStatus::Active->value,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => AppPermissions::DENTURIST_ROLE,
            'client_id' => $client->id,
        ])
        ->assertRedirect(route('admin.users.index', ['tab' => 'denturists']));

    $user = User::query()->where('email', 'profiled@example.com')->first();

    expect($user)->not->toBeNull()
        ->and($user->phone)->toBe('+1 555-1234')
        ->and($user->location)->toBe('Seattle')
        ->and($user->status)->toBe(UserStatus::Active);
});
