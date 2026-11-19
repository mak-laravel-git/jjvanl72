<?php

namespace Database\Factories;

use App\Models\DentalCase;
use App\Models\DentalCaseItem;
use App\Models\DentalProduct;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalCaseItem>
 */
class DentalCaseItemFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'case_id' => DentalCase::factory(),
            'product_id' => DentalProduct::factory(),
            'material_id' => null,
            'parameters' => [],
            'product_code_snapshot' => 'CROWN',
            'product_name_snapshot' => 'Crown / Retainer',
            'arch' => 'upper',
            'quantity' => 1,
            'unit_price_minor' => 0,
            'material_name_snapshot' => null,
            'shade' => 'A2',
            'configuration_json' => [
                'kind' => 'tooth',
            ],
            'sort_order' => 0,
        ];
    }
}
