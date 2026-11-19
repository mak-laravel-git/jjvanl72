<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\NotificationType;
use App\Events\ReverbPingEvent;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RealtimeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('backend/Admin/Realtime/Index');
    }

    /**
     * Dispatch a public diagnostic broadcast on the "reverb-ping" channel.
     */
    public function ping(Request $request): JsonResponse
    {
        $event = new ReverbPingEvent(
            message: (string) $request->query('message', 'Hello from Laravel Reverb'),
            triggeredAt: now()->toIso8601String(),
            source: 'admin-console',
        );

        broadcast($event);

        return response()->json([
            'status' => true,
            'message' => 'Event dispatched.',
            'data' => [
                'channel' => 'reverb-ping',
                'event' => 'ping',
                'payload' => $event->broadcastWith(),
            ],
        ]);
    }

    /**
     * Expose the effective broadcasting target (no secrets) for deployment checks.
     */
    public function health(): JsonResponse
    {
        $connection = (string) config('broadcasting.default');
        $options = (array) config("broadcasting.connections.{$connection}.options", []);
        $key = (string) config("broadcasting.connections.{$connection}.key", '');

        return response()->json([
            'status' => true,
            'message' => 'Broadcasting configuration.',
            'data' => [
                'broadcast_connection' => $connection,
                'host' => $options['host'] ?? null,
                'port' => $options['port'] ?? null,
                'scheme' => $options['scheme'] ?? null,
                'app_key_preview' => $key === '' ? null : substr($key, 0, 8).'...',
            ],
        ]);
    }

    /**
     * Send a private test notification to the current user via notify_user().
     */
    public function testNotification(Request $request): JsonResponse
    {
        $user = $request->user();

        $notification = notify_user($user, [
            'title' => 'Realtime console test',
            'body' => 'Private channel push sent at '.now()->toIso8601String(),
            'type' => NotificationType::System,
            'reference' => 'realtime-console',
        ], $user);

        return response()->json([
            'status' => true,
            'message' => 'Test notification dispatched.',
            'data' => [
                'notification_id' => $notification->id,
                'channel' => 'App.Models.User.'.$user->id,
                'event' => 'notification.created',
            ],
        ]);
    }
}
