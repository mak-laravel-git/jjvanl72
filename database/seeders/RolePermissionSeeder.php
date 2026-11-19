<?php

namespace Database\Seeders;

use App\Support\AppPermissions;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Role::query()->where('guard_name', '!=', AppPermissions::GUARD)->delete();
        Permission::query()->where('guard_name', '!=', AppPermissions::GUARD)->delete();

        Role::query()
            ->where('guard_name', AppPermissions::GUARD)
            ->whereNotIn('name', AppPermissions::roles())
            ->whereIn('name', ['Operations', 'Finance', 'Support'])
            ->delete();

        foreach (AppPermissions::grouped() as $group => $permissions) {
            foreach ($permissions as $permission) {
                Permission::query()->updateOrCreate(
                    [
                        'name' => $permission,
                        'guard_name' => AppPermissions::GUARD,
                    ],
                    ['group' => $group],
                );
            }
        }

        foreach (AppPermissions::rolePermissionMap() as $roleName => $permissions) {
            $role = Role::findOrCreate($roleName, AppPermissions::GUARD);
            $role->syncPermissions($permissions);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
