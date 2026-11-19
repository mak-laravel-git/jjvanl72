<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('backend/Admin/SystemSettings', [
            'sections' => [
                [
                    'key' => 'security',
                    'title' => 'Security',
                    'items' => [
                        [
                            'key' => 'two_factor',
                            'label' => 'Two-Factor Authentication',
                            'description' => 'Require 2FA for all admin accounts',
                            'enabled' => true,
                        ],
                        [
                            'key' => 'ip_restrictions',
                            'label' => 'IP Restrictions',
                            'description' => 'Limit admin access to approved IP addresses',
                            'enabled' => false,
                        ],
                    ],
                ],
                [
                    'key' => 'notifications',
                    'title' => 'Notifications',
                    'items' => [
                        [
                            'key' => 'email_notifications',
                            'label' => 'Email Notifications',
                            'description' => 'Send email alerts for critical platform events',
                            'enabled' => true,
                        ],
                        [
                            'key' => 'push_notifications',
                            'label' => 'Push Notifications',
                            'description' => 'Enable browser push notifications for admins',
                            'enabled' => false,
                        ],
                    ],
                ],
                [
                    'key' => 'workflow',
                    'title' => 'Workflow',
                    'items' => [
                        [
                            'key' => 'auto_assignment',
                            'label' => 'Auto-Assignment',
                            'description' => 'Automatically assign designers to new cases',
                            'enabled' => false,
                        ],
                    ],
                ],
            ],
            'paymentGateways' => [
                [
                    'key' => 'stripe',
                    'name' => 'Stripe',
                    'connected' => true,
                ],
                [
                    'key' => 'paypal',
                    'name' => 'PayPal',
                    'connected' => false,
                ],
            ],
        ]);
    }
}
