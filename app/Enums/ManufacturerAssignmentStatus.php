<?php

namespace App\Enums;

enum ManufacturerAssignmentStatus: string
{
    case Assigned = 'assigned';
    case Manufacturing = 'manufacturing';
    case QualityCheck = 'quality_check';
    case ReadyToShip = 'ready_to_ship';
    case Shipped = 'shipped';
    case Completed = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::Assigned => 'Assigned',
            self::Manufacturing => 'In Production',
            self::QualityCheck => 'Quality Check',
            self::ReadyToShip => 'Ready To Ship',
            self::Shipped => 'Shipped',
            self::Completed => 'Completed',
        };
    }

    public function tone(): string
    {
        return match ($this) {
            self::Assigned => 'assigned',
            self::Manufacturing => 'accepted',
            self::QualityCheck => 'quality-check',
            self::ReadyToShip => 'ready-to-ship',
            self::Shipped => 'shipped',
            self::Completed => 'completed',
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
