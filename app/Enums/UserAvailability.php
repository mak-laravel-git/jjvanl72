<?php

namespace App\Enums;

enum UserAvailability: string
{
    case Available = 'available';
    case Busy = 'busy';
    case Away = 'away';

    public function label(): string
    {
        return match ($this) {
            self::Available => 'available',
            self::Busy => 'busy',
            self::Away => 'away',
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
