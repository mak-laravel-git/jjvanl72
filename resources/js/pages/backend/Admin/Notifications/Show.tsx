import { Head, Link } from '@inertiajs/react';

import AdminLayout from '@/layouts/admin-layout';
import {
    destroy,
    index as notificationsIndex,
    unread,
} from '@/routes/admin/notifications';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

type NotificationItem = {
    id: number;
    title: string;
    reference: string | null;
    body: string;
    type_label?: string | null;
    time: string;
    icon: string;
    icon_bg: string;
    read: boolean;
    created_at?: string | null;
};

type Props = {
    notification: NotificationItem;
    canBroadcast: boolean;
};

export default function NotificationShow({ notification }: Props) {
    return (
        <AdminLayout>
            <Head title={notification.title} />

            <div className="p-6">
                <Link
                    href={notificationsIndex.url()}
                    className="text-[13.125px] font-semibold text-[#0260bd]"
                >
                    ← Back to notifications
                </Link>

                <div className="mt-5 overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex gap-4">
                            <div
                                className="flex size-12 shrink-0 items-center justify-center rounded-full"
                                style={{
                                    backgroundColor: notification.icon_bg,
                                }}
                            >
                                <img
                                    src={asset(notification.icon)}
                                    alt=""
                                    className="size-5"
                                />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                    <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                                        {notification.title}
                                    </h1>
                                    {notification.reference ? (
                                        <span className="font-mono text-sm font-bold text-[#0260bd]">
                                            {notification.reference}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-1 text-sm text-[#64748b]">
                                    {notification.type_label
                                        ? `${notification.type_label} · `
                                        : ''}
                                    {notification.time}
                                    {notification.read ? ' · Read' : ' · Unread'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {notification.read ? (
                                <Link
                                    href={unread.url(notification.id)}
                                    method="patch"
                                    as="button"
                                    className="rounded-[9.375px] border border-[#e2e8f0] px-4 py-2 text-[13.125px] font-semibold text-[#475569]"
                                >
                                    Mark unread
                                </Link>
                            ) : null}
                            <Link
                                href={destroy.url(notification.id)}
                                method="delete"
                                as="button"
                                className="rounded-[9.375px] bg-[#dc2626] px-4 py-2 text-[13.125px] font-semibold text-white"
                            >
                                Delete
                            </Link>
                        </div>
                    </div>

                    <p className="mt-6 text-[15px] leading-7 whitespace-pre-wrap text-[#334155]">
                        {notification.body}
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
