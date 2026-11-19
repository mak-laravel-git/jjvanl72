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
        Schema::table('dental_product_groups', function (Blueprint $table) {
            $table->string('code')->nullable()->change();
            $table->integer('sort_order')->nullable()->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dental_product_groups', function (Blueprint $table) {
            $table->string('code')->nullable(false)->change();
            $table->integer('sort_order')->nullable(false)->default(0)->change();
        });
    }
};
