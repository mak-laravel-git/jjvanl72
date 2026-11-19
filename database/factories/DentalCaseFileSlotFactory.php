<?php

namespace Database\Factories;

use App\Models\DentalCase;
use App\Models\DentalCaseFileSlot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalCaseFileSlot>
 */
class DentalCaseFileSlotFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'case_id' => DentalCase::factory(),
            'code' => 'upperArch',
            'label' => 'Upper Arch',
            'sort_order' => 0,
            'created_by_user_id' => User::factory(),
        ];
    }
}
