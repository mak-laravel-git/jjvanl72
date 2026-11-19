<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('precognition reports a taken email without creating a user', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    User::factory()->create([
        'email' => 'taken@example.com',
        'password' => Hash::make('password'),
    ]);

    $userCount = User::query()->count();

    $this->actingAs($admin)
        ->withPrecognition()
        ->withHeaders(['Precognition-Validate-Only' => 'email'])
        ->postJson(route('admin.users.store'), [
            'email' => 'taken@example.com',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);

    expect(User::query()->count())->toBe($userCount);
});

test('precognition accepts an available email without creating a user', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $userCount = User::query()->count();

    $this->actingAs($admin)
        ->withPrecognition()
        ->withHeaders(['Precognition-Validate-Only' => 'email'])
        ->postJson(route('admin.users.store'), [
            'email' => 'available@example.com',
        ])
        ->assertSuccessfulPrecognition();

    expect(User::query()->count())->toBe($userCount);
});

test('precognition allows the current user email on update', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    $user = User::factory()->create([
        'email' => 'same@example.com',
    ]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($admin)
        ->withPrecognition()
        ->withHeaders(['Precognition-Validate-Only' => 'email'])
        ->putJson(route('admin.users.update', $user), [
            'email' => 'same@example.com',
        ])
        ->assertSuccessfulPrecognition();
});

test('precognition rejects another users email on update', function () {
    $admin = User::factory()->create();
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    User::factory()->create([
        'email' => 'taken@example.com',
    ]);

    $user = User::factory()->create([
        'email' => 'editor@example.com',
    ]);
    $user->assignRole(AppPermissions::LAB_ROLE);

    $this->actingAs($admin)
        ->withPrecognition()
        ->withHeaders(['Precognition-Validate-Only' => 'email'])
        ->putJson(route('admin.users.update', $user), [
            'email' => 'taken@example.com',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});
