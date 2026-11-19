<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\Features;

beforeEach(function (): void {
    $this->seed(RolePermissionSeeder::class);
});

test('login with device_token stores it on the user', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('password'),
        'device_token' => null,
    ]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'device_token' => 'fcm-token-from-login',
    ])->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
    expect($user->fresh()->device_token)->toBe('fcm-token-from-login');
});

test('login without device_token leaves existing token unchanged', function (): void {
    $user = User::factory()->create([
        'password' => Hash::make('password'),
        'device_token' => 'existing-fcm-token',
    ]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('dashboard'));

    expect($user->fresh()->device_token)->toBe('existing-fcm-token');
});

test('two factor login persists stashed device_token from the initial login', function (): void {
    if (! Features::canManageTwoFactorAuthentication()) {
        $this->markTestSkipped('Two-factor authentication is not enabled.');
    }

    $user = User::factory()->withTwoFactor()->create([
        'password' => Hash::make('password'),
        'device_token' => null,
    ]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
        'device_token' => 'fcm-token-before-2fa',
    ])->assertRedirect(route('two-factor.login'));

    expect($user->fresh()->device_token)->toBeNull();

    $this->post(route('two-factor.login.store'), [
        'recovery_code' => 'recovery-code-1',
    ])->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
    expect($user->fresh()->device_token)->toBe('fcm-token-before-2fa');
});

test('authenticated users can refresh device token after login', function (): void {
    $user = User::factory()->create([
        'device_token' => null,
    ]);

    $this->actingAs($user)
        ->putJson(route('device-token.update'), [
            'token' => 'web-fcm-refresh-token',
        ])
        ->assertOk()
        ->assertJson(['status' => true]);

    expect($user->fresh()->device_token)->toBe('web-fcm-refresh-token');
});
