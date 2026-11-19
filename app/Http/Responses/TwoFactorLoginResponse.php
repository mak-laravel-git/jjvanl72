<?php

namespace App\Http\Responses;

use App\Models\User;
use App\Support\PersistLoginDeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class TwoFactorLoginResponse implements TwoFactorLoginResponseContract
{
    /**
     * @param  Request  $request
     */
    public function toResponse($request): Response
    {
        PersistLoginDeviceToken::fromRequest($request);

        if ($request->wantsJson()) {
            return new JsonResponse('', 204);
        }

        return redirect()->to($this->destinationPath($request));
    }

    /**
     * Prefer a same-origin relative path so APP_URL host/port mismatches
     * (localhost vs 127.0.0.1) cannot break Inertia navigation after login.
     */
    private function destinationPath(Request $request): string
    {
        $user = $request->user();
        $fallback = $user instanceof User && $user->canAccessAdminPanel()
            ? route('admin.dashboard', absolute: false)
            : route('dashboard', absolute: false);

        $intended = $request->session()->pull('url.intended');

        if (! is_string($intended) || $intended === '') {
            return $fallback;
        }

        $path = parse_url($intended, PHP_URL_PATH);

        if (! is_string($path) || $path === '' || ! str_starts_with($path, '/')) {
            return $fallback;
        }

        $query = parse_url($intended, PHP_URL_QUERY);

        return is_string($query) && $query !== ''
            ? "{$path}?{$query}"
            : $path;
    }
}
