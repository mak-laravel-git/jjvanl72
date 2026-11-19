<?php

namespace App\Enums;

enum ModelService: string
{
    case None = 'none';
    case Design = 'design';
    case DesignPrint = 'designPrint';

    public function label(): string
    {
        return match ($this) {
            self::None => 'No Model Service',
            self::Design => 'Include Model Design',
            self::DesignPrint => 'Include Model Design & Print',
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
