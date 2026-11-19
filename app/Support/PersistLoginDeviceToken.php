<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;

class PersistLoginDeviceToken
{
    public const SESSION_KEY = 'login.device_token';

    /**
     * Persist a non-empty device_token from the current request (or 2FA session stash).
     */
    public static function fromRequest(Request $request): void
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return;
        }

        $token = self::resolveToken($request);

        if ($token === null) {
            return;
        }

        $user->forceFill(['device_token' => $token])->save();
    }

    /**
     * Stash device_token when password auth succeeds but 2FA is required.
     */
    public static function stashFromRequest(Request $request): void
    {
        $token = self::normalize($request->input('device_token'));

        if ($token === null) {
            return;
        }

        $request->session()->put(self::SESSION_KEY, $token);
    }

    private static function resolveToken(Request $request): ?string
    {
        $fromRequest = self::normalize($request->input('device_token'));

        if ($fromRequest !== null) {
            $request->session()->forget(self::SESSION_KEY);

            return $fromRequest;
        }

        return self::normalize($request->session()->pull(self::SESSION_KEY));
    }

    private static function normalize(mixed $token): ?string
    {
        if (! is_string($token)) {
            return null;
        }

        $token = trim($token);

        if ($token === '' || strlen($token) > 512) {
            return null;
        }

        return $token;
    }
}
