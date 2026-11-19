<?php

namespace Database\Factories;

use App\Models\DentalProductGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalProductGroup>
 */
class DentalProductGroupFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => null,
            'name' => fake()->unique()->words(2, true),
            'sort_order' => null,
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
