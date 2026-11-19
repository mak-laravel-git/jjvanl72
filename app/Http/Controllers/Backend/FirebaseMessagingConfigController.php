<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Support\FirebaseWebConfig;
use Illuminate\Http\Response;

class FirebaseMessagingConfigController extends Controller
{
    /**
     * Serve Firebase web config for the messaging service worker.
     */
    public function __invoke(): Response
    {
        return response(
            FirebaseWebConfig::toJavaScript(),
            200,
            [
                'Content-Type' => 'application/javascript; charset=UTF-8',
                'Cache-Control' => 'no-store, no-cache, must-revalidate',
            ],
        );
    }
}
