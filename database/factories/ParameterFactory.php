<?php

namespace Database\Factories;

use App\Enums\ParameterType;
use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use App\Models\Parameter;
use App\Models\ParameterGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Parameter>
 */
class ParameterFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->words(2, true),
            'field_name' => fake()->unique()->slug(2),
            'group_id' => ParameterGroup::factory(),
            'product_id' => DentalProduct::factory(),
            'material_id' => DentalMaterial::factory(),
            'type' => ParameterType::Option,
        ];
    }

    public function input(): static
    {
        return $this->state(fn (array $attributes): array => [
            'type' => ParameterType::Input,
        ]);
    }
}
