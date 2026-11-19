<?php

namespace Database\Factories;

use App\Models\Parameter;
use App\Models\ParameterOption;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ParameterOption>
 */
class ParameterOptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'parameter_id' => Parameter::factory(),
            'label' => fake()->words(2, true),
            'field_name' => fake()->unique()->slug(2),
            'placeholder' => fake()->optional()->sentence(3),
            'value' => fake()->optional()->word(),
            'color' => null,
            'image' => null,
        ];
    }
}
