<?php

namespace Database\Factories;

use App\Models\DentalCaseItem;
use App\Models\DentalCaseItemTooth;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalCaseItemTooth>
 */
class DentalCaseItemToothFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'case_item_id' => DentalCaseItem::factory(),
            'tooth_number' => fake()->randomElement([11, 12, 13, 21, 22, 23, 31, 32, 41, 42]),
        ];
    }
}
