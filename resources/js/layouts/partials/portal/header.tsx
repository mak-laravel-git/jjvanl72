import { usePage } from '@inertiajs/react';

import { DashboardHeader } from '@/layouts/partials/dashboard/header';
import {
    getNotificationHref,
    getPortalView,
    portalAsset,
} from '@/lib/portal-role';
import type { SharedData } from '@/types';

type PortalHeaderProps = {
    notificationCount?: number;
};

export function PortalHeader({ notificationCount = 4 }: PortalHeaderProps) {
    const { auth } = usePage<SharedData>().props;
    const view = getPortalView(auth.user);
    const notificationHref = getNotificationHref(auth.user);

    return (
        <DashboardHeader
            organization={view.organization}
            bellIcon={portalAsset('icon-bell.svg')}
            notificationCount={notificationCount}
            notificationHref={notificationHref}
        />
    );
}
