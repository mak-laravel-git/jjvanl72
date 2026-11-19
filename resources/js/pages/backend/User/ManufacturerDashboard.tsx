import { Head, Link, usePage } from '@inertiajs/react';

import PortalLayout from '@/layouts/portal-layout';
import {
    getPortalView,
    portalAsset,
    type ManufacturerAction,
    type ManufacturerStat,
    type ManufacturerTimelineItem,
} from '@/lib/portal-role';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

function ManufacturerStatCard({
    label,
    value,
    icon,
    iconBg,
    href,
}: ManufacturerStat) {
    return (
        <Link
            href={href}
            className="flex flex-col justify-center rounded-[10px] border border-[#e2e8f0] bg-white p-[25px] transition-colors hover:border-[#0260bd]/40"
        >
            <div className="flex items-start justify-between">
                <div className="flex flex-col">
                    <span className="text-sm leading-5 font-medium tracking-[-0.16px] text-[#475569]">
                        {label}
                    </span>
                    <span className="mt-2 text-[32px] leading-[38px] font-bold tracking-[-0.2px] text-[#050315]">
                        {value}
                    </span>
                </div>
                <span
                    className="flex size-12 shrink-0 items-center justify-center rounded-[10px] p-3"
                    style={{ backgroundColor: iconBg }}
                >
                    <img src={icon} alt="" className="size-6" />
                </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
                <span className="text-sm leading-5 font-medium tracking-[-0.16px] text-[#0260bd]">
                    View details
                </span>
                <img
                    src={portalAsset('mfg-view-details.svg')}
                    alt=""
                    className="size-4"
                />
            </div>
        </Link>
    );
}

function ManufacturerActionCard({
    label,
    icon,
    iconBg,
    href,
}: ManufacturerAction) {
    return (
        <Link
            href={href}
            className="flex flex-col items-center gap-2 rounded-[10px] border border-[#e2e8f0] bg-white p-[17px] transition-colors hover:border-[#0260bd]/40"
        >
            <span
                className="flex size-11 items-center justify-center rounded-[10px] p-3"
                style={{ backgroundColor: iconBg }}
            >
                <img src={icon} alt="" className="size-5" />
            </span>
            <span className="text-center text-sm leading-5 font-medium tracking-[-0.16px] text-[#050315]">
                {label}
            </span>
        </Link>
    );
}

function ManufacturerTimelineRow({
    item,
    isLast,
}: {
    item: ManufacturerTimelineItem;
    isLast: boolean;
}) {
    return (
        <div className={cn('flex gap-4', !isLast && 'pb-4')}>
            <div className="flex flex-col items-center">
                <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: item.iconBg }}
                >
                    <img src={item.icon} alt="" className="size-5" />
                </span>
                {!isLast && <span className="mt-2 w-0.5 flex-1 bg-[#e2e8f0]" />}
            </div>
            <div className={cn('flex min-w-0 flex-col', !isLast && 'pb-4')}>
                <span className="text-base leading-[22px] font-medium tracking-[-0.18px] text-[#050315]">
                    {item.title}
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm leading-5 tracking-[-0.16px] text-[#6ea2d5]">
                        {item.caseId}
                    </span>
                    <span
                        className={cn(
                            'text-sm leading-5',
                            item.accent === 'pink'
                                ? 'text-[#f967a1]'
                                : 'text-[#475569]',
                        )}
                    >
                        •
                    </span>
                    <span className="text-sm leading-5 tracking-[-0.16px] text-[#475569]">
                        {item.time}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function ManufacturerDashboard() {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.user?.permissions ?? auth.permissions ?? [];
    const view = getPortalView(auth.user);

    const can = (permission?: string) =>
        !permission || permissions.includes(permission);

    const actions = (view.manufacturerActions ?? []).filter((action) =>
        can(action.permission),
    );

    const timeline = view.manufacturerTimeline ?? [];

    return (
        <PortalLayout>
            <Head title="Manufacturing Dashboard" />

            <div className="p-6 font-inter">
                <div className="mx-auto flex max-w-[1656px] flex-col gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                            Manufacturing Dashboard
                        </h1>
                        {view.subtitle && (
                            <p className="mt-1 text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                                {view.subtitle}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {(view.manufacturerStats ?? []).map((stat) => (
                            <ManufacturerStatCard key={stat.id} {...stat} />
                        ))}
                    </div>

                    {actions.length > 0 && (
                        <section className="flex flex-col gap-4">
                            <h2 className="text-lg leading-7 font-medium text-[#050315]">
                                Quick Actions
                            </h2>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                                {actions.map((action) => (
                                    <ManufacturerActionCard
                                        key={action.label}
                                        {...action}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="flex flex-col gap-4">
                        <h2 className="text-lg leading-7 font-medium text-[#050315]">
                            Recent Activity Timeline
                        </h2>
                        <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-[25px]">
                            {timeline.map((item, index) => (
                                <ManufacturerTimelineRow
                                    key={item.id}
                                    item={item}
                                    isLast={index === timeline.length - 1}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </PortalLayout>
    );
}
