<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('parameters', function (Blueprint $table) {
            $table->string('field_name')->nullable()->after('name');
        });

        $rows = DB::table('parameters')->orderBy('id')->get(['id', 'name']);

        foreach ($rows as $index => $row) {
            $base = Str::slug((string) $row->name, '_') ?: 'parameter';
            $fieldName = $base;
            $suffix = 1;

            while (
                DB::table('parameters')
                    ->where('field_name', $fieldName)
                    ->where('id', '!=', $row->id)
                    ->exists()
            ) {
                $fieldName = $base.'_'.$suffix;
                $suffix++;
            }

            DB::table('parameters')
                ->where('id', $row->id)
                ->update([
                    'field_name' => $fieldName !== '' ? $fieldName : 'parameter_'.($index + 1),
                ]);
        }

        Schema::table('parameters', function (Blueprint $table) {
            $table->string('field_name')->nullable(false)->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parameters', function (Blueprint $table) {
            $table->dropUnique(['field_name']);
            $table->dropColumn('field_name');
        });
    }
};
