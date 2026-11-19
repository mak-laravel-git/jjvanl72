<?php

namespace App\Enums;

enum NotificationType: string
{
    case System = 'system';
    case Case = 'case';
    case Assignment = 'assignment';
    case Payment = 'payment';
    case User = 'user';
    case Broadcast = 'broadcast';
    case Revision = 'revision';
    case Delay = 'delay';

    public function label(): string
    {
        return match ($this) {
            self::System => 'System',
            self::Case => 'Case',
            self::Assignment => 'Assignment',
            self::Payment => 'Payment',
            self::User => 'User',
            self::Broadcast => 'Broadcast',
            self::Revision => 'Revision',
            self::Delay => 'Delay',
        };
    }

    public function defaultIcon(): string
    {
        return match ($this) {
            self::Case => 'notif-case.svg',
            self::Assignment => 'notif-assign.svg',
            self::Payment => 'notif-payment.svg',
            self::User => 'notif-user.svg',
            self::Broadcast => 'notif-broadcast.svg',
            self::Revision => 'notif-revision.svg',
            self::Delay => 'notif-delay.svg',
            self::System => 'notif-case.svg',
        };
    }

    public function defaultIconBg(): string
    {
        return match ($this) {
            self::Case, self::User, self::System => '#dbeafe',
            self::Assignment => '#f3e8ff',
            self::Payment => '#fee2e2',
            self::Revision => '#fce7f3',
            self::Delay => '#ffedd5',
            self::Broadcast => '#e0f2fe',
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
