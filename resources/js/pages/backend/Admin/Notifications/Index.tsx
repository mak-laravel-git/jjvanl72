import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import type { NotificationCreatedPayload } from '@/realtime/types';
import {
    broadcast,
    destroy,
    index as notificationsIndex,
    markAllRead,
    read,
    show,
    unread,
} from '@/routes/admin/notifications';
import type { SharedData } from '@/types';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

const decodePaginationLabel = (label: string) =>
    label.replace('&laquo;', '«').replace('&raquo;', '»').trim();

type NotificationItem = {
    id: number;
    title: string;
    reference: string | null;
    message: string;
    time: string;
    icon: string;
    icon_bg: string;
    read: boolean;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatorMeta = {
    current_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    last_page?: number;
    links?: PaginationLink[];
};

type Paginator<T> = PaginatorMeta & {
    data: T[];
    links?: PaginationLink[];
    meta?: PaginatorMeta;
};

type Props = {
    notifications: Paginator<NotificationItem>;
    filters: {
        filter?: string | null;
    };
    unreadCount: number;
    canBroadcast: boolean;
};

export default function NotificationsIndex({
    notifications,
    filters,
    unreadCount: initialUnreadCount,
    canBroadcast,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const filter = filters.filter ?? 'all';
    const links = notifications.links ?? notifications.meta?.links ?? [];
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [items, setItems] = useState(notifications.data);

    useEffect(() => {
        setUnreadCount(initialUnreadCount);
        setItems(notifications.data);
    }, [initialUnreadCount, notifications.data]);

    useEffect(() => {
        const onCreated = (event: Event) => {
            const detail = (event as CustomEvent<NotificationCreatedPayload>)
                .detail;

            if (!detail?.id) {
                return;
            }

            setUnreadCount(detail.unread_count);

            if (filter === 'read') {
                return;
            }

            setItems((current) => {
                if (current.some((item) => item.id === detail.id)) {
                    return current;
                }

                const next: NotificationItem = {
                    id: detail.id,
                    title: detail.title ?? 'Notification',
                    reference: detail.reference,
                    message: detail.body ?? '',
                    time: 'Just now',
                    icon: detail.icon ?? 'notif-system.svg',
                    icon_bg: detail.icon_bg ?? '#e0f2fe',
                    read: detail.read,
                };

                return [next, ...current];
            });
        };

        window.addEventListener('app:notification-created', onCreated);

        return () => {
            window.removeEventListener('app:notification-created', onCreated);
        };
    }, [filter]);

    const setFilter = (next: string) => {
        router.get(
            notificationsIndex.url(),
            { filter: next === 'all' ? undefined : next },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AdminLayout>
            <Head title="Notifications" />

            <div className="p-6">
                {flash?.success ? (
                    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                ) : null}

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Notifications
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            {unreadCount} unread
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {unreadCount > 0 ? (
                            <Link
                                href={markAllRead.url()}
                                method="post"
                                as="button"
                                className="text-[13.125px] font-semibold text-[#0260bd]"
                            >
                                Mark all read
                            </Link>
                        ) : null}
                        {canBroadcast ? (
                            <Link
                                href={broadcast.url()}
                                className="inline-flex items-center gap-2 rounded-[9.375px] bg-[#0260bd] px-4 py-2.5 text-[13.125px] font-semibold text-white"
                            >
                                <span className="relative size-3.5 overflow-hidden">
                                    <img
                                        src={asset('notif-broadcast.svg')}
                                        alt=""
                                        className="size-full"
                                    />
                                </span>
                                Broadcast
                            </Link>
                        ) : null}
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    {(
                        [
                            ['all', 'All'],
                            ['unread', 'Unread'],
                            ['read', 'Read'],
                        ] as const
                    ).map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setFilter(value)}
                            className={cn(
                                'rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold',
                                filter === value
                                    ? 'bg-[#0260bd] text-white'
                                    : 'bg-[#f1f5f9] text-[#475569]',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="mt-[22.5px] overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                    {items.length === 0 ? (
                        <p className="px-5 py-10 text-center text-sm text-[#64748b]">
                            No notifications found.
                        </p>
                    ) : (
                        <ul className="divide-y divide-[#e2e8f0]">
                            {items.map((notification) => (
                                <li
                                    key={notification.id}
                                    className={cn(
                                        'relative flex gap-4 px-5 py-4',
                                        !notification.read &&
                                            'bg-[rgba(239,246,255,0.5)]',
                                    )}
                                >
                                    {!notification.read ? (
                                        <span className="absolute top-1/2 right-5 size-[7.5px] -translate-y-1/2 rounded-full bg-[#0260bd]" />
                                    ) : null}

                                    <Link
                                        href={show.url(notification.id)}
                                        className="flex min-w-0 flex-1 gap-4"
                                    >
                                        <div
                                            className="flex size-[33.75px] shrink-0 items-center justify-center rounded-full"
                                            style={{
                                                backgroundColor:
                                                    notification.icon_bg,
                                            }}
                                        >
                                            <span className="relative size-4 overflow-hidden">
                                                <img
                                                    src={asset(
                                                        notification.icon,
                                                    )}
                                                    alt=""
                                                    className="size-full"
                                                />
                                            </span>
                                        </div>

                                        <div className="min-w-0 flex-1 pr-6">
                                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                                <p className="text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                                                    {notification.title}
                                                </p>
                                                {notification.reference ? (
                                                    <span className="font-mono text-[11.25px] font-bold text-[#0260bd]">
                                                        {
                                                            notification.reference
                                                        }
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className="mt-0.5 text-[11.25px] leading-[15px] text-[#475569]">
                                                {notification.message}
                                            </p>
                                            <p className="mt-1 text-[11.25px] leading-[15px] text-[#99a1af]">
                                                {notification.time}
                                            </p>
                                        </div>
                                    </Link>

                                    <div className="flex shrink-0 flex-col items-end justify-center gap-2">
                                        {notification.read ? (
                                            <Link
                                                href={unread.url(
                                                    notification.id,
                                                )}
                                                method="patch"
                                                as="button"
                                                className="text-[11px] font-semibold text-[#64748b]"
                                            >
                                                Mark unread
                                            </Link>
                                        ) : (
                                            <Link
                                                href={read.url(
                                                    notification.id,
                                                )}
                                                method="patch"
                                                as="button"
                                                className="text-[11px] font-semibold text-[#0260bd]"
                                            >
                                                Mark read
                                            </Link>
                                        )}
                                        <Link
                                            href={destroy.url(notification.id)}
                                            method="delete"
                                            as="button"
                                            className="text-[11px] font-semibold text-[#dc2626]"
                                        >
                                            Delete
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {links.length > 3 ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-[#64748b]">
                            Showing {notifications.from ?? 0}–
                            {notifications.to ?? 0} of{' '}
                            {notifications.total ?? 0}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {links.map((link, index) =>
                                link.url ? (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url}
                                        className={cn(
                                            'rounded-md px-3 py-1.5 text-sm',
                                            link.active
                                                ? 'bg-[#0260bd] text-white'
                                                : 'bg-white text-[#334155] ring-1 ring-[#e2e8f0]',
                                        )}
                                        preserveScroll
                                    >
                                        {decodePaginationLabel(link.label)}
                                    </Link>
                                ) : (
                                    <span
                                        key={`${link.label}-${index}`}
                                        className="rounded-md px-3 py-1.5 text-sm text-[#94a3b8]"
                                    >
                                        {decodePaginationLabel(link.label)}
                                    </span>
                                ),
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </AdminLayout>
    );
}
