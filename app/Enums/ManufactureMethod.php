<?php

namespace App\Enums;

enum ManufactureMethod: string
{
    case Mill = 'mill';
    case Print = 'print';

    public function label(): string
    {
        return match ($this) {
            self::Mill => 'Mill the Design',
            self::Print => 'Print the Design',
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
