import * as React from 'react';
import { useEffect } from 'react';

import DashboardLayout from '@/layouts/dashboard-layout';
import { AdminHeader } from '@/layouts/partials/admin/header';
import { AdminSidebar } from '@/layouts/partials/admin/sidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
            sidebarWidth="280px"
            sidebar={<AdminSidebar />}
            header={<AdminHeader />}
            background="#ffffff"
        >
            <div className="min-h-full bg-white text-[#050315]">{children}</div>
        </DashboardLayout>
    );
}
