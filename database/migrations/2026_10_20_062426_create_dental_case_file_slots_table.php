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
        Schema::create('dental_case_file_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')
                ->constrained('dental_cases')
                ->cascadeOnDelete();
            $table->string('code', 80);
            $table->string('label', 160);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->foreignId('created_by_user_id')->constrained('users');
            $table->timestamps();

            $table->unique(['case_id', 'code']);
            $table->index(['case_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dental_case_file_slots');
    }
};
