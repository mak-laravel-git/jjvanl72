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
        // MySQL may use the (product_id, field_name) unique as the supporting
        // index for parameters_product_id_foreign. Add a dedicated index first.
        if (! $this->hasIndex('parameters', 'parameters_product_id_index')) {
            Schema::table('parameters', function (Blueprint $table) {
                $table->index('product_id', 'parameters_product_id_index');
            });
        }

        Schema::table('parameters', function (Blueprint $table) {
            if ($this->hasIndex('parameters', 'parameters_product_id_name_unique')) {
                $table->dropUnique('parameters_product_id_name_unique');
            }

            if ($this->hasIndex('parameters', 'parameters_product_id_field_name_unique')) {
                $table->dropUnique('parameters_product_id_field_name_unique');
            }

            $table->unique(['product_id', 'name', 'material_id']);
            $table->unique(['product_id', 'field_name', 'material_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! $this->hasIndex('parameters', 'parameters_product_id_index')) {
            Schema::table('parameters', function (Blueprint $table) {
                $table->index('product_id', 'parameters_product_id_index');
            });
        }

        Schema::table('parameters', function (Blueprint $table) {
            if ($this->hasIndex('parameters', 'parameters_product_id_name_material_id_unique')) {
                $table->dropUnique('parameters_product_id_name_material_id_unique');
            }

            if ($this->hasIndex('parameters', 'parameters_product_id_field_name_material_id_unique')) {
                $table->dropUnique('parameters_product_id_field_name_material_id_unique');
            }

            $table->unique(['product_id', 'name']);
            $table->unique(['product_id', 'field_name']);
        });
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        foreach (Schema::getIndexes($table) as $index) {
            if (($index['name'] ?? null) === $indexName) {
                return true;
            }
        }

        return false;
    }
};
