<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Manufacture package prices used to be keyed by
 * (product, material, method, output, model service) — 12 rows per
 * product/material. The method is implied by the material and models are
 * covered by the output, so the key is now (product, material, output).
 *
 * This migration collapses every legacy group to ONE row (method / model
 * service cleared). Nothing is lost silently: every row that is changed or
 * removed is first copied, with its original id, into
 * `dental_package_prices_archive`, and down() restores them exactly.
 *
 * Keeper per group = the row the app already resolved for the default
 * path: model service none/null, then method mill/null, then lowest id.
 */
return new class extends Migration
{
    private const ARCHIVE = 'dental_package_prices_archive';

    public function up(): void
    {
        if (! Schema::hasTable('dental_package_prices')) {
            return;
        }

        if (! Schema::hasTable(self::ARCHIVE)) {
            Schema::create(self::ARCHIVE, function (Blueprint $table): void {
                $table->unsignedBigInteger('id')->primary();
                $table->unsignedBigInteger('dental_product_id');
                $table->unsignedBigInteger('dental_material_id')->nullable();
                $table->string('service', 20);
                $table->string('manufacture_method', 20)->nullable();
                $table->string('output', 30)->nullable();
                $table->string('model_service', 20)->nullable();
                $table->unsignedBigInteger('price_minor')->default(0);
                $table->timestamp('original_created_at')->nullable();
                $table->timestamp('original_updated_at')->nullable();
                $table->string('archive_reason', 20);
                $table->timestamp('archived_at')->nullable();
            });
        }

        DB::transaction(function (): void {
            $groups = DB::table('dental_package_prices')
                ->where('service', 'manufacture')
                ->orderBy('id')
                ->get()
                ->groupBy(fn (object $row): string => implode('|', [
                    $row->dental_product_id,
                    $row->dental_material_id ?? 'null',
                    $row->output ?? 'null',
                ]));

            foreach ($groups as $rows) {
                $sorted = $rows
                    ->sortBy(fn (object $row): array => [
                        $this->modelRank($row->model_service),
                        $this->methodRank($row->manufacture_method),
                        $row->id,
                    ])
                    ->values();

                $keeper = $sorted->first();
                $duplicates = $sorted->slice(1);

                foreach ($duplicates as $duplicate) {
                    $this->archive($duplicate, 'duplicate');
                    DB::table('dental_package_prices')->where('id', $duplicate->id)->delete();
                }

                if ($keeper->manufacture_method !== null || $keeper->model_service !== null) {
                    $this->archive($keeper, 'normalized');
                    DB::table('dental_package_prices')
                        ->where('id', $keeper->id)
                        ->update([
                            'manufacture_method' => null,
                            'model_service' => null,
                        ]);
                }
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable(self::ARCHIVE) || ! Schema::hasTable('dental_package_prices')) {
            Schema::dropIfExists(self::ARCHIVE);

            return;
        }

        DB::transaction(function (): void {
            foreach (DB::table(self::ARCHIVE)->orderBy('id')->get() as $archived) {
                $productExists = DB::table('dental_products')
                    ->where('id', $archived->dental_product_id)
                    ->exists();
                $materialMissing = $archived->dental_material_id !== null
                    && ! DB::table('dental_materials')->where('id', $archived->dental_material_id)->exists();

                if (! $productExists || $materialMissing) {
                    continue;
                }

                $values = [
                    'dental_product_id' => $archived->dental_product_id,
                    'dental_material_id' => $archived->dental_material_id,
                    'service' => $archived->service,
                    'manufacture_method' => $archived->manufacture_method,
                    'output' => $archived->output,
                    'model_service' => $archived->model_service,
                    'price_minor' => $archived->price_minor,
                    'created_at' => $archived->original_created_at,
                    'updated_at' => $archived->original_updated_at,
                ];

                if (DB::table('dental_package_prices')->where('id', $archived->id)->exists()) {
                    DB::table('dental_package_prices')->where('id', $archived->id)->update($values);
                } else {
                    DB::table('dental_package_prices')->insert(['id' => $archived->id, ...$values]);
                }
            }
        });

        Schema::dropIfExists(self::ARCHIVE);
    }

    private function archive(object $row, string $reason): void
    {
        DB::table(self::ARCHIVE)->updateOrInsert(
            ['id' => $row->id],
            [
                'dental_product_id' => $row->dental_product_id,
                'dental_material_id' => $row->dental_material_id,
                'service' => $row->service,
                'manufacture_method' => $row->manufacture_method,
                'output' => $row->output,
                'model_service' => $row->model_service,
                'price_minor' => $row->price_minor,
                'original_created_at' => $row->created_at,
                'original_updated_at' => $row->updated_at,
                'archive_reason' => $reason,
                'archived_at' => now(),
            ],
        );
    }

    private function modelRank(?string $modelService): int
    {
        return match ($modelService) {
            null => 0,
            'none' => 1,
            default => 2,
        };
    }

    private function methodRank(?string $method): int
    {
        return match ($method) {
            null => 0,
            'mill' => 1,
            default => 2,
        };
    }
};
