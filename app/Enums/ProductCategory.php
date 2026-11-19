<?php

namespace App\Enums;

enum ProductCategory: string
{
    case Fixed = 'Fixed';
    case Removable = 'Removable';

    public function tone(): string
    {
        return match ($this) {
            self::Fixed => 'fixed',
            self::Removable => 'removable',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
