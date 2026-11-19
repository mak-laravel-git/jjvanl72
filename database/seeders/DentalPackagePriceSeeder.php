<?php

namespace Database\Seeders;

use App\Enums\CaseOutput;
use App\Enums\CaseService;
use App\Models\DentalPackagePrice;
use App\Models\DentalProduct;
use App\Support\CaseCreateCatalog;
use Illuminate\Database\Seeder;

/**
 * Seeds package prices for every product × material (plus null fallback)
 * across Design, Approve, and Manufacture (one row per output).
 *
 * Pricing key: product + material + service (+ output for Manufacture).
 * The manufacturing method is implied by the material and models are covered
 * by the output, so neither is a separate pricing dimension.
 *
 * Pricing (dollars → price_minor):
 * - Design: catalog base price
 * - Approve: base × 1.35
 * - Manufacture: base × (2.00 + output multiplier)
 *   - output: appliance +0.00, applianceModels +0.35
 */
class DentalPackagePriceSeeder extends Seeder
{
    private const MANUFACTURE_BASE_FACTOR = 2.00;

    public function run(): void
    {
        $staticProducts = CaseCreateCatalog::static()['products'] ?? [];

        $products = DentalProduct::query()
            ->where('is_active', true)
            ->with('materials:id')
            ->orderBy('id')
            ->get();

        foreach ($products as $product) {
            $productKey = CaseCreateCatalog::productKey($product);
            $baseDollars = (float) ($staticProducts[$productKey]['price'] ?? 40);
            $materialIds = [null, ...$product->materials->pluck('id')->map(fn ($id): int => (int) $id)->all()];

            foreach (array_unique($materialIds, SORT_REGULAR) as $materialId) {
                $this->upsert(
                    $product->id,
                    $materialId,
                    CaseService::Design,
                    null,
                    $this->dollarsToMinor($baseDollars),
                );

                $this->upsert(
                    $product->id,
                    $materialId,
                    CaseService::Approve,
                    null,
                    $this->dollarsToMinor($baseDollars * 1.35),
                );

                foreach (CaseOutput::cases() as $output) {
                    $this->upsert(
                        $product->id,
                        $materialId,
                        CaseService::Manufacture,
                        $output,
                        $this->dollarsToMinor(
                            $baseDollars * $this->manufactureMultiplier($output),
                        ),
                    );
                }
            }
        }
    }

    private function manufactureMultiplier(CaseOutput $output): float
    {
        $outputAdd = match ($output) {
            CaseOutput::Appliance => 0.00,
            CaseOutput::ApplianceModels => 0.35,
        };

        return self::MANUFACTURE_BASE_FACTOR + $outputAdd;
    }

    private function dollarsToMinor(float $dollars): int
    {
        return max(0, (int) round($dollars * 100));
    }

    private function upsert(
        int $productId,
        ?int $materialId,
        CaseService $service,
        ?CaseOutput $output,
        int $priceMinor,
    ): void {
        DentalPackagePrice::query()->updateOrCreate(
            [
                'dental_product_id' => $productId,
                'dental_material_id' => $materialId,
                'service' => $service->value,
                'manufacture_method' => null,
                'output' => $output?->value,
                'model_service' => null,
            ],
            [
                'price_minor' => $priceMinor,
            ],
        );
    }
}
