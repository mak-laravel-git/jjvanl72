<?php

use App\Models\DentalClient;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

test('every submitter stakeholder role shares the same portal dashboard', function (string $role) {
    $user = User::factory()->create();
    $user->assignRole($role);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/UserDashboard')
                ->where('auth.user.role', $role)
                ->where('auth.user.name', $user->name)
                ->where('auth.user.business_name', null)
        );
})->with([
    AppPermissions::DENTIST_ROLE,
    AppPermissions::DENTURIST_ROLE,
    AppPermissions::LAB_ROLE,
]);

test('dashboard shares linked dental client business name for greetings', function () {
    $client = DentalClient::factory()->create([
        'name' => 'SmileWorks Dental Clinic',
    ]);
    $user = User::factory()->create([
        'name' => 'Dr. Sarah Mitchell',
        'client_id' => $client->id,
    ]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/UserDashboard')
                ->where('auth.user.name', 'Dr. Sarah Mitchell')
                ->where('auth.user.business_name', 'SmileWorks Dental Clinic')
        );
});

test('designers see the designer dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/UserDashboard')
                ->where('auth.user.role', AppPermissions::DESIGNER_ROLE)
        );
});

test('manufacturers see the manufacturing dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/UserDashboard')
                ->where('auth.user.role', AppPermissions::MANUFACTURER_ROLE)
        );
});

test('authenticated users without dashboard permission are forbidden', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('profile.view');

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertForbidden();
});
