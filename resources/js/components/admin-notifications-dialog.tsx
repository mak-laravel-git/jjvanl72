import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { NotificationCreatedPayload } from '@/realtime/types';
import {
    index as notificationsIndex,
    recent as notificationsRecent,
    show as notificationsShow,
} from '@/routes/admin/notifications';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

type RecentNotification = {
    id: number;
    title: string;
    message: string;
    reference: string | null;
    icon: string;
    icon_bg: string;
    read: boolean;
    time: string;
};

type Props = {
    bellIcon: string;
    unreadCount: number;
};

function formatRelativeTime(iso: string | null): string {
    if (!iso) {
        return 'Just now';
    }

    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.max(0, Math.floor(diffMs / 60_000));

    if (minutes < 1) {
        return 'Just now';
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    return `${Math.floor(hours / 24)}d ago`;
}

export function AdminNotificationsDialog({ bellIcon, unreadCount }: Props) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<RecentNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(unreadCount);

    useEffect(() => {
        setCount(unreadCount);
    }, [unreadCount]);

    useEffect(() => {
        const onCreated = (event: Event) => {
            const detail = (event as CustomEvent<NotificationCreatedPayload>)
                .detail;

            if (!detail?.id) {
                return;
            }

            setCount(detail.unread_count);

            setItems((current) => {
                if (current.some((item) => item.id === detail.id)) {
                    return current;
                }

                const next: RecentNotification = {
                    id: detail.id,
                    title: detail.title ?? 'Notification',
                    message: detail.body ?? '',
                    reference: detail.reference,
                    icon: detail.icon ?? 'notif-system.svg',
                    icon_bg: detail.icon_bg ?? '#e0f2fe',
                    read: detail.read,
                    time: formatRelativeTime(detail.created_at),
                };

                return [next, ...current].slice(0, 20);
            });
        };

        window.addEventListener('app:notification-created', onCreated);

        return () => {
            window.removeEventListener('app:notification-created', onCreated);
        };
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;
        setLoading(true);

        fetch(notificationsRecent.url(), {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Failed to load notifications');
                }

                return response.json() as Promise<{
                    notifications: RecentNotification[];
                    unread_count: number;
                }>;
            })
            .then((data) => {
                if (cancelled) {
                    return;
                }

                setItems(data.notifications);
                setCount(data.unread_count);
            })
            .catch(() => {
                if (!cancelled) {
                    setItems([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="relative rounded-lg p-2 transition-colors hover:bg-slate-50"
                    aria-label="Notifications"
                >
                    <span className="relative block size-6 overflow-hidden">
                        <img src={bellIcon} alt="" className="size-full" />
                    </span>
                    {count > 0 ? (
                        <span className="absolute top-1 right-1 flex rounded-full bg-[#f967a1] px-1">
                            <span className="font-inter text-[10px] leading-[15px] text-white">
                                {count > 99 ? '99+' : count}
                            </span>
                        </span>
                    ) : null}
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-[360px] p-0"
                sideOffset={8}
            >
                <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
                    <div>
                        <p className="text-sm font-semibold text-[#050315]">
                            Notifications
                        </p>
                        <p className="text-xs text-[#475569]">
                            {count} unread
                        </p>
                    </div>
                    <Link
                        href={notificationsIndex.url()}
                        className="text-xs font-semibold text-[#0260bd]"
                        onClick={() => setOpen(false)}
                    >
                        View all
                    </Link>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                    {loading ? (
                        <p className="px-4 py-6 text-center text-sm text-[#64748b]">
                            Loading…
                        </p>
                    ) : items.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-[#64748b]">
                            No notifications yet.
                        </p>
                    ) : (
                        <ul className="divide-y divide-[#e2e8f0]">
                            {items.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        className={cn(
                                            'flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50',
                                            !item.read &&
                                                'bg-[rgba(239,246,255,0.5)]',
                                        )}
                                        onClick={() => {
                                            setOpen(false);
                                            router.visit(
                                                notificationsShow.url(item.id),
                                            );
                                        }}
                                    >
                                        <div
                                            className="flex size-8 shrink-0 items-center justify-center rounded-full"
                                            style={{
                                                backgroundColor: item.icon_bg,
                                            }}
                                        >
                                            <img
                                                src={asset(item.icon)}
                                                alt=""
                                                className="size-4"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[#050315]">
                                                {item.title}
                                            </p>
                                            <p className="mt-0.5 line-clamp-2 text-xs text-[#475569]">
                                                {item.message}
                                            </p>
                                            <p className="mt-1 text-[11px] text-[#99a1af]">
                                                {item.time}
                                            </p>
                                        </div>
                                        {!item.read ? (
                                            <span className="mt-2 size-2 shrink-0 rounded-full bg-[#0260bd]" />
                                        ) : null}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
