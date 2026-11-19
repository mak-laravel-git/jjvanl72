<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dental_case_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dental_case_id')->constrained('dental_cases')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role');
            $table->string('status');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['dental_case_id', 'user_id', 'role']);
            $table->index(['user_id', 'role']);
            $table->index(['dental_case_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dental_case_assignments');
    }
};
