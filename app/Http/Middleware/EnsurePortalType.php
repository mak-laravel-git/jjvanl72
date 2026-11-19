<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePortalType
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$types): Response
    {
        $portalType = $request->user()?->platformRole();

        if ($portalType === null) {
            abort(403);
        }

        if ($types !== [] && ! in_array($portalType, $types, true)) {
            abort(403);
        }

        return $next($request);
    }
}
