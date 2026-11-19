<?php

namespace App\Support;

use App\Enums\CaseOutput;
use App\Enums\CaseService;
use App\Models\DentalPackagePrice;
use App\Models\DentalProduct;
use Illuminate\Database\Eloquent\Builder;

/**
 * Resolves default package prices.
 *
 * Pricing key: product + material + service (+ output when service is
 * Manufacture). The manufacturing method is implied by the material choice and
 * models are covered by the output choice, so neither is a pricing dimension.
 *
 * `manufacture_method` / `model_service` columns remain on the table for
 * legacy rows only. They are ignored for matching; when more than one legacy
 * row shares a key, {@see self::applyPriority()} picks one deterministically.
 * The browser resolves prices from {@see self::catalogRows()}, which applies the
 * exact same ordering, so UI and server always agree.
 */
class PackagePriceResolver
{
    /**
     * Resolve default package price in minor units (cents).
     */
    public function resolveMinor(
        int $productId,
        ?int $materialId,
        CaseService|string $service,
        CaseOutput|string|null $output = null,
    ): int {
        $serviceEnum = $service instanceof CaseService
            ? $service
            : CaseService::from($service);

        $outputValue = $serviceEnum->requiresManufactureOptions()
            ? ($this->enumValue($output) ?? CaseOutput::Appliance->value)
            : null;

        $exact = $this->queryPrice($productId, $materialId, $serviceEnum->value, $outputValue);

        if ($exact !== null) {
            return $exact;
        }

        if ($materialId !== null) {
            $fallback = $this->queryPrice($productId, null, $serviceEnum->value, $outputValue);

            if ($fallback !== null) {
                return $fallback;
            }
        }

        return 0;
    }

    public function resolveDollars(
        int $productId,
        ?int $materialId,
        CaseService|string $service,
        CaseOutput|string|null $output = null,
    ): float {
        return round($this->resolveMinor(
            $productId,
            $materialId,
            $service,
            $output,
        ) / 100, 2);
    }

    /**
     * One row per (product, material, service, output) key.
     *
     * @return list<array{
     *     productKey: string,
     *     productId: int,
     *     materialId: int|null,
     *     service: string,
     *     output: string|null,
     *     price: float
     * }>
     */
    public function catalogRows(): array
    {
        $seen = [];
        $rows = [];

        $query = DentalPackagePrice::query()->with('product:id,code,name');

        foreach (self::applyPriority($query)->get() as $row) {
            if (! $row->product instanceof DentalProduct) {
                continue;
            }

            $service = $row->service?->value ?? CaseService::Design->value;
            $output = $row->output?->value;

            // Mirror resolveMinor(): output only exists for Manufacture. Rows
            // that lookup could never return must not reach the browser either.
            $isManufacture = $service === CaseService::Manufacture->value;

            if ($isManufacture !== ($output !== null)) {
                continue;
            }

            $key = implode('|', [
                $row->dental_product_id,
                $row->dental_material_id ?? 'null',
                $service,
                $output ?? 'null',
            ]);

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $rows[] = [
                'productKey' => CaseCreateCatalog::productKey($row->product),
                'productId' => $row->dental_product_id,
                'materialId' => $row->dental_material_id,
                'service' => $service,
                'output' => $output,
                'price' => $row->priceDollars(),
            ];
        }

        return $rows;
    }

    /**
     * Deterministic ordering shared by single-price lookup and the catalog
     * payload: current rows (no legacy columns) first, then legacy rows with
     * the default "no model service" / "mill" combination, then lowest id.
     *
     * @param  Builder<DentalPackagePrice>  $query
     * @return Builder<DentalPackagePrice>
     */
    public static function applyPriority(Builder $query): Builder
    {
        return $query
            ->orderByRaw("case when model_service is null then 0 when model_service = 'none' then 1 else 2 end")
            ->orderByRaw("case when manufacture_method is null then 0 when manufacture_method = 'mill' then 1 else 2 end")
            ->orderBy('id');
    }

    protected function queryPrice(
        int $productId,
        ?int $materialId,
        string $service,
        ?string $output,
    ): ?int {
        $query = DentalPackagePrice::query()
            ->where('dental_product_id', $productId)
            ->where('service', $service);

        if ($materialId === null) {
            $query->whereNull('dental_material_id');
        } else {
            $query->where('dental_material_id', $materialId);
        }

        if ($output === null) {
            $query->whereNull('output');
        } else {
            $query->where('output', $output);
        }

        $price = self::applyPriority($query)->value('price_minor');

        return $price === null ? null : (int) $price;
    }

    protected function enumValue(mixed $value): ?string
    {
        if ($value instanceof \BackedEnum) {
            return (string) $value->value;
        }

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
