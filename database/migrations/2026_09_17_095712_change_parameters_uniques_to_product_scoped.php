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
        Schema::table('parameters', function (Blueprint $table) {
            $table->dropUnique(['name']);
            $table->dropUnique(['field_name']);

            $table->unique(['product_id', 'name']);
            $table->unique(['product_id', 'field_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parameters', function (Blueprint $table) {
            $table->dropUnique(['product_id', 'name']);
            $table->dropUnique(['product_id', 'field_name']);

            $table->unique('name');
            $table->unique('field_name');
        });
    }
};
