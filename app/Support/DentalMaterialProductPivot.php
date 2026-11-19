<?php

namespace App\Support;

use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use Illuminate\Support\Facades\DB;

class DentalMaterialProductPivot
{
    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array<int, array{sort_order: int, is_default: bool}>
     */
    public static function normalize(array $rows, bool $atMostOneDefault = true): array
    {
        $sync = [];
        $defaultAssigned = false;

        foreach (array_values($rows) as $index => $row) {
            if (! is_array($row)) {
                continue;
            }

            $id = (int) ($row['id'] ?? 0);

            if ($id <= 0) {
                continue;
            }

            $isDefault = filter_var($row['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if ($atMostOneDefault && $isDefault) {
                if ($defaultAssigned) {
                    $isDefault = false;
                } else {
                    $defaultAssigned = true;
                }
            }

            $sync[$id] = [
                'sort_order' => $index,
                'is_default' => $isDefault,
            ];
        }

        return $sync;
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    public static function syncForProduct(DentalProduct $product, array $rows): void
    {
        $product->materials()->sync(self::normalize($rows, atMostOneDefault: true));
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    public static function syncForMaterial(DentalMaterial $material, array $rows): void
    {
        // Each row is a product; multiple products may mark this material as default.
        $sync = self::normalize($rows, atMostOneDefault: false);

        $material->products()->sync($sync);

        $defaultProductIds = collect($sync)
            ->filter(fn (array $pivot): bool => $pivot['is_default'])
            ->keys()
            ->all();

        if ($defaultProductIds === []) {
            return;
        }

        DB::table('dental_material_dental_product')
            ->whereIn('dental_product_id', $defaultProductIds)
            ->where('dental_material_id', '!=', $material->id)
            ->update(['is_default' => false]);
    }

    /**
     * @return array{
     *     id: int,
     *     code: string,
     *     name: string,
     *     sort_order: int,
     *     is_default: bool
     * }
     */
    public static function mapRelated(DentalMaterial|DentalProduct $related): array
    {
        return [
            'id' => $related->id,
            'code' => $related->code,
            'name' => $related->name,
            'sort_order' => (int) $related->pivot->sort_order,
            'is_default' => (bool) $related->pivot->is_default,
        ];
    }
}
