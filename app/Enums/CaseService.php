<?php

namespace App\Enums;

enum CaseService: string
{
    case Design = 'design';
    case Approve = 'approve';
    case Manufacture = 'manufacture';

    public function label(): string
    {
        return match ($this) {
            self::Design => 'Design Only',
            self::Approve => 'Design & Approve',
            self::Manufacture => 'Design, Approve & Manufacture',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function requiresManufactureOptions(): bool
    {
        return $this === self::Manufacture;
    }
}
