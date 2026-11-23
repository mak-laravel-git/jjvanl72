import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

import PortalLayout from '@/layouts/portal-layout';

type PortalPageShellProps = {
    title: string;
    children: ReactNode;
    createHref?: string;
    subtitle?: string;
    openCreateInNewTab?: boolean;
};

export function PortalPageShell({
    title,
    children,
    createHref,
    subtitle,
    openCreateInNewTab = false,
}: PortalPageShellProps) {
    return (
        <PortalLayout>
            <Head title={title} />

            <div className="p-8 font-inter">
                <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-base leading-[22px] tracking-[-0.18px] text-[#475569]">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {createHref && (
                            <Link
                                href={createHref}
                                {...(openCreateInNewTab
                                    ? {
                                          target: '_blank',
                                          rel: 'noopener noreferrer',
                                      }
                                    : {})}
                                className="flex items-center gap-2 rounded-lg bg-[#0260bd] px-6 py-3 shadow-[0px_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#024f9c]"
                            >
                                <span className="text-sm leading-5 font-bold text-white">
                                    +
                                </span>
                                <span className="text-base leading-[22px] font-medium tracking-[-0.18px] text-white">
                                    Create New Case
                                </span>
                            </Link>
                        )}
                    </div>

                    {children}
                </div>
            </div>
        </PortalLayout>
    );
}
