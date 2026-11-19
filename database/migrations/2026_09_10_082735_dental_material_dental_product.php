<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('dental_material_dental_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dental_material_id')->constrained('dental_materials')->cascadeOnDelete();
            $table->foreignId('dental_product_id')->constrained('dental_products')->cascadeOnDelete();
            $table->unsignedBigInteger('sort_order')->default(0);
            $table->boolean('is_default')->default(false);
            $table->bigInteger('price_adjustment_minor')->default(0);
            $table->timestamps();

            $table->unique(
                ['dental_material_id', 'dental_product_id'],
                'dental_material_product_unique',
            );
            $table->index(
                ['dental_product_id', 'sort_order'],
                'dental_material_product_sort_index',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dental_material_dental_product');
    }
};
