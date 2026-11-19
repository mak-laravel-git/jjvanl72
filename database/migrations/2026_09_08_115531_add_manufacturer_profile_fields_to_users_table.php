<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('company_name')->nullable()->after('location');
            $table->string('business_registration')->nullable()->after('company_name');
            $table->unsignedSmallInteger('production_capacity')->nullable()->after('business_registration');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'company_name',
                'business_registration',
                'production_capacity',
            ]);
        });
    }
};
