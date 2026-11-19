<?php

namespace Database\Factories;

use App\Enums\CaseService;
use App\Models\DentalPackagePrice;
use App\Models\DentalProduct;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalPackagePrice>
 */
class DentalPackagePriceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'dental_product_id' => DentalProduct::factory(),
            'dental_material_id' => null,
            'service' => CaseService::Design,
            'manufacture_method' => null,
            'output' => null,
            'model_service' => null,
            'price_minor' => fake()->numberBetween(1000, 20000),
        ];
    }

    public function manufacture(): static
    {
        return $this->state(fn (array $attributes): array => [
            'service' => CaseService::Manufacture,
            'manufacture_method' => null,
            'output' => 'appliance',
            'model_service' => null,
        ]);
    }
}
