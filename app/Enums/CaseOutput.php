<?php

namespace App\Enums;

enum CaseOutput: string
{
    case Appliance = 'appliance';
    case ApplianceModels = 'applianceModels';

    public function label(): string
    {
        return match ($this) {
            self::Appliance => 'Appliance Only',
            self::ApplianceModels => 'Appliance and Models',
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
