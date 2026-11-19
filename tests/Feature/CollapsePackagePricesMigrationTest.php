<?php

use App\Enums\CaseService;
use App\Models\DentalMaterial;
use App\Models\DentalPackagePrice;
use App\Models\DentalProduct;
use Illuminate\Support\Facades\DB;

function collapseMigration(): object
{
    return require database_path('migrations/2026_11_16_090000_collapse_manufacture_package_prices_to_output_key.php');
}

/**
 * @return list<DentalPackagePrice>
 */
function seedLegacyManufactureCombos(DentalProduct $product, ?DentalMaterial $material): array
{
    $rows = [];

    foreach (['mill', 'print'] as $method) {
        foreach (['appliance', 'applianceModels'] as $output) {
            foreach (['none', 'design', 'designPrint'] as $model) {
                $rows[] = DentalPackagePrice::factory()->create([
                    'dental_product_id' => $product->id,
                    'dental_material_id' => $material?->id,
                    'service' => CaseService::Manufacture,
                    'manufacture_method' => $method,
                    'output' => $output,
                    'model_service' => $model,
                    'price_minor' => 1000 + count($rows),
                ]);
            }
        }
    }

    return $rows;
}

it('collapses 12 legacy manufacture combos into one row per output', function () {
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();
    $legacy = seedLegacyManufactureCombos($product, $material);

    collapseMigration()->up();

    $remaining = DentalPackagePrice::query()
        ->where('dental_product_id', $product->id)
        ->orderBy('output')
        ->get();

    expect($remaining)->toHaveCount(2)
        ->and($remaining->pluck('output')->map->value->all())->toBe(['appliance', 'applianceModels'])
        ->and($remaining->every(fn ($row) => $row->manufacture_method === null && $row->model_service === null))->toBeTrue();

    // Keeper is the legacy mill + none row (default path), so its price survives.
    $millNone = collect($legacy)->first(
        fn ($row) => $row->manufacture_method->value === 'mill'
            && $row->model_service->value === 'none'
            && $row->output->value === 'appliance',
    );

    expect($remaining->firstWhere('output.value', 'appliance')->price_minor)->toBe($millNone->price_minor)
        ->and(DB::table('dental_package_prices_archive')->count())->toBe(12);
});

it('leaves design, approve and already-clean rows untouched and is idempotent', function () {
    $product = DentalProduct::factory()->create();

    $design = DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'service' => CaseService::Design,
        'price_minor' => 1234,
    ]);
    $clean = DentalPackagePrice::factory()->manufacture()->create([
        'dental_product_id' => $product->id,
        'output' => 'appliance',
        'price_minor' => 5678,
    ]);

    collapseMigration()->up();
    collapseMigration()->up();

    expect($design->fresh()->price_minor)->toBe(1234)
        ->and($clean->fresh()->price_minor)->toBe(5678)
        ->and(DentalPackagePrice::query()->where('dental_product_id', $product->id)->count())->toBe(2)
        ->and(DB::table('dental_package_prices_archive')->count())->toBe(0);
});

it('restores the exact legacy rows on rollback', function () {
    $product = DentalProduct::factory()->create();
    $legacy = collect(seedLegacyManufactureCombos($product, null));
    $before = $legacy
        ->mapWithKeys(fn ($row) => [$row->id => [
            $row->manufacture_method->value,
            $row->output->value,
            $row->model_service->value,
            $row->price_minor,
        ]])
        ->all();

    $migration = collapseMigration();
    $migration->up();
    $migration->down();

    $after = DentalPackagePrice::query()
        ->where('dental_product_id', $product->id)
        ->orderBy('id')
        ->get()
        ->mapWithKeys(fn ($row) => [$row->id => [
            $row->manufacture_method?->value,
            $row->output?->value,
            $row->model_service?->value,
            $row->price_minor,
        ]])
        ->all();

    expect($after)->toBe($before);
});
