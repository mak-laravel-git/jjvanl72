<?php

use App\Enums\UserAvailability;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('availability', 20)
                ->default(UserAvailability::Available->value)
                ->after('status');
            $table->json('notification_preferences')
                ->nullable()
                ->after('availability');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['availability', 'notification_preferences']);
        });
    }
};
