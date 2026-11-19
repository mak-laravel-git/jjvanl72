import { Link } from '@inertiajs/react';

import { portalAsset, type PortalRecentCase } from '@/lib/portal-role';
import { cn } from '@/lib/utils';
import { active } from '@/routes/cases';

const serviceClasses: Record<PortalRecentCase['serviceTone'], string> = {
    designMfg: 'border-[#bedbff] bg-[#eff6ff] text-[#0260bd]',
    mfgOnly: 'border-[#e9d4ff] bg-[#faf5ff] text-[#0260bd]',
    designOnly: 'border-[#c6d2ff] bg-[#eef2ff] text-[#0260bd]',
};

const statusClasses: Record<PortalRecentCase['statusTone'], string> = {
    readyForReview: 'border-[#fee685] bg-[#fffbeb] text-[#bb4d00]',
    inProduction: 'border-[#e9d4ff] bg-[#faf5ff] text-[#0260bd]',
    designInProgress: 'border-[#ddd6ff] bg-[#f5f3ff] text-[#0260bd]',
    qualityCheck: 'border-[#a2f4fd] bg-[#ecfeff] text-[#f967a1]',
    shipped: 'border-[#96f7e4] bg-[#f0fdfa] text-[#475569]',
};

const priorityClasses: Record<PortalRecentCase['priority'], string> = {
    urgent: 'border-[#ffd6a8] bg-[#ffedd4] text-[#ca3500]',
    standard: 'border-[#e5e7eb] bg-[#f3f4f6] text-[#f967a1]',
    rush: 'border-[#ffc9c9] bg-[#ffe2e2] text-[#c10007]',
};

function CaseBadge({ label, className }: { label: string; className: string }) {
    return (
        <span
            className={cn(
                'shrink-0 rounded-full border px-[8.5px] py-[2.875px] text-xs leading-4 font-medium tracking-[-0.12px]',
                className,
            )}
        >
            {label}
        </span>
    );
}

type RecentCasesProps = {
    cases: PortalRecentCase[];
};

export function RecentCases({ cases }: RecentCasesProps) {
    return (
        <section className="overflow-hidden rounded-[11.5px] border border-[#e5e7eb] bg-white">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] px-[18.75px] pt-[15px] pb-4">
                <h2 className="text-lg leading-7 font-medium text-[#050315]">
                    Recent Cases
                </h2>
                <Link
                    href={active.url()}
                    className="flex items-center gap-[3.75px] text-base leading-[22px] font-medium tracking-[-0.18px] text-[#0260bd] transition-opacity hover:opacity-80"
                >
                    View all
                    <span className="relative block size-4 shrink-0 overflow-hidden">
                        <img
                            src={portalAsset('icon-chevron-right-16.svg')}
                            alt=""
                            className="size-4"
                        />
                    </span>
                </Link>
            </div>

            <div className="flex flex-col">
                {cases.map((item, index) => (
                    <div
                        key={item.id}
                        className={cn(
                            'flex flex-wrap items-center gap-[15px] px-[18.75px] py-[11.25px]',
                            index < cases.length - 1 &&
                                'border-b border-[#e2e8f0]',
                        )}
                    >
                        <span className="w-[135px] shrink-0 text-xs leading-4 font-semibold tracking-[-0.12px] text-[#0260bd]">
                            {item.id}
                        </span>

                        <div className="flex min-w-[180px] flex-1 flex-col">
                            <span className="text-sm leading-5 font-medium tracking-[-0.16px] text-[#050315]">
                                {item.clinic}
                            </span>
                            <span className="text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                                {item.product}
                            </span>
                        </div>

                        <CaseBadge
                            label={item.service}
                            className={serviceClasses[item.serviceTone]}
                        />
                        <CaseBadge
                            label={item.status}
                            className={statusClasses[item.statusTone]}
                        />
                        <CaseBadge
                            label={item.priority}
                            className={priorityClasses[item.priority]}
                        />

                        <span className="w-[90px] shrink-0 text-right font-mono text-[11.25px] leading-[15px] text-[#99a1af]">
                            {item.date}
                        </span>

                        <Link
                            href={active.url()}
                            className="flex shrink-0 items-center gap-[3.75px] pl-[7.5px] text-sm leading-5 font-medium tracking-[-0.16px] text-[#0260bd] transition-opacity hover:opacity-80"
                        >
                            Open
                            <span className="relative block size-3 shrink-0 overflow-hidden">
                                <img
                                    src={portalAsset(
                                        'icon-chevron-right-12.svg',
                                    )}
                                    alt=""
                                    className="size-3"
                                />
                            </span>
                        </Link>
                    </div>
                ))}
            </div>
        </section>
    );
}
