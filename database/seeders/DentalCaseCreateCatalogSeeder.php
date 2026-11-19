<?php

namespace Database\Seeders;

use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use App\Models\DentalProductGroup;
use App\Support\CaseCreateCatalog;
use App\Support\DentalMaterialProductPivot;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DentalCaseCreateCatalogSeeder extends Seeder
{
    /**
     * Seed case-create dental product groups, products, materials, and pivots.
     */
    public function run(): void
    {
        $catalog = CaseCreateCatalog::static();
        $groups = $catalog['productGroups'] ?? [];
        $products = $catalog['products'] ?? [];
        $materialsByGroup = $catalog['materialsByGroup'] ?? [];
        $materialsByProduct = $catalog['materialsByProduct'] ?? [];

        $groupModels = [];

        foreach (array_values($groups) as $index => $group) {
            $groupModels[$group['id']] = DentalProductGroup::query()->updateOrCreate(
                ['code' => $group['id']],
                [
                    'name' => $group['title'],
                    'sort_order' => $index,
                    'is_active' => true,
                ],
            );
        }

        $productModelsByKey = [];

        foreach ($groups as $group) {
            $groupModel = $groupModels[$group['id']] ?? null;

            if ($groupModel === null) {
                continue;
            }

            foreach (array_values($group['productKeys']) as $productIndex => $productKey) {
                $definition = $products[$productKey] ?? null;

                if ($definition === null) {
                    continue;
                }

                $productModelsByKey[$productKey] = DentalProduct::query()->updateOrCreate(
                    ['code' => $productKey],
                    [
                        'name' => $definition['label'],
                        'icon' => null,
                        'is_active' => true,
                        'sort_order' => $productIndex,
                        'dental_product_group_id' => $groupModel->id,
                    ],
                );
            }
        }

        $materialModelsByName = [];
        $materialSort = 0;

        foreach ($materialsByGroup as $materialRows) {
            foreach ($materialRows as $materialRow) {
                $name = (string) ($materialRow['name'] ?? '');

                if ($name === '' || isset($materialModelsByName[$name])) {
                    continue;
                }

                $materialModelsByName[$name] = DentalMaterial::query()->updateOrCreate(
                    ['code' => Str::slug($name)],
                    [
                        'name' => $name,
                        'icon' => null,
                        'is_active' => true,
                        'sort_order' => $materialSort++,
                    ],
                );
            }
        }

        foreach ($materialsByProduct as $materialRows) {
            foreach ($materialRows as $materialRow) {
                $name = (string) ($materialRow['name'] ?? '');

                if ($name === '' || isset($materialModelsByName[$name])) {
                    continue;
                }

                $materialModelsByName[$name] = DentalMaterial::query()->updateOrCreate(
                    ['code' => Str::slug($name)],
                    [
                        'name' => $name,
                        'icon' => null,
                        'is_active' => true,
                        'sort_order' => $materialSort++,
                    ],
                );
            }
        }

        foreach ($groups as $group) {
            $groupMaterials = $materialsByGroup[$group['title']] ?? [];
            $pivotRows = [];

            foreach (array_values($groupMaterials) as $materialIndex => $materialRow) {
                $material = $materialModelsByName[$materialRow['name']] ?? null;

                if ($material === null) {
                    continue;
                }

                $pivotRows[] = [
                    'id' => $material->id,
                    'sort_order' => $materialIndex,
                    'is_default' => $materialIndex === 0,
                ];
            }

            foreach ($group['productKeys'] as $productKey) {
                $product = $productModelsByKey[$productKey] ?? null;

                if ($product === null) {
                    continue;
                }

                $overrideRows = $materialsByProduct[$productKey] ?? null;

                if (is_array($overrideRows)) {
                    $productPivotRows = [];

                    foreach (array_values($overrideRows) as $materialIndex => $materialRow) {
                        $material = $materialModelsByName[$materialRow['name'] ?? ''] ?? null;

                        if ($material === null) {
                            continue;
                        }

                        $productPivotRows[] = [
                            'id' => $material->id,
                            'sort_order' => $materialIndex,
                            'is_default' => $materialIndex === 0,
                        ];
                    }

                    DentalMaterialProductPivot::syncForProduct($product, $productPivotRows);

                    continue;
                }

                DentalMaterialProductPivot::syncForProduct($product, $pivotRows);
            }
        }
    }
}
