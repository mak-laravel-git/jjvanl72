import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    CircleCheck,
    Clock,
    Package,
    Truck,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import PortalLayout from '@/layouts/portal-layout';
import { cn } from '@/lib/utils';

type NotificationCategory =
    | 'new-jobs'
    | 'urgent'
    | 'qc'
    | 'shipping'
    | 'delivery';

type NotificationTone = 'info' | 'urgent' | 'default';

type NotificationItem = {
    id: string;
    title: string;
    body: string;
    time: string;
    category: NotificationCategory;
    tone: NotificationTone;
    read: boolean;
};

type FilterKey =
    | 'all'
    | 'unread'
    | 'new-jobs'
    | 'urgent'
    | 'qc'
    | 'shipping'
    | 'delivery';

type Props = {
    unreadCount: number;
    notifications: NotificationItem[];
};

const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'new-jobs', label: 'New Jobs' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'qc', label: 'QC Reminders' },
    { key: 'shipping', label: 'Shipping' },
    { key: 'delivery', label: 'Delivery' },
];

const toneCardClasses: Record<NotificationTone, string> = {
    info: 'border border-[#0260bd] border-l-4 bg-[#fdfdfd] pl-5',
    urgent: 'border border-[#f967a1] border-l-4 bg-[#fdfdfd] pl-5',
    default: 'border border-[#e2e8f0] bg-white p-[17px]',
};

const iconWrapClasses: Record<NotificationCategory, string> = {
    'new-jobs': 'bg-[rgba(2,96,189,0.13)] text-[#0260bd]',
    urgent: 'bg-[rgba(239,68,68,0.13)] text-[#ef4444]',
    qc: 'bg-[rgba(245,158,11,0.13)] text-[#d97706]',
    shipping: 'bg-[rgba(2,96,189,0.13)] text-[#0260bd]',
    delivery: 'bg-[rgba(34,197,94,0.13)] text-[#16a34a]',
};

function NotificationIcon({
    category,
}: {
    category: NotificationCategory;
}): ReactNode {
    if (category === 'urgent') {
        return <AlertTriangle className="size-5" />;
    }

    if (category === 'qc') {
        return <Clock className="size-5" />;
    }

    if (category === 'shipping') {
        return <Truck className="size-5" />;
    }

    if (category === 'delivery') {
        return <CircleCheck className="size-5" />;
    }

    if (category === 'new-jobs') {
        return <Bell className="size-5" />;
    }

    return <Package className="size-5" />;
}

export default function ManufacturerNotifications({
    unreadCount: initialUnreadCount,
    notifications: initialNotifications,
}: Props) {
    const [filter, setFilter] = useState<FilterKey>('all');
    const [notifications] = useState(initialNotifications);

    const unreadCount = notifications.filter((item) => !item.read).length;

    const visibleNotifications = useMemo(() => {
        return notifications.filter((item) => {
            if (filter === 'all') {
                return true;
            }

            if (filter === 'unread') {
                return !item.read;
            }

            return item.category === filter;
        });
    }, [filter, notifications]);

    return (
        <PortalLayout notificationCount={unreadCount || initialUnreadCount}>
            <Head title="Notifications" />

            <div className="p-6 font-inter">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                            Notifications
                        </h1>
                        <p className="pt-1 text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                            Stay updated with job assignments and reminders
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {filters.map((item) => {
                            const isActive = filter === item.key;

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setFilter(item.key)}
                                    className={cn(
                                        'rounded-[10px] border px-[17px] py-[9px] text-sm leading-5 tracking-[-0.16px]',
                                        isActive
                                            ? 'border-[#0260bd] bg-[#0260bd] font-medium text-white'
                                            : 'border-[#e2e8f0] bg-white text-[#050315] hover:border-[#0260bd]/40',
                                    )}
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-col gap-3">
                        {visibleNotifications.map((notification) => (
                            <article
                                key={notification.id}
                                className={cn(
                                    'rounded-[10px]',
                                    toneCardClasses[notification.tone],
                                    notification.tone !== 'default' &&
                                        'py-[17px] pr-[17px]',
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={cn(
                                            'rounded-[10px] p-3',
                                            iconWrapClasses[
                                                notification.category
                                            ],
                                        )}
                                    >
                                        <NotificationIcon
                                            category={notification.category}
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <h3 className="text-lg leading-[27px] font-medium text-[#050315]">
                                                    {notification.title}
                                                </h3>
                                                <p className="pt-1 text-sm leading-5 text-[#475569]">
                                                    {notification.body}
                                                </p>
                                            </div>

                                            {!notification.read ? (
                                                <span className="mt-2 size-2 shrink-0 rounded-full bg-[#0260bd]" />
                                            ) : null}
                                        </div>

                                        <p className="pt-2 text-xs leading-4 text-[#f967a1]">
                                            {notification.time}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        ))}

                        {visibleNotifications.length === 0 ? (
                            <div className="rounded-[10px] border border-[#e2e8f0] bg-white px-6 py-12 text-center text-sm text-[#475569]">
                                No notifications in this filter.
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
