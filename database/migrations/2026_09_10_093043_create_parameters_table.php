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
        Schema::create('parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('parameter_groups')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('dental_products')->cascadeOnDelete();
            $table->foreignId('material_id')->constrained('dental_materials')->cascadeOnDelete();
            $table->string('type');
            $table->timestamps();

            $table->index(['group_id', 'product_id', 'material_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parameters');
    }
};
