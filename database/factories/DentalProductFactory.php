<?php

namespace Database\Factories;

use App\Models\DentalProduct;
use App\Models\DentalProductGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalProduct>
 */
class DentalProductFactory extends Factory
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
            'dental_product_group_id' => DentalProductGroup::factory(),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes): array => [
            'is_active' => false,
        ]);
    }
}
