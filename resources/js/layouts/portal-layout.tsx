import { usePage } from '@inertiajs/react';
import { useEffect, type ReactNode } from 'react';

import DashboardLayout from '@/layouts/dashboard-layout';
import { PortalHeader } from '@/layouts/partials/portal/header';
import { PortalSidebar } from '@/layouts/partials/portal/sidebar';
import { getPortalView } from '@/lib/portal-role';
import type { SharedData } from '@/types';

interface PortalLayoutProps {
    children: ReactNode;
    notificationCount?: number;
    /** When false, hide portal sidebar/header for immersive pages (e.g. create case). */
    chrome?: boolean;
}

export default function PortalLayout({
    children,
    notificationCount,
    chrome = true,
}: PortalLayoutProps) {
    const { auth } = usePage<SharedData>().props;
    const view = getPortalView(auth.user);

    useEffect(() => {
        const root = document.documentElement;
        const wasDark = root.classList.contains('dark');
        const previousColorScheme = root.style.colorScheme;

        root.classList.remove('dark');
        root.style.colorScheme = 'light';

        return () => {
            if (wasDark) {
                root.classList.add('dark');
            }

            root.style.colorScheme = previousColorScheme;
        };
    }, []);

    return (
        <DashboardLayout
            chrome={chrome}
            sidebarWidth="256px"
            background={
                chrome
                    ? view.layout === 'designer' || view.layout === 'manufacturer'
                        ? '#fdfdfd'
                        : '#f8fafc'
                    : '#f6f7fb'
            }
            sidebar={chrome ? <PortalSidebar /> : undefined}
            header={
                chrome ? (
                    <PortalHeader notificationCount={notificationCount} />
                ) : undefined
            }
        >
            <div className="min-h-full text-[#050315]">{children}</div>
        </DashboardLayout>
    );
}
