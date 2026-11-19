<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dental_package_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dental_product_id')->constrained('dental_products')->cascadeOnDelete();
            $table->foreignId('dental_material_id')->nullable()->constrained('dental_materials')->nullOnDelete();
            $table->string('service', 20);
            $table->string('manufacture_method', 20)->nullable();
            $table->string('output', 30)->nullable();
            $table->string('model_service', 20)->nullable();
            $table->unsignedBigInteger('price_minor')->default(0);
            $table->timestamps();

            $table->unique(
                [
                    'dental_product_id',
                    'dental_material_id',
                    'service',
                    'manufacture_method',
                    'output',
                    'model_service',
                ],
                'dental_package_prices_combo_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dental_package_prices');
    }
};
