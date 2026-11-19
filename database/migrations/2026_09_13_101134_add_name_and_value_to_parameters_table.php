<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('parameters', function (Blueprint $table) {
            $table->string('name')->nullable()->after('id');
        });

        $rows = DB::table('parameters')->orderBy('id')->get(['id']);

        foreach ($rows as $index => $row) {
            DB::table('parameters')
                ->where('id', $row->id)
                ->update([
                    'name' => 'Parameter '.($index + 1),
                ]);
        }

        Schema::table('parameters', function (Blueprint $table) {
            $table->string('name')->nullable(false)->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parameters', function (Blueprint $table) {
            $table->dropUnique(['name']);
            $table->dropColumn('name');
        });
    }
};
