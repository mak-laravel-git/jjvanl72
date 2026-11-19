<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use App\Support\PortalDemoData;
use Inertia\Inertia;
use Inertia\Response;

class PortalNotificationsController extends Controller
{
    public function __invoke(): Response
    {
        $notifications = PortalDemoData::notifications();

        return Inertia::render('backend/User/Notifications', [
            'unreadCount' => collect($notifications)->where('read', false)->count(),
            'notifications' => $notifications,
        ]);
    }
}
