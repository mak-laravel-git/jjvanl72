<?php

namespace App\Enums;

use App\Support\AppPermissions;

enum DentalCaseAssignmentRole: string
{
    case Designer = 'Designer';
    case Manufacturer = 'Manufacturer';

    public function label(): string
    {
        return $this->value;
    }

    public function permissionRole(): string
    {
        return match ($this) {
            self::Designer => AppPermissions::DESIGNER_ROLE,
            self::Manufacturer => AppPermissions::MANUFACTURER_ROLE,
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public static function tryFromRoleName(string $role): ?self
    {
        return self::tryFrom($role);
    }
}
