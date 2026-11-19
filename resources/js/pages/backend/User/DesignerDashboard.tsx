import { Head, Link, usePage } from '@inertiajs/react';

import PortalLayout from '@/layouts/portal-layout';
import {
    getPortalView,
    portalAsset,
    type DesignerAction,
    type DesignerActiveCase,
    type DesignerFeedItem,
    type DesignerStat,
} from '@/lib/portal-role';
import { cn } from '@/lib/utils';
import { assigned as designerAssigned } from '@/routes/designer';
import type { SharedData } from '@/types';

const statToneClasses: Record<DesignerStat['tone'], string> = {
    blue: 'border-[#dbeafe] bg-[#eff6ff]',
    neutral: 'border-[#e5e7eb] bg-white',
    violet: 'border-[#ede9fe] bg-[#f5f3ff]',
    pink: 'border-[rgba(249,103,161,0.25)] bg-[rgba(249,103,161,0.08)]',
};

const statusToneClasses: Record<DesignerActiveCase['statusTone'], string> = {
    submitted: 'bg-[#dbeafe] text-[#0260bd]',
    assigned: 'bg-[#eff6ff] text-[#0260bd]',
    revision: 'bg-[#f1f5f9] text-[#475569]',
    downloaded: 'bg-[#e0f2fe] text-[#0369a1]',
    review: 'bg-[#eff6ff] text-[#0260bd]',
    completed: 'bg-[#dcfce7] text-[#15803d]',
};

const priorityClasses: Record<DesignerActiveCase['priority'], string> = {
    High: 'text-[#0260bd]',
    Medium: 'text-[#475569]',
    Low: 'text-[#94a3b8]',
};

const actionVariantClasses: Record<DesignerAction['variant'], string> = {
    primary: 'bg-[#0260bd] text-white hover:bg-[#024f9c]',
    accent: 'bg-[#f967a1] text-white hover:bg-[#e85590]',
    outline:
        'border border-[#e2e8f0] bg-white text-[#050315] hover:border-[#0260bd]/40 hover:bg-[#f8fafc]',
};

function DesignerStatCard({ label, value, tone }: DesignerStat) {
    return (
        <div
            className={cn(
                'flex h-[89px] flex-col rounded border p-[17px]',
                statToneClasses[tone],
            )}
        >
            <span className="text-xs leading-4 font-medium text-[#475569]">
                {label}
            </span>
            <span className="mt-1 text-[32px] leading-[38px] font-bold tracking-[-0.2px] text-[#050315]">
                {value}
            </span>
        </div>
    );
}

function DesignerActionButton({ label, icon, href, variant }: DesignerAction) {
    return (
        <Link
            href={href}
            className={cn(
                'flex h-[46px] items-center gap-3 rounded px-4 py-3 text-sm leading-5 font-medium transition-colors',
                actionVariantClasses[variant],
            )}
        >
            <span className="relative block size-4 shrink-0 overflow-hidden">
                <img src={icon} alt="" className="size-4" />
            </span>
            {label}
        </Link>
    );
}

function DesignerFeedRow({ item }: { item: DesignerFeedItem }) {
    return (
        <div className="flex gap-3 border-b border-[#f1f5f9] px-4 py-3 last:border-b-0">
            <span
                className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    item.tone === 'blue' ? 'bg-[#3b82f6]' : 'bg-[#f967a1]',
                )}
            />
            <div className="flex min-w-0 flex-col gap-1">
                <span className="text-sm leading-5 tracking-[-0.16px] text-[#050315]">
                    {item.text}
                </span>
                <span className="text-xs leading-4 tracking-[-0.12px] text-[#94a3b8]">
                    {item.time}
                </span>
            </div>
        </div>
    );
}

export default function DesignerDashboard() {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.user?.permissions ?? auth.permissions ?? [];
    const view = getPortalView(auth.user);

    const can = (permission?: string) =>
        !permission || permissions.includes(permission);

    const actions = (view.designerActions ?? []).filter((action) =>
        can(action.permission),
    );

    return (
        <PortalLayout>
            <Head title="Dashboard" />

            <div className="p-6 font-inter">
                <div className="mx-auto flex max-w-[1656px] flex-col gap-5">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                            Dashboard
                        </h1>
                        {view.subtitle && (
                            <p className="text-sm leading-4 tracking-[-0.12px] text-[#475569]">
                                {view.subtitle}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                        {(view.designerStats ?? []).map((stat) => (
                            <DesignerStatCard key={stat.id} {...stat} />
                        ))}
                    </div>

                    {actions.length > 0 && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {actions.map((action) => (
                                <DesignerActionButton
                                    key={action.label}
                                    {...action}
                                />
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                        <section className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
                            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-5 py-3">
                                <h2 className="text-lg leading-7 font-medium text-[#050315]">
                                    Active Cases
                                </h2>
                                <Link
                                    href={designerAssigned.url()}
                                    className="flex items-center gap-1 text-sm leading-5 font-medium text-[#0260bd] transition-opacity hover:opacity-80"
                                >
                                    View all
                                    <span className="relative block size-3 shrink-0 overflow-hidden">
                                        <img
                                            src={portalAsset(
                                                'designer-view-all.svg',
                                            )}
                                            alt=""
                                            className="size-3"
                                        />
                                    </span>
                                </Link>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px] border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                                            {[
                                                'Case ID',
                                                'Product',
                                                'Dentist / Lab',
                                                'Due Date',
                                                'Priority',
                                                'Status',
                                                'Actions',
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className="px-4 py-2.5 text-left text-xs font-medium tracking-[-0.12px] text-[#94a3b8]"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(view.designerActiveCases ?? []).map(
                                            (item) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b border-[#f1f5f9] last:border-b-0"
                                                >
                                                    <td className="px-4 py-3 text-sm font-medium text-[#0260bd]">
                                                        {item.id}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-[#475569]">
                                                        {item.product}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-[#475569]">
                                                        {item.client}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-[#475569]">
                                                        {item.dueDate}
                                                    </td>
                                                    <td
                                                        className={cn(
                                                            'px-4 py-3 text-sm font-medium',
                                                            priorityClasses[
                                                                item.priority
                                                            ],
                                                        )}
                                                    >
                                                        {item.priority}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={cn(
                                                                'inline-flex rounded px-2 py-1 text-[12px] leading-3 font-medium',
                                                                statusToneClasses[
                                                                    item
                                                                        .statusTone
                                                                ],
                                                            )}
                                                        >
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Link
                                                            href={designerAssigned.url()}
                                                            className="text-sm font-medium text-[#0260bd] transition-opacity hover:opacity-80"
                                                        >
                                                            Open
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <aside className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-white">
                            <div className="border-b border-[#e2e8f0] px-4 py-3">
                                <h2 className="text-lg leading-7 font-medium text-[#050315]">
                                    Recent Activity
                                </h2>
                            </div>
                            <div className="flex flex-col">
                                {(view.designerFeed ?? []).map((item) => (
                                    <DesignerFeedRow
                                        key={item.id}
                                        item={item}
                                    />
                                ))}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
