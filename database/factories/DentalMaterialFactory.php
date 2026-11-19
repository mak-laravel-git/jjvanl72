<?php

namespace Database\Factories;

use App\Models\DentalMaterial;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalMaterial>
 */
class DentalMaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->hexColor()),
            'name' => fake()->unique()->words(2, true),
            'icon' => null,
            'sort_order' => 0,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }
}
