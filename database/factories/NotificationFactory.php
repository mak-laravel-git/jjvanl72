<?php

namespace Database\Factories;

use App\Enums\NotificationType;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Notification>
 */
class NotificationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(NotificationType::cases());

        return [
            'uuid' => (string) Str::uuid(),
            'type' => $type,
            'title' => fake()->sentence(4),
            'body' => fake()->sentence(12),
            'reference' => fake()->optional()->bothify('APX-####'),
            'icon' => $type->defaultIcon(),
            'icon_bg' => $type->defaultIconBg(),
            'data' => null,
            'action_url' => null,
            'created_by' => null,
        ];
    }

    public function forType(NotificationType $type): static
    {
        return $this->state(fn (): array => [
            'type' => $type,
            'icon' => $type->defaultIcon(),
            'icon_bg' => $type->defaultIconBg(),
        ]);
    }

    public function createdBy(User $user): static
    {
        return $this->state(fn (): array => [
            'created_by' => $user->id,
        ]);
    }
}
