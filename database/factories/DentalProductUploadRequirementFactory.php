<?php

namespace Database\Factories;

use App\Models\DentalProduct;
use App\Models\DentalProductUploadRequirement;
use App\Models\DentalUploadRequirement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalProductUploadRequirement>
 */
class DentalProductUploadRequirementFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => DentalProduct::factory(),
            'upload_requirement_id' => DentalUploadRequirement::factory(),
            'is_required' => false,
            'requirement_group' => null,
            'group_min_files' => null,
            'min_files' => 0,
            'max_files' => null,
            'sort_order' => 0,
        ];
    }
}
