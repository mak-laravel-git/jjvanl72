<?php

namespace Database\Seeders;

use App\Enums\ProductCategory;
use App\Models\Product;
use App\Models\User;
use App\Support\AppPermissions;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $createdBy = User::query()
            ->role(AppPermissions::SUPER_ADMIN_ROLE, AppPermissions::GUARD)
            ->value('id');

        $products = [
            [
                'name' => 'Porcelain Crown',
                'category' => ProductCategory::Fixed,
                'material' => 'Zirconia',
                'design_price' => 85,
                'mfg_price' => 220,
                'rush_fee' => 45,
            ],
            [
                'name' => '3-Unit Bridge',
                'category' => ProductCategory::Fixed,
                'material' => 'E.Max',
                'design_price' => 120,
                'mfg_price' => 480,
                'rush_fee' => 80,
            ],
            [
                'name' => 'Implant Crown',
                'category' => ProductCategory::Fixed,
                'material' => 'Zirconia',
                'design_price' => 110,
                'mfg_price' => 380,
                'rush_fee' => 65,
            ],
            [
                'name' => 'All-On-4 Arch',
                'category' => ProductCategory::Fixed,
                'material' => 'Hybrid',
                'design_price' => 380,
                'mfg_price' => 1800,
                'rush_fee' => 250,
            ],
            [
                'name' => 'Full Denture',
                'category' => ProductCategory::Removable,
                'material' => 'Acrylic',
                'design_price' => 95,
                'mfg_price' => 280,
                'rush_fee' => 50,
            ],
            [
                'name' => 'Partial Denture',
                'category' => ProductCategory::Removable,
                'material' => 'Flexite',
                'design_price' => 80,
                'mfg_price' => 220,
                'rush_fee' => 40,
            ],
            [
                'name' => 'Nightguard',
                'category' => ProductCategory::Removable,
                'material' => 'Hard Acrylic',
                'design_price' => 65,
                'mfg_price' => 160,
                'rush_fee' => 30,
            ],
        ];

        foreach ($products as $product) {
            Product::query()->updateOrCreate(
                ['name' => $product['name']],
                [
                    ...$product,
                    'created_by' => $createdBy,
                ],
            );
        }
    }
}
