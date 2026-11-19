<?php

namespace App\Enums;

enum InvoiceStatus: string
{
    case Paid = 'Paid';
    case Pending = 'Pending';
    case Overdue = 'Overdue';

    public function tone(): string
    {
        return match ($this) {
            self::Paid => 'paid',
            self::Pending => 'pending',
            self::Overdue => 'overdue',
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
