<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class FirebaseWebConfig
{
    public const STORAGE_PATH = 'firebase-web-config.json';

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return [
            'apiKey',
            'authDomain',
            'projectId',
            'messagingSenderId',
            'appId',
        ];
    }

    /**
     * Web client config from env/config (for SW + sync).
     *
     * @return array<string, string>
     */
    public static function fromEnvironment(): array
    {
        return [
            'apiKey' => (string) config('firebase.web.api_key', ''),
            'authDomain' => (string) config('firebase.web.auth_domain', ''),
            'projectId' => (string) config('firebase.web.project_id', ''),
            'messagingSenderId' => (string) config('firebase.web.messaging_sender_id', ''),
            'appId' => (string) config('firebase.web.app_id', ''),
        ];
    }

    /**
     * Resolve config: storage file first, then env; persist env to storage when missing.
     *
     * @return array<string, string>
     */
    public static function resolve(): array
    {
        $fromStorage = self::readFromStorage();

        if ($fromStorage !== null) {
            return $fromStorage;
        }

        $fromEnv = self::fromEnvironment();

        if (self::hasAnyValue($fromEnv)) {
            self::write($fromEnv);
        }

        return $fromEnv;
    }

    /**
     * @return array<string, string>|null
     */
    public static function readFromStorage(): ?array
    {
        $disk = Storage::disk('local');

        if (! $disk->exists(self::STORAGE_PATH)) {
            return null;
        }

        $decoded = json_decode($disk->get(self::STORAGE_PATH) ?: '', true);

        if (! is_array($decoded)) {
            Log::warning('Firebase web config storage file is invalid JSON.', [
                'path' => self::STORAGE_PATH,
            ]);

            return null;
        }

        return self::normalize($decoded);
    }

    /**
     * @param  array<string, mixed>  $config
     */
    public static function write(array $config): void
    {
        Storage::disk('local')->put(
            self::STORAGE_PATH,
            json_encode(self::normalize($config), JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)."\n",
        );
    }

    /**
     * Sync storage from current environment config.
     *
     * @return array<string, string>
     */
    public static function syncFromEnvironment(): array
    {
        $config = self::fromEnvironment();
        self::write($config);

        return $config;
    }

    public static function toJavaScript(array $config = []): string
    {
        $payload = $config === [] ? self::resolve() : self::normalize($config);

        if (! self::hasAnyValue($payload)) {
            $payload = new \stdClass;
        }

        return 'self.__FIREBASE_CONFIG__ = '.json_encode($payload, JSON_UNESCAPED_SLASHES).';';
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, string>
     */
    public static function normalize(array $input): array
    {
        $normalized = [];

        foreach (self::keys() as $key) {
            $normalized[$key] = array_key_exists($key, $input)
                ? (string) $input[$key]
                : '';
        }

        return $normalized;
    }

    /**
     * @param  array<string, string>  $config
     */
    public static function hasAnyValue(array $config): bool
    {
        foreach ($config as $value) {
            if ($value !== '') {
                return true;
            }
        }

        return false;
    }
}
