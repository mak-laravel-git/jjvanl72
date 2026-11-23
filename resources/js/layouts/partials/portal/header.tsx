import { usePage } from '@inertiajs/react';

import { DashboardHeader } from '@/layouts/partials/dashboard/header';
import {
    getNotificationHref,
    getPortalView,
    portalAsset,
} from '@/lib/portal-role';
import { show as twoFactorShow } from '@/routes/two-factor';
import { edit as userProfileEdit } from '@/routes/user-profile';
import type { SharedData } from '@/types';

type PortalHeaderProps = {
    notificationCount?: number;
};

export function PortalHeader({ notificationCount = 4 }: PortalHeaderProps) {
    const { auth, features } = usePage<SharedData>().props;
    const view = getPortalView(auth.user);
    const notificationHref = getNotificationHref(auth.user);
    const organization = auth.user?.business_name || view.organization;

    return (
        <DashboardHeader
            organization={organization}
            bellIcon={portalAsset('icon-bell.svg')}
            notificationCount={notificationCount}
            notificationHref={notificationHref}
            profileHref={userProfileEdit.url()}
            twoFactorHref={
                features?.canUseTwoFactorAuthentication
                    ? twoFactorShow.url()
                    : null
            }
        />
    );
}
