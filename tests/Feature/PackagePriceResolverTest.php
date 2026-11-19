<?php

use App\Enums\CaseOutput;
use App\Enums\CaseService;
use App\Models\DentalMaterial;
use App\Models\DentalPackagePrice;
use App\Models\DentalProduct;
use App\Support\PackagePriceResolver;

function priceFor(
    DentalProduct $product,
    ?DentalMaterial $material,
    CaseService $service,
    ?CaseOutput $output = null,
): int {
    return app(PackagePriceResolver::class)->resolveMinor(
        $product->id,
        $material?->id,
        $service,
        $output,
    );
}

it('resolves an exact material price and falls back to the no-material row', function () {
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();
    $other = DentalMaterial::factory()->create();

    DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'dental_material_id' => null,
        'service' => CaseService::Design,
        'price_minor' => 1000,
    ]);
    DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'dental_material_id' => $material->id,
        'service' => CaseService::Design,
        'price_minor' => 2500,
    ]);

    expect(priceFor($product, $material, CaseService::Design))->toBe(2500)
        ->and(priceFor($product, $other, CaseService::Design))->toBe(1000)
        ->and(priceFor($product, null, CaseService::Design))->toBe(1000)
        ->and(priceFor($product, $material, CaseService::Approve))->toBe(0);
});

it('keys manufacture prices by output only', function () {
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();

    DentalPackagePrice::factory()->manufacture()->create([
        'dental_product_id' => $product->id,
        'dental_material_id' => $material->id,
        'output' => 'appliance',
        'price_minor' => 7000,
    ]);
    DentalPackagePrice::factory()->manufacture()->create([
        'dental_product_id' => $product->id,
        'dental_material_id' => $material->id,
        'output' => 'applianceModels',
        'price_minor' => 9500,
    ]);

    expect(priceFor($product, $material, CaseService::Manufacture, CaseOutput::Appliance))->toBe(7000)
        ->and(priceFor($product, $material, CaseService::Manufacture, CaseOutput::ApplianceModels))->toBe(9500)
        ->and(priceFor($product, $material, CaseService::Manufacture))->toBe(7000);
});

it('ignores output for design and approve services', function () {
    $product = DentalProduct::factory()->create();

    DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'service' => CaseService::Approve,
        'price_minor' => 1800,
    ]);

    expect(priceFor($product, null, CaseService::Approve, CaseOutput::ApplianceModels))->toBe(1800);
});

it('picks the legacy mill + no-model row deterministically and the catalog agrees', function () {
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();

    // Insert in an adversarial order so id order cannot explain the winner.
    foreach ([
        ['print', 'design', 5000],
        ['print', 'none', 4000],
        ['mill', 'designPrint', 6000],
        ['mill', 'none', 3000],
    ] as [$method, $model, $price]) {
        DentalPackagePrice::factory()->create([
            'dental_product_id' => $product->id,
            'dental_material_id' => $material->id,
            'service' => CaseService::Manufacture,
            'manufacture_method' => $method,
            'output' => 'appliance',
            'model_service' => $model,
            'price_minor' => $price,
        ]);
    }

    $rows = collect(app(PackagePriceResolver::class)->catalogRows())
        ->where('productId', $product->id);

    expect(priceFor($product, $material, CaseService::Manufacture, CaseOutput::Appliance))->toBe(3000)
        ->and($rows)->toHaveCount(1)
        ->and($rows->first()['price'])->toBe(30.0)
        ->and($rows->first())->not->toHaveKeys(['manufactureMethod', 'modelService']);
});

it('prefers a current row over any legacy row for the same key', function () {
    $product = DentalProduct::factory()->create();

    DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'service' => CaseService::Manufacture,
        'manufacture_method' => 'mill',
        'output' => 'appliance',
        'model_service' => 'none',
        'price_minor' => 3000,
    ]);
    DentalPackagePrice::factory()->manufacture()->create([
        'dental_product_id' => $product->id,
        'output' => 'appliance',
        'price_minor' => 8800,
    ]);

    expect(priceFor($product, null, CaseService::Manufacture, CaseOutput::Appliance))->toBe(8800);
});

it('never exposes catalog rows that the resolver could not return', function () {
    $product = DentalProduct::factory()->create();

    // Manufacture without an output and a design row carrying an output.
    DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'service' => CaseService::Manufacture,
        'output' => null,
        'price_minor' => 1111,
    ]);
    DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'service' => CaseService::Design,
        'output' => 'appliance',
        'price_minor' => 2222,
    ]);

    expect(collect(app(PackagePriceResolver::class)->catalogRows())->where('productId', $product->id))
        ->toBeEmpty();
});

it('has a catalog row for every resolvable price and the values match the resolver', function () {
    $product = DentalProduct::factory()->create();
    $material = DentalMaterial::factory()->create();

    DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'service' => CaseService::Design,
        'price_minor' => 1000,
    ]);
    DentalPackagePrice::factory()->create([
        'dental_product_id' => $product->id,
        'dental_material_id' => $material->id,
        'service' => CaseService::Approve,
        'price_minor' => 1350,
    ]);
    DentalPackagePrice::factory()->manufacture()->create([
        'dental_product_id' => $product->id,
        'dental_material_id' => $material->id,
        'output' => 'applianceModels',
        'price_minor' => 9900,
    ]);

    $resolver = app(PackagePriceResolver::class);
    $rows = collect($resolver->catalogRows())->where('productId', $product->id);

    expect($rows)->toHaveCount(3);

    foreach ($rows as $row) {
        $expected = $resolver->resolveDollars(
            $row['productId'],
            $row['materialId'],
            $row['service'],
            $row['output'],
        );

        expect($row['price'])->toBe($expected);
    }
});
