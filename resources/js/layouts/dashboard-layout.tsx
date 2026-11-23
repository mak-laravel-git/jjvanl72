import type { CSSProperties, ReactNode } from 'react';

import { RegisterWebPush } from '@/components/register-web-push';
import { MobileSidebarProvider } from '@/layouts/partials/dashboard/mobile-sidebar-context';

interface DashboardLayoutProps {
    sidebar?: ReactNode;
    header?: ReactNode;
    children: ReactNode;
    /** Width of the fixed sidebar, shared with the header and content offsets. */
    sidebarWidth?: string;
    background?: string;
    /** When false, render children full-viewport with no sidebar/header chrome. */
    chrome?: boolean;
}

export default function DashboardLayout({
    sidebar,
    header,
    children,
    sidebarWidth = '256px',
    background = '#fdfdfd',
    chrome = true,
}: DashboardLayoutProps) {
    if (!chrome) {
        return (
            <div
                className="min-h-screen font-jakarta"
                style={{ backgroundColor: background } as CSSProperties}
            >
                <RegisterWebPush />
                {children}
            </div>
        );
    }

    return (
        <MobileSidebarProvider>
            <div
                className="min-h-screen font-jakarta"
                style={
                    {
                        '--dashboard-sidebar-width': sidebarWidth,
                        backgroundColor: background,
                    } as CSSProperties
                }
            >
                <RegisterWebPush />
                {sidebar}
                <div className="flex min-h-screen min-w-0 flex-col md:pl-(--dashboard-sidebar-width)">
                    {header}
                    <main className="flex-1 pt-14 sm:pt-16">{children}</main>
                </div>
            </div>
        </MobileSidebarProvider>
    );
}
