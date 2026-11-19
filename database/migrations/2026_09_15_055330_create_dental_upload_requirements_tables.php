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
        Schema::create('dental_upload_requirements', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->json('accepted_extensions')->nullable();
            $table->json('accepted_mime_types')->nullable();
            $table->timestamps();
        });

        Schema::create('dental_product_upload_requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                ->constrained('dental_products')
                ->cascadeOnDelete();
            $table->foreignId('upload_requirement_id')
                ->constrained('dental_upload_requirements')
                ->cascadeOnDelete();
            $table->boolean('is_required')->default(false);
            $table->string('requirement_group', 50)->nullable();
            $table->unsignedInteger('group_min_files')->nullable();
            $table->unsignedInteger('min_files')->default(0);
            $table->unsignedInteger('max_files')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['product_id', 'upload_requirement_id'], 'dental_product_upload_req_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dental_product_upload_requirements');
        Schema::dropIfExists('dental_upload_requirements');
    }
};
