<?php

namespace Database\Seeders;

use App\Data\NotificationPayload;
use App\Enums\NotificationType;
use App\Models\User;
use App\Services\NotificationService;
use App\Support\AppPermissions;
use Illuminate\Database\Seeder;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        $admins = User::query()
            ->permission('notifications.view', AppPermissions::GUARD)
            ->get();

        if ($admins->isEmpty()) {
            $admins = User::query()
                ->role(AppPermissions::SUPER_ADMIN_ROLE, AppPermissions::GUARD)
                ->get();
        }

        if ($admins->isEmpty()) {
            return;
        }

        $service = app(NotificationService::class);
        $actor = $admins->first();

        $samples = [
            [
                'title' => 'New case submitted',
                'body' => 'Dr. Amy Chen submitted a bridge case',
                'type' => NotificationType::Case,
                'reference' => 'APX-2839',
            ],
            [
                'title' => 'Assignment pending',
                'body' => 'Bright Smile Clinic needs a designer assigned',
                'type' => NotificationType::Assignment,
                'reference' => 'APX-2844',
            ],
            [
                'title' => 'Payment overdue',
                'body' => '$4,100 from Sunrise Dental Partners is 8 days overdue',
                'type' => NotificationType::Payment,
                'reference' => 'INV-1043',
            ],
            [
                'title' => 'Welcome to notifications',
                'body' => 'Your in-app notification inbox is ready.',
                'type' => NotificationType::System,
                'reference' => null,
            ],
        ];

        foreach ($samples as $sample) {
            $service->send(
                NotificationPayload::from($sample),
                $admins,
                $actor,
            );
        }
    }
}
