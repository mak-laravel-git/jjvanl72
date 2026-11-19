import { usePage } from '@inertiajs/react';

import {
    DashboardSidebar,
    type DashboardNavItem,
} from '@/layouts/partials/dashboard/sidebar';
import { getPortalView, portalAsset } from '@/lib/portal-role';
import type { SharedData } from '@/types';

export function PortalSidebar() {
    const { auth } = usePage<SharedData>().props;
    const view = getPortalView(auth.user);

    const items: DashboardNavItem[] = view.nav.map((item) => ({
        title: item.title,
        icon: item.icon,
        href: item.href,
        match: item.match,
        permission: item.permission,
        openInNewTab: item.openInNewTab,
    }));

    return (
        <DashboardSidebar
            logoutIcon={portalAsset('nav-logout.svg')}
            items={items}
            density="comfortable"
        />
    );
}
