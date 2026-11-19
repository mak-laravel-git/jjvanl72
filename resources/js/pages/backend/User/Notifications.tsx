import { Head, Link } from '@inertiajs/react';
import { CheckCheck } from 'lucide-react';
import { useState } from 'react';

import PortalLayout from '@/layouts/portal-layout';
import { portalAsset } from '@/lib/portal-role';
import { cn } from '@/lib/utils';

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    meta: string;
    read: boolean;
    view_url: string;
};

type Props = {
    unreadCount: number;
    notifications: NotificationItem[];
};

export default function Notifications({
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

    const markRead = (id: string) => {
        setNotifications((items) =>
            items.map((item) =>
                item.id === id ? { ...item, read: true } : item,
            ),
        );
    };

    return (
        <PortalLayout notificationCount={unreadCount || initialUnreadCount}>
            <Head title="Notifications" />

            <div className="p-8">
                <div className="flex items-center justify-between pb-[24px]">
                    <h1 className="font-inter text-[24px] leading-[30px] font-semibold tracking-[-0.15px] text-[#050315]">
                        Notifications
                    </h1>

                    {unreadCount > 0 ? (
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="inline-flex items-center gap-[8px] rounded-[8px] px-[4px] py-[2px] font-inter text-[14px] leading-[20px] font-medium tracking-[-0.16px] text-[#475569] transition-colors hover:text-[#050315]"
                        >
                            <CheckCheck className="size-[16px] shrink-0" />
                            Mark All Read
                        </button>
                    ) : null}
                </div>

                <div className="relative w-full overflow-clip rounded-[8px] border border-[#e2e8f0] p-px">
                    <div className="flex w-full flex-col">
                        {notifications.map((notification, index) => {
                            const isLast = index === notifications.length - 1;

                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'flex w-full items-center justify-between bg-white px-[16px] pt-[16px] pb-[17px]',
                                        !isLast && 'border-b border-[#f1f5f9]',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex min-w-0 items-center gap-[16px]',
                                            notification.read && 'opacity-75',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'flex size-[40px] shrink-0 items-center justify-center rounded-full bg-[#e2e8f0]',
                                                notification.read &&
                                                    'bg-[#f8fafc]',
                                            )}
                                        >
                                            <div className="relative size-[20px] shrink-0">
                                                <img
                                                    alt=""
                                                    className="absolute inset-0 block size-full max-w-none"
                                                    src={portalAsset(
                                                        'icon-bell.svg',
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        <div className="relative flex w-full shrink-0 flex-col content-stretch items-start gap-[2px]">
                                            <div className="flex w-full flex-wrap items-center gap-[8px]">
                                                <div className="flex flex-col items-start">
                                                    <p
                                                        className={cn(
                                                            'font-inter text-[14px] leading-[20px] font-semibold tracking-[-0.16px] whitespace-nowrap',
                                                            notification.read
                                                                ? 'text-[#475569]'
                                                                : 'text-[#050315]',
                                                        )}
                                                    >
                                                        {notification.title}
                                                    </p>
                                                </div>

                                                {!notification.read ? (
                                                    <div className="relative flex shrink-0 flex-col items-start rounded-[4px] bg-[#e2e8f0] px-[6px] py-[2px]">
                                                        <div className="font-inter text-[10px] leading-[15px] font-bold tracking-[0.5px] whitespace-nowrap text-[#0260bd] uppercase">
                                                            NEW
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <p className="font-inter text-[14px] leading-[20px] font-normal tracking-[-0.16px] whitespace-nowrap text-[#475569]">
                                                {notification.message}
                                            </p>

                                            <p className="pt-[2px] font-inter text-[12px] leading-[16px] font-normal tracking-[-0.12px] whitespace-nowrap text-[#f967a1]">
                                                {notification.meta}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-[24px]">
                                        <Link
                                            href={notification.view_url}
                                            className="flex shrink-0 flex-col items-center justify-center"
                                        >
                                            <span className="text-center font-inter text-[16px] leading-[22px] font-medium tracking-[-0.18px] whitespace-nowrap text-[#050315]">
                                                View
                                            </span>
                                        </Link>

                                        {!notification.read ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    markRead(notification.id)
                                                }
                                                className="flex items-center justify-center"
                                                aria-label={`Mark ${notification.title} as read`}
                                            >
                                                <div className="relative size-[20px] shrink-0">
                                                    <img
                                                        alt=""
                                                        className="absolute inset-0 block size-full max-w-none"
                                                        src={portalAsset(
                                                            'mfg-timeline-check.svg',
                                                        )}
                                                    />
                                                </div>
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
