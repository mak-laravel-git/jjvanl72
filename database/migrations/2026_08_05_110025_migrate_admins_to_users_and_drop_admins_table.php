<?php

use App\Models\User;
use App\Support\AppPermissions;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('admins')) {
            return;
        }

        $adminModel = 'App\\Models\\Admin';
        $userModel = User::class;

        $admins = DB::table('admins')->get();

        foreach ($admins as $admin) {
            $existingUser = DB::table('users')->where('email', $admin->email)->first();

            if ($existingUser) {
                $userId = $existingUser->id;
            } else {
                $userId = DB::table('users')->insertGetId([
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'password' => $admin->password,
                    'email_verified_at' => $admin->email_verified_at ?? now(),
                    'remember_token' => $admin->remember_token,
                    'created_at' => $admin->created_at ?? now(),
                    'updated_at' => $admin->updated_at ?? now(),
                ]);
            }

            $adminRoleNames = DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_type', $adminModel)
                ->where('model_has_roles.model_id', $admin->id)
                ->pluck('roles.name')
                ->all();

            DB::table('model_has_roles')
                ->where('model_type', $adminModel)
                ->where('model_id', $admin->id)
                ->delete();

            DB::table('model_has_permissions')
                ->where('model_type', $adminModel)
                ->where('model_id', $admin->id)
                ->delete();

            if (in_array(AppPermissions::SUPER_ADMIN_ROLE, $adminRoleNames, true)) {
                $superAdminRoleId = DB::table('roles')
                    ->where('name', AppPermissions::SUPER_ADMIN_ROLE)
                    ->where('guard_name', AppPermissions::GUARD)
                    ->value('id');

                if ($superAdminRoleId) {
                    DB::table('model_has_roles')->updateOrInsert(
                        [
                            'role_id' => $superAdminRoleId,
                            'model_type' => $userModel,
                            'model_id' => $userId,
                        ],
                        [],
                    );
                }
            }
        }

        DB::table('role_has_permissions')
            ->whereIn('role_id', DB::table('roles')->where('guard_name', 'admin')->pluck('id'))
            ->delete();

        DB::table('model_has_roles')
            ->whereIn('role_id', DB::table('roles')->where('guard_name', 'admin')->pluck('id'))
            ->delete();

        DB::table('roles')->where('guard_name', 'admin')->delete();
        DB::table('permissions')->where('guard_name', 'admin')->delete();

        Schema::drop('admins');

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('admins')) {
            return;
        }

        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
    }
};
