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
        Schema::create('dental_cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_number', 32)->unique();
            $table->foreignId('client_id')->constrained('dental_clients');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('patient_id')->constrained('patients');
            $table->string('reference', 80)->nullable();
            $table->string('patient_name_snapshot', 160);
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 32)->default('draft');
            $table->unsignedInteger('lock_version')->default(1);
            $table->json('configuration_json')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['client_id', 'reference']);
            $table->index(['client_id', 'status']);
            $table->index(['client_id', 'due_date']);
            $table->index(['status', 'submitted_at']);
            $table->index('patient_id');
        });

        Schema::create('dental_case_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')
                ->constrained('dental_cases')
                ->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('dental_products');
            $table->foreignId('material_id')
                ->nullable()
                ->constrained('dental_materials')
                ->nullOnDelete();
            $table->json('parameters')->nullable();
            $table->string('product_code_snapshot', 50);
            $table->string('product_name_snapshot', 120);
            $table->string('arch', 10)->nullable();
            $table->unsignedInteger('quantity');
            $table->bigInteger('unit_price_minor')->default(0);
            $table->string('material_name_snapshot', 120)->nullable();
            $table->string('shade', 12)->nullable();
            $table->json('configuration_json')->nullable();
            $table->unsignedInteger('config_schema_version')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['case_id', 'sort_order']);
            $table->index('product_id');
            $table->index('material_id');
        });

        Schema::create('dental_case_item_teeth', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_item_id')
                ->constrained('dental_case_items')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('tooth_number');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['case_item_id', 'tooth_number']);
            $table->index('tooth_number');
        });

        Schema::create('dental_case_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')
                ->constrained('dental_cases')
                ->cascadeOnDelete();
            $table->foreignId('case_item_id')
                ->nullable()
                ->constrained('dental_case_items')
                ->nullOnDelete();
            $table->foreignId('upload_requirement_id')
                ->nullable()
                ->constrained('dental_upload_requirements')
                ->nullOnDelete();
            $table->string('requirement_code_snapshot', 50);
            $table->string('storage_disk', 50);
            $table->string('storage_path', 500);
            $table->string('original_name', 255);
            $table->string('mime_type', 120);
            $table->unsignedBigInteger('size_bytes');
            $table->char('sha256', 64)->nullable();
            $table->string('status', 24)->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->foreignId('uploaded_by_user_id')->constrained('users');
            $table->timestamp('scanned_at')->nullable();
            $table->timestamps();

            $table->index(['case_id', 'requirement_code_snapshot'], 'dental_case_files_case_req_index');
            $table->index('case_item_id');
            $table->index('status');
            $table->index('sha256');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dental_case_files');
        Schema::dropIfExists('dental_case_item_teeth');
        Schema::dropIfExists('dental_case_items');
        Schema::dropIfExists('dental_cases');
    }
};
