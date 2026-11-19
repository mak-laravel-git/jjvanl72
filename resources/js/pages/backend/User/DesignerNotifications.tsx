import { Head } from '@inertiajs/react';
import { useState } from 'react';

import PortalLayout from '@/layouts/portal-layout';
import { portalAsset } from '@/lib/portal-role';
import { cn } from '@/lib/utils';

type NotificationItem = {
    id: string;
    title: string;
    body: string;
    time: string;
    icon: string;
    read: boolean;
};

type Props = {
    unreadCount: number;
    notifications: NotificationItem[];
};

export default function DesignerNotifications({
    unreadCount: initialUnreadCount,
    notifications: initialNotifications,
}: Props) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const unreadCount = notifications.filter((item) => !item.read).length;

    const markAllRead = () => {
        setNotifications((items) =>
            items.map((item) => ({ ...item, read: true })),
        );
    };

    return (
        <PortalLayout notificationCount={unreadCount || initialUnreadCount}>
            <Head title="Notifications" />

            <div className="p-6 font-inter">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                            Notifications
                        </h1>
                        <p className="pt-0.5 text-xs leading-4 font-medium tracking-[-0.12px] text-[#475569]">
                            {unreadCount} unread
                        </p>
                    </div>

                    {unreadCount > 0 ? (
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="text-xs leading-4 font-medium tracking-[-0.12px] text-[#0260bd] transition-opacity hover:opacity-80"
                        >
                            Mark all as read
                        </button>
                    ) : null}
                </div>

                <div className="pt-4">
                    <div className="overflow-clip rounded border border-[#e2e8f0] bg-white p-px">
                        {notifications.map((notification, index) => {
                            const isLast = index === notifications.length - 1;

                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'flex items-start gap-4 px-5 pt-4 pb-[17px]',
                                        !notification.read &&
                                            'bg-[rgba(239,246,255,0.3)]',
                                        !isLast && 'border-b border-[#e2e8f0]',
                                    )}
                                >
                                    <div className="flex h-[18px] w-4 shrink-0 flex-col items-start pt-0.5">
                                        <div className="relative size-4 shrink-0">
                                            <img
                                                alt=""
                                                className="absolute inset-0 block size-full max-w-none"
                                                src={portalAsset(
                                                    notification.icon,
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm leading-5 font-semibold tracking-[-0.16px] text-[#050315]">
                                                {notification.title}
                                            </p>
                                            {!notification.read ? (
                                                <span className="size-1.5 shrink-0 rounded-full bg-[#f967a1]" />
                                            ) : null}
                                        </div>

                                        <p className="pt-0.5 text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                                            {notification.body}
                                        </p>

                                        <p className="pt-1 text-[10px] leading-3 font-medium text-[#f967a1]">
                                            {notification.time}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {notifications.length === 0 && (
                            <div className="px-5 py-12 text-center text-sm text-[#475569]">
                                No notifications yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
