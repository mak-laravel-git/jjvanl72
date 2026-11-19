import { usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';

import { AdminNotificationsDialog } from '@/components/admin-notifications-dialog';
import { useNotificationsRealtime } from '@/hooks/use-notifications-realtime';
import { DashboardHeader } from '@/layouts/partials/dashboard/header';
import type { NotificationCreatedPayload } from '@/realtime/types';
import { edit as adminProfileEdit } from '@/routes/admin/profile';
import { show as twoFactorShow } from '@/routes/two-factor';
import { type SharedData } from '@/types';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

export function AdminHeader() {
    const { auth, unreadNotificationsCount, features } =
        usePage<SharedData>().props;
    const user = auth.user;
    const [liveUnreadCount, setLiveUnreadCount] = useState<number | null>(null);
    const unreadCount = liveUnreadCount ?? unreadNotificationsCount ?? 0;

    const onNotification = useCallback((payload: NotificationCreatedPayload) => {
        setLiveUnreadCount(payload.unread_count);
        window.dispatchEvent(
            new CustomEvent<NotificationCreatedPayload>(
                'app:notification-created',
                { detail: payload },
            ),
        );
    }, []);

    useNotificationsRealtime({
        userId: user?.id,
        enabled: Boolean(user?.can_access_admin_panel || user?.is_super_admin),
        onNotification,
    });

    if (!user?.can_access_admin_panel && !user?.is_super_admin) {
        return null;
    }

    return (
        <DashboardHeader
            organization={user.role_label ?? 'DDS Admin'}
            bellIcon={asset('icon-bell.svg')}
            notificationCount={unreadCount}
            profileHref={adminProfileEdit.url()}
            twoFactorHref={
                features?.canUseTwoFactorAuthentication
                    ? twoFactorShow.url()
                    : null
            }
            notificationSlot={
                <AdminNotificationsDialog
                    bellIcon={asset('icon-bell.svg')}
                    unreadCount={unreadCount}
                />
            }
        />
    );
}
