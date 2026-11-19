<?php

namespace Database\Factories;

use App\Models\DentalUploadRequirement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalUploadRequirement>
 */
class DentalUploadRequirementFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $code = fake()->unique()->slug(2);

        return [
            'code' => $code,
            'name' => fake()->words(3, true),
            'description' => null,
            'accepted_extensions' => ['stl', 'obj', 'ply'],
            'accepted_mime_types' => ['application/octet-stream', 'model/stl'],
        ];
    }
}
