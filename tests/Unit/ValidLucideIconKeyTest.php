<?php

use App\Rules\ValidLucideIconKey;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    ValidLucideIconKey::flush();
});

test('lucide icon keys file exists and is populated', function () {
    $path = storage_path('app/lucide-icon-keys.json');

    expect(is_file($path))->toBeTrue();

    $keys = ValidLucideIconKey::keys();

    expect($keys)->toBeArray()
        ->and(count($keys))->toBeGreaterThan(1000)
        ->and(ValidLucideIconKey::contains('settings'))->toBeTrue()
        ->and(ValidLucideIconKey::contains('file-text'))->toBeTrue()
        ->and(ValidLucideIconKey::contains('not-a-real-icon-zzz'))->toBeFalse();
});

test('valid lucide icon key rule accepts known keys', function () {
    $rule = new ValidLucideIconKey;
    $failed = false;

    $rule->validate('icon', 'file-text', function () use (&$failed) {
        $failed = true;
    });

    expect($failed)->toBeFalse();
});

test('valid lucide icon key rule rejects unknown kebab keys', function () {
    $rule = new ValidLucideIconKey;
    $failed = false;

    $rule->validate('icon', 'not-a-real-icon-zzz', function () use (&$failed) {
        $failed = true;
    });

    expect($failed)->toBeTrue();
});
