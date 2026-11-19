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
        Schema::create('parameters_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parameter_id')->constrained('parameters')->cascadeOnDelete();
            $table->string('label');
            $table->string('field_name');
            $table->string('placeholder')->nullable();
            $table->string('value')->nullable();
            $table->string('image')->nullable();
            $table->timestamps();

            $table->index(['parameter_id', 'field_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parameters_options');
    }
};
