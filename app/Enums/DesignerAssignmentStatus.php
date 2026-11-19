<?php

namespace App\Enums;

enum DesignerAssignmentStatus: string
{
    case Assigned = 'assigned';
    case Designing = 'designing';
    case Revision = 'revision';
    case Submitted = 'submitted';
    case Completed = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::Assigned => 'Assigned',
            self::Designing => 'In Design',
            self::Revision => 'Revision Requested',
            self::Submitted => 'Submitted',
            self::Completed => 'Completed',
        };
    }

    public function tone(): string
    {
        return match ($this) {
            self::Assigned => 'assigned',
            self::Designing => 'in-design',
            self::Revision => 'revision',
            self::Submitted => 'submitted',
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
