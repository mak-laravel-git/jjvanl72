<?php

namespace App\Support;

use App\Models\User;

final class SuperAdmin
{
    public static function role(): string
    {
        return AppPermissions::SUPER_ADMIN_ROLE;
    }

    public static function count(): int
    {
        return User::role(self::role(), AppPermissions::GUARD)->count();
    }

    public static function isLast(User $user): bool
    {
        return $user->isSuperAdmin() && self::count() <= 1;
    }

    /**
     * @param  array<int, string>  $roles
     */
    public static function isGrantedBy(array $roles): bool
    {
        return in_array(self::role(), $roles, true);
    }
}
