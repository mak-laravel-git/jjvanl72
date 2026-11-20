<?php

namespace Database\Factories;

use App\Models\DentalClient;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<DentalClient>
 */
class DentalClientFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'code' => Str::upper(Str::substr(Str::slug($name, ''), 0, 8)).fake()->unique()->numerify('##'),
            'name' => $name,
            'address' => fake()->streetAddress().', '.fake()->city(),
            'office_number' => fake()->phoneNumber(),
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
