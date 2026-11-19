<?php

namespace App\Enums;

enum DentalCaseStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case Designing = 'designing';
    case AwaitingApproval = 'awaiting_approval';
    case Approved = 'approved';
    case Manufacturing = 'manufacturing';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Submitted => 'Submitted',
            self::Designing => 'Designing',
            self::AwaitingApproval => 'Awaiting Approval',
            self::Approved => 'Approved',
            self::Manufacturing => 'Manufacturing',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
        };
    }

    public function tone(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::Submitted => 'blue',
            self::Designing, self::AwaitingApproval => 'purple',
            self::Approved => 'sky',
            self::Manufacturing => 'orange',
            self::Completed => 'green',
            self::Cancelled => 'red',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return list<self>
     */
    public static function activeCases(): array
    {
        return [
            self::Submitted,
            self::Designing,
            self::AwaitingApproval,
            self::Approved,
            self::Manufacturing,
        ];
    }
}
