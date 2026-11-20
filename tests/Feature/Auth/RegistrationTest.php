<?php

use App\Enums\UserStatus;
use App\Models\DentalClient;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function registrationPayload(array $overrides = []): array
{
    return [
        'role' => AppPermissions::DENTIST_ROLE,
        'name' => 'Dr. Jane Smith',
        'business_name' => 'Smile Dental Clinic',
        'address' => '12 Main Street, Springfield',
        'cell_number' => '555-123-4567',
        'office_number' => '555-765-4321',
        'email' => 'jane@smile-dental.test',
        'password' => 'Str0ng-Passw0rd!',
        'password_confirmation' => 'Str0ng-Passw0rd!',
        ...$overrides,
    ];
}

test('register url opens the login page with the register pane', function () {
    $this->get('/register')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('auth/login')
                ->where('mode', 'register')
                ->where('canRegister', true)
                ->where('roles', AppPermissions::submitterTypes())
        );
});

test('login page offers registration with only the three client roles', function () {
    $this->get('/login')
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('auth/login')
                ->where('mode', 'login')
                ->where('canRegister', true)
                ->where('roles', ['Dentist', 'Denturist', 'Lab'])
        );
});

test('clients can register as dentist denturist or lab', function (string $role) {
    $this->post('/register', registrationPayload([
        'role' => $role,
        'email' => strtolower($role).'@example.test',
        'business_name' => "{$role} Business",
    ]))->assertRedirect(route('dashboard', absolute: false));

    $this->assertAuthenticated();

    $user = User::query()->where('email', strtolower($role).'@example.test')->firstOrFail();
    $client = DentalClient::query()->where('name', "{$role} Business")->firstOrFail();

    expect($user->hasRole($role))->toBeTrue()
        ->and($user->platformRole())->toBe($role)
        ->and($user->name)->toBe('Dr. Jane Smith')
        ->and($user->phone)->toBe('555-123-4567')
        ->and($user->status)->toBe(UserStatus::Active)
        ->and($user->client_id)->toBe($client->id)
        ->and($client->address)->toBe('12 Main Street, Springfield')
        ->and($client->office_number)->toBe('555-765-4321')
        ->and($client->is_active)->toBeTrue()
        ->and($client->code)->toStartWith('CL-');
})->with([
    AppPermissions::DENTIST_ROLE,
    AppPermissions::DENTURIST_ROLE,
    AppPermissions::LAB_ROLE,
]);

test('background roles cannot self register', function (?string $role) {
    $this->post('/register', registrationPayload(['role' => $role]))
        ->assertSessionHasErrors('role');

    $this->assertGuest();
    expect(User::query()->where('email', 'jane@smile-dental.test')->exists())->toBeFalse()
        ->and(DentalClient::query()->where('name', 'Smile Dental Clinic')->exists())->toBeFalse();
})->with([
    AppPermissions::DESIGNER_ROLE,
    AppPermissions::MANUFACTURER_ROLE,
    AppPermissions::SUPER_ADMIN_ROLE,
    'Nonexistent',
    null,
]);

test('registration requires every client detail', function () {
    $this->post('/register', [])
        ->assertSessionHasErrors([
            'role',
            'name',
            'business_name',
            'address',
            'cell_number',
            'office_number',
            'email',
            'password',
        ]);

    $this->assertGuest();
    expect(DentalClient::query()->count())->toBe(0);
});

test('registration rejects an email that is already taken', function () {
    User::factory()->create(['email' => 'jane@smile-dental.test']);

    $this->post('/register', registrationPayload())
        ->assertSessionHasErrors('email');

    $this->assertGuest();
    expect(DentalClient::query()->count())->toBe(0);
});

test('registration rejects a mismatched password confirmation', function () {
    $this->post('/register', registrationPayload(['password_confirmation' => 'different']))
        ->assertSessionHasErrors('password');

    $this->assertGuest();
});

test('authenticated users are redirected away from register', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get('/register')->assertRedirect();
});
