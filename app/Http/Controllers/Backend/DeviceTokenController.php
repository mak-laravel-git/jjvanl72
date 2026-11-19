<?php

namespace App\Http\Controllers\Backend;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\StoreDeviceTokenRequest;
use Illuminate\Http\JsonResponse;

class DeviceTokenController extends Controller
{
    /**
     * Persist the authenticated user's FCM device token (web token refresh).
     */
    public function update(StoreDeviceTokenRequest $request): JsonResponse
    {
        $request->user()->forceFill([
            'device_token' => $request->validated('token'),
        ])->save();

        return response()->json([
            'status' => true,
            'message' => 'Device token saved.',
        ]);
    }
}
