<?php

use App\Enums\CaseService;
use App\Models\DentalPackagePrice;
use App\Models\DentalProduct;
use App\Support\PackagePriceResolver;
use Database\Seeders\DentalCaseCreateCatalogSeeder;
use Database\Seeders\DentalPackagePriceSeeder;

it('seeds design, approve, and one manufacture row per output for each product', function () {
    $this->seed(DentalCaseCreateCatalogSeeder::class);
    $this->seed(DentalPackagePriceSeeder::class);

    $products = DentalProduct::query()->where('is_active', true)->get();

    expect($products)->not->toBeEmpty();

    foreach ($products as $product) {
        expect(
            DentalPackagePrice::query()
                ->where('dental_product_id', $product->id)
                ->whereNull('dental_material_id')
                ->where('service', CaseService::Design)
                ->exists(),
        )->toBeTrue("Missing Design fallback for product {$product->code}");

        expect(
            DentalPackagePrice::query()
                ->where('dental_product_id', $product->id)
                ->whereNull('dental_material_id')
                ->where('service', CaseService::Approve)
                ->exists(),
        )->toBeTrue("Missing Approve fallback for product {$product->code}");

        expect(
            DentalPackagePrice::query()
                ->where('dental_product_id', $product->id)
                ->whereNull('dental_material_id')
                ->where('service', CaseService::Manufacture)
                ->count(),
        )->toBe(2, "Expected 2 Manufacture fallbacks (one per output) for product {$product->code}");

        expect(
            DentalPackagePrice::query()
                ->where('dental_product_id', $product->id)
                ->where('service', CaseService::Manufacture)
                ->where(fn ($query) => $query->whereNotNull('manufacture_method')->orWhereNotNull('model_service'))
                ->exists(),
        )->toBeFalse("Manufacture rows must not carry method/model for product {$product->code}");
    }
});

it('seeds material-specific design rows for crown materials', function () {
    $this->seed(DentalCaseCreateCatalogSeeder::class);
    $this->seed(DentalPackagePriceSeeder::class);

    $crown = DentalProduct::query()->where('code', 'crown')->with('materials')->firstOrFail();
    $zirconia = $crown->materials->firstWhere('name', 'Zirconia');

    expect($zirconia)->not->toBeNull();

    expect(
        DentalPackagePrice::query()
            ->where('dental_product_id', $crown->id)
            ->where('dental_material_id', $zirconia->id)
            ->where('service', CaseService::Design)
            ->exists(),
    )->toBeTrue();
});

it('is idempotent when re-run', function () {
    $this->seed(DentalCaseCreateCatalogSeeder::class);
    $this->seed(DentalPackagePriceSeeder::class);

    $count = DentalPackagePrice::query()->count();

    $this->seed(DentalPackagePriceSeeder::class);

    expect(DentalPackagePrice::query()->count())->toBe($count)
        ->and($count)->toBeGreaterThan(0);
});

it('resolves a positive crown design package price after seeding', function () {
    $this->seed(DentalCaseCreateCatalogSeeder::class);
    $this->seed(DentalPackagePriceSeeder::class);

    $crown = DentalProduct::query()->where('code', 'crown')->firstOrFail();
    $minor = app(PackagePriceResolver::class)->resolveMinor(
        $crown->id,
        null,
        CaseService::Design,
    );

    expect($minor)->toBeGreaterThan(0);
});
