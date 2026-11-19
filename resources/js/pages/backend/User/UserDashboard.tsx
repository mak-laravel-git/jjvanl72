import { Head, Link, usePage } from '@inertiajs/react';

import { RecentCases } from '@/components/portal/recent-cases';
import PortalLayout from '@/layouts/portal-layout';
import {
    activityMeta,
    getPortalView,
    type PortalActivity,
    type PortalQuickAction,
    type PortalStat,
} from '@/lib/portal-role';
import { cn } from '@/lib/utils';
import { create } from '@/routes/cases';
import type { SharedData } from '@/types';

import DesignerDashboard from './DesignerDashboard';
import ManufacturerDashboard from './ManufacturerDashboard';

function StatCard({ label, value, icon, iconBg }: PortalStat) {
    return (
        <div className="flex items-start justify-between rounded-xl border border-[#e2e8f0] bg-white p-[25px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium tracking-[-0.16px] text-[#f967a1]">
                    {label}
                </span>
                <span className="text-[32px] leading-[38px] font-bold tracking-[-0.2px] text-[#050315]">
                    {value}
                </span>
            </div>
            <div
                className="shrink-0 rounded-lg p-3"
                style={{ backgroundColor: iconBg }}
            >
                <span className="relative block size-6 overflow-hidden">
                    <img src={icon} alt="" className="size-full" />
                </span>
            </div>
        </div>
    );
}

function ActivityRow({
    item,
    partnerName,
    isLast,
}: {
    item: PortalActivity;
    partnerName: string;
    isLast: boolean;
}) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-start justify-between gap-3 px-8 py-5',
                !isLast && 'border-b border-[#e2e8f0]',
            )}
        >
            <div className="flex min-w-0 items-start">
                <span className="mt-1 mr-4 size-2 shrink-0 rounded-full bg-[#3b82f6] shadow-[0px_0px_0px_4px_#dbeafe]" />
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold tracking-[-0.16px] text-[#050315]">
                        {item.title}
                    </span>
                    <span className="text-xs tracking-[-0.12px] text-[#f967a1]">
                        {activityMeta(item, partnerName)}
                    </span>
                </div>
            </div>
            <span
                className={cn(
                    'shrink-0 rounded-full px-3 py-1 text-xs font-semibold tracking-[-0.12px]',
                    item.tone === 'blue'
                        ? 'bg-[#dbeafe] text-[#0260bd]'
                        : 'bg-[rgba(249,103,161,0.12)] text-[#f967a1]',
                )}
            >
                {item.status}
            </span>
        </div>
    );
}

function QuickActionButton({
    label,
    icon,
    href,
    openInNewTab,
}: PortalQuickAction) {
    const content = (
        <>
            <span className="relative block size-5 shrink-0 overflow-hidden">
                <img src={icon} alt="" className="size-full" />
            </span>
            <span className="text-base leading-[22px] font-medium tracking-[-0.18px] text-[#475569]">
                {label}
            </span>
        </>
    );

    if (!href) {
        return (
            <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-[17px] text-left transition-colors hover:border-[#0260bd]/30 hover:bg-[#f8fafc]"
            >
                {content}
            </button>
        );
    }

    return (
        <Link
            href={href}
            {...(openInNewTab
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            className="flex w-full items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-[17px] text-left transition-colors hover:border-[#0260bd]/30 hover:bg-[#f8fafc]"
        >
            {content}
        </Link>
    );
}

export default function UserDashboard() {
    const { auth } = usePage<SharedData>().props;
    const view = getPortalView(auth.user);

    if (view.layout === 'designer') {
        return <DesignerDashboard />;
    }

    if (view.layout === 'manufacturer') {
        return <ManufacturerDashboard />;
    }

    return <SubmitterDashboard />;
}

function SubmitterDashboard() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const permissions = user?.permissions ?? auth.permissions ?? [];
    const view = getPortalView(user);

    const can = (permission?: string) =>
        !permission || permissions.includes(permission);

    const quickActions = view.quickActions.filter((action) =>
        can(action.permission),
    );
    const showPrimaryAction =
        view.primaryAction !== undefined && can(view.primaryAction.permission);

    return (
        <PortalLayout>
            <Head title="Dashboard" />

            <div className="p-8 font-inter">
                <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                                Dashboard
                            </h1>
                            <p className="text-base leading-[22px] tracking-[-0.18px] text-[#475569]">
                                Welcome back, {user?.name}
                            </p>
                        </div>

                        {showPrimaryAction && (
                            <Link
                                href={view.primaryAction?.href ?? create.url()}
                                {...(view.primaryAction?.openInNewTab !== false
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
                                    {view.primaryAction?.label}
                                </span>
                            </Link>
                        )}
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2 xl:grid-cols-4">
                            {view.stats.slice(0, 4).map((stat) => (
                                <StatCard key={stat.id} {...stat} />
                            ))}
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                            {view.stats.slice(4).map((stat) => (
                                <StatCard key={stat.id} {...stat} />
                            ))}
                        </div>
                    </div>

                    {view.recentCases && view.recentCases.length > 0 && (
                        <RecentCases cases={view.recentCases} />
                    )}

                    <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_376px]">
                        <section className="flex flex-col gap-6 rounded-lg border border-[#f3f4f6] bg-white p-[25px] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                            <h2 className="text-lg leading-7 font-medium text-[#050315]">
                                Recent Activity
                            </h2>
                            <div className="rounded-xl border border-[#e2e8f0]">
                                {view.activity.map((item, index) => (
                                    <ActivityRow
                                        key={`${item.caseId}-${item.status}-${index}`}
                                        item={item}
                                        partnerName={view.partnerName}
                                        isLast={
                                            index === view.activity.length - 1
                                        }
                                    />
                                ))}
                            </div>
                        </section>

                        {quickActions.length > 0 && (
                            <aside className="flex flex-col gap-4 rounded-2xl bg-[#e2e8f0] p-4">
                                <h2 className="text-lg leading-7 font-medium text-[#050315]">
                                    Quick Actions
                                </h2>
                                {quickActions.map((action) => (
                                    <QuickActionButton
                                        key={action.label}
                                        {...action}
                                    />
                                ))}
                            </aside>
                        )}
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
