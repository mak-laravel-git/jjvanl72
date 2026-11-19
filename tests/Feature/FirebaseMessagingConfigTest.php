<?php

use App\Support\FirebaseWebConfig;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

test('firebase messaging config is rendered from storage', function () {
    Storage::disk('local')->put(FirebaseWebConfig::STORAGE_PATH, json_encode([
        'apiKey' => 'storage-key',
        'authDomain' => 'example.firebaseapp.com',
        'projectId' => 'example-project',
        'messagingSenderId' => '123',
        'appId' => '1:123:web:abc',
    ], JSON_UNESCAPED_SLASHES));

    $this->get(route('firebase.messaging-config'))
        ->assertOk()
        ->assertHeader('Content-Type', 'application/javascript; charset=UTF-8')
        ->assertSee('self.__FIREBASE_CONFIG__', false)
        ->assertSee('storage-key', false)
        ->assertSee('example-project', false);
});

test('firebase messaging config falls back to env and writes storage', function () {
    Config::set('firebase.web', [
        'api_key' => 'env-key',
        'auth_domain' => 'env.firebaseapp.com',
        'project_id' => 'env-project',
        'messaging_sender_id' => '999',
        'app_id' => '1:999:web:xyz',
    ]);

    $this->get(route('firebase.messaging-config'))
        ->assertOk()
        ->assertSee('env-key', false)
        ->assertSee('env-project', false);

    Storage::disk('local')->assertExists(FirebaseWebConfig::STORAGE_PATH);

    $stored = json_decode(Storage::disk('local')->get(FirebaseWebConfig::STORAGE_PATH), true);

    expect($stored['apiKey'])->toBe('env-key');
    expect($stored['projectId'])->toBe('env-project');
});

test('firebase messaging config returns empty object when unconfigured', function () {
    Config::set('firebase.web', [
        'api_key' => '',
        'auth_domain' => '',
        'project_id' => '',
        'messaging_sender_id' => '',
        'app_id' => '',
    ]);

    $this->get(route('firebase.messaging-config'))
        ->assertOk()
        ->assertSee('self.__FIREBASE_CONFIG__ = {};', false);
});

test('firebase sync web config artisan command writes storage file', function () {
    Config::set('firebase.web', [
        'api_key' => 'sync-key',
        'auth_domain' => 'sync.firebaseapp.com',
        'project_id' => 'sync-project',
        'messaging_sender_id' => '111',
        'app_id' => '1:111:web:sync',
    ]);

    $this->artisan('firebase:sync-web-config')
        ->assertSuccessful();

    Storage::disk('local')->assertExists(FirebaseWebConfig::STORAGE_PATH);

    $stored = json_decode(Storage::disk('local')->get(FirebaseWebConfig::STORAGE_PATH), true);

    expect($stored['apiKey'])->toBe('sync-key');
});
