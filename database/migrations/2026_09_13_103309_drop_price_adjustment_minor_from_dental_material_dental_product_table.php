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
        Schema::table('dental_material_dental_product', function (Blueprint $table) {
            $table->dropColumn('price_adjustment_minor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dental_material_dental_product', function (Blueprint $table) {
            $table->bigInteger('price_adjustment_minor')->default(0);
        });
    }
};
