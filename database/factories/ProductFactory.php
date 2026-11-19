<?php

namespace Database\Factories;

use App\Enums\ProductCategory;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
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
            'category' => fake()->randomElement(ProductCategory::cases()),
            'material' => fake()->randomElement([
                'Zirconia',
                'E.Max',
                'Hybrid',
                'Acrylic',
                'Flexite',
                'Hard Acrylic',
            ]),
            'design_price' => fake()->randomFloat(2, 50, 400),
            'mfg_price' => fake()->randomFloat(2, 100, 2000),
            'rush_fee' => fake()->randomFloat(2, 20, 300),
        ];
    }
}
