<?php

namespace App\Enums;

enum ParameterType: string
{
    case Option = 'option';
    case MultiOption = 'multi_option';
    case Input = 'input';

    public function label(): string
    {
        return match ($this) {
            self::Option => 'Option',
            self::MultiOption => 'Multi option',
            self::Input => 'Input',
        };
    }

    public function hasSelectableOptions(): bool
    {
        return $this === self::Option || $this === self::MultiOption;
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
