import { Head } from '@inertiajs/react';

import AdminLayout from '@/layouts/admin-layout';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

type TrendProps = {
    label: string;
};

function Trend({ label }: TrendProps) {
    return (
        <div className="mt-1.5 flex items-center gap-1">
            <span className="relative size-[11px] shrink-0 overflow-hidden">
                <img
                    src={asset('kpi-trend-up.svg')}
                    alt=""
                    className="size-full"
                />
            </span>
            <span className="text-[11.25px] leading-[15px] font-medium text-[#096]">
                {label}
            </span>
        </div>
    );
}

type KpiCardProps = {
    label: string;
    value: string;
    icon: string;
    iconBg: string;
    hint?: string;
    trend?: string;
};

function KpiCard({ label, value, icon, iconBg, hint, trend }: KpiCardProps) {
    return (
        <div className="flex flex-col rounded-[13.375px] border border-[#e5e7eb] bg-white p-5">
            <div className="flex items-start justify-between">
                <p className="text-[11.25px] font-semibold tracking-[0.5625px] text-[#99a1af] uppercase">
                    {label}
                </p>
                <div
                    className="flex size-[33.75px] items-center justify-center rounded-[13.375px]"
                    style={{ backgroundColor: iconBg }}
                >
                    <span className="relative size-4 overflow-hidden">
                        <img src={asset(icon)} alt="" className="size-full" />
                    </span>
                </div>
            </div>
            <p className="mt-3 text-[22.5px] leading-[30px] font-bold text-[#050315]">
                {value}
            </p>
            {hint ? (
                <p className="mt-1 text-[11.25px] leading-[15px] text-[#99a1af]">
                    {hint}
                </p>
            ) : null}
            {trend ? <Trend label={trend} /> : null}
        </div>
    );
}

type StatusLegendItem = {
    label: string;
    count: number;
    color: string;
};

const statusLegend: StatusLegendItem[] = [
    { label: 'In Progress', count: 24, color: '#0260bd' },
    { label: 'Pending Review', count: 8, color: '#f967a1' },
    { label: 'Manufacturing', count: 15, color: '#6ea2d5' },
    { label: 'Completed', count: 47, color: '#22c55e' },
    { label: 'Overdue', count: 6, color: '#ef4444' },
];

type AttentionItem = {
    id: string;
    name: string;
    detail: string;
    status: string;
    statusTone: 'approved' | 'submitted';
    dot: string;
    action?: { label: string; tone: 'pink' | 'blue' };
};

const attentionItems: AttentionItem[] = [
    {
        id: 'APX-2845',
        name: 'Dr. James Kowalski',
        detail: 'Denture · Due 2026-07-01',
        status: 'Approved',
        statusTone: 'approved',
        dot: '#fb2c36',
        action: { label: 'Assign Mfg', tone: 'pink' },
    },
    {
        id: 'APX-2844',
        name: 'Bright Smile Clinic',
        detail: 'Implant · Due 2026-07-08',
        status: 'Submitted',
        statusTone: 'submitted',
        dot: '#2b7fff',
        action: { label: 'Assign', tone: 'blue' },
    },
    {
        id: 'APX-2843',
        name: 'Dr. Rachel Torres',
        detail: 'All-On-4 · Due 2026-07-10',
        status: 'Approved',
        statusTone: 'approved',
        dot: '#fe9a00',
    },
];

type ActivityItem = {
    title: string;
    detail: string;
    time: string;
    icon: string;
    iconBg: string;
};

const activityItems: ActivityItem[] = [
    {
        title: 'Status updated to Approved',
        detail: 'APX-2845',
        time: 'just now',
        icon: 'activity-status.svg',
        iconBg: '#dbeafe',
    },
    {
        title: 'Designer assigned',
        detail: 'APX-2839 → Aisha Patel',
        time: 'just now',
        icon: 'activity-status.svg',
        iconBg: '#dbeafe',
    },
    {
        title: 'New case submitted',
        detail: 'APX-2839 — Dr. Amy Chen (Bridge)',
        time: '2 min ago',
        icon: 'activity-status.svg',
        iconBg: '#dbeafe',
    },
    {
        title: 'Designer assigned',
        detail: 'APX-2837 — Marcus Chen → Dr. Michael Hughes',
        time: '18 min ago',
        icon: 'activity-status.svg',
        iconBg: '#dbeafe',
    },
    {
        title: 'Customer approved design',
        detail: 'APX-2843 — Dr. Rachel Torres (All-On-4)',
        time: '1 hr ago',
        icon: 'activity-status.svg',
        iconBg: '#dbeafe',
    },
    {
        title: 'Revision requested',
        detail: 'APX-2845 — Dr. James Kowalski',
        time: '2 hr ago',
        icon: 'activity-status.svg',
        iconBg: '#dbeafe',
    },
    {
        title: 'Invoice paid',
        detail: '$3,240 — Valley Dental Lab',
        time: '3 hr ago',
        icon: 'activity-paid.svg',
        iconBg: '#dcfce7',
    },
    {
        title: 'Shipment created',
        detail: 'APX-2840 — Sunrise Dental Partners',
        time: '4 hr ago',
        icon: 'activity-status.svg',
        iconBg: '#dbeafe',
    },
    {
        title: 'New user registered',
        detail: 'Dr. Jennifer Walsh — Dentist',
        time: '5 hr ago',
        icon: 'activity-user.svg',
        iconBg: '#f3e8ff',
    },
    {
        title: 'QC passed',
        detail: 'APX-2841 — Dr. Kevin Park (Crown)',
        time: '6 hr ago',
        icon: 'activity-status.svg',
        iconBg: '#dbeafe',
    },
];

export default function AdminDashboard() {
    return (
        <AdminLayout>
            <Head title="Command Center" />

            <div className="p-[22.5px]">
                <div>
                    <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        Command Center
                    </h1>
                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#6a7282]">
                        Monday, June 30, 2026 — Live operations overview
                    </p>
                </div>

                {/* Operations */}
                <section className="mt-6">
                    <p className="text-[11.25px] font-bold tracking-[1.125px] text-[#99a1af] uppercase">
                        Operations
                    </p>
                    <div className="mt-[11.25px] grid grid-cols-1 gap-[15px] sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label="Active Cases"
                            value="9"
                            icon="kpi-active-cases.svg"
                            iconBg="#eff6ff"
                            hint="↑ 3 from yesterday"
                            trend="+12% this week"
                        />
                        <KpiCard
                            label="Pending Assignments"
                            value="1"
                            icon="kpi-pending.svg"
                            iconBg="#fdf2f8"
                            hint="Needs immediate action"
                        />
                        <KpiCard
                            label="Overdue Cases"
                            value="1"
                            icon="kpi-overdue.svg"
                            iconBg="#fef2f2"
                            hint="Requires escalation"
                        />
                        <KpiCard
                            label="Completed Orders"
                            value="2"
                            icon="kpi-completed.svg"
                            iconBg="#ecfdf5"
                            trend="+8% vs last month"
                        />
                    </div>
                </section>

                {/* Platform Users */}
                <section className="mt-6">
                    <p className="text-[11.25px] font-bold tracking-[1.125px] text-[#99a1af] uppercase">
                        Platform Users
                    </p>
                    <div className="mt-[11.25px] grid grid-cols-2 gap-[15px] md:grid-cols-3 xl:grid-cols-5">
                        <KpiCard
                            label="Dentists"
                            value="48"
                            icon="user-dentists.svg"
                            iconBg="#eef2ff"
                        />
                        <KpiCard
                            label="Denturists"
                            value="23"
                            icon="user-denturists.svg"
                            iconBg="#f5f3ff"
                        />
                        <KpiCard
                            label="Labs"
                            value="17"
                            icon="user-labs.svg"
                            iconBg="#ecfeff"
                        />
                        <KpiCard
                            label="Designers"
                            value="5"
                            icon="user-designers.svg"
                            iconBg="#faf5ff"
                        />
                        <KpiCard
                            label="Manufacturers"
                            value="3"
                            icon="user-manufacturers.svg"
                            iconBg="#fff7ed"
                        />
                    </div>
                </section>

                {/* Financial */}
                <section className="mt-6">
                    <p className="text-[11.25px] font-bold tracking-[1.125px] text-[#99a1af] uppercase">
                        Financial
                    </p>
                    <div className="mt-[11.25px] grid grid-cols-1 gap-[15px] sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            label="Monthly Revenue"
                            value="$61,200"
                            icon="fin-revenue.svg"
                            iconBg="#ecfdf5"
                            trend="+8.7% vs May"
                        />
                        <KpiCard
                            label="Outstanding"
                            value="$18,450"
                            icon="fin-outstanding.svg"
                            iconBg="#fffbeb"
                            hint="12 invoices pending"
                        />
                        <KpiCard
                            label="Active Subscriptions"
                            value="45"
                            icon="fin-subscriptions.svg"
                            iconBg="#f0fdfa"
                            trend="+3 this month"
                        />
                        <KpiCard
                            label="Avg Order Value"
                            value="$1,055"
                            icon="fin-avg-order.svg"
                            iconBg="#f0f9ff"
                            trend="+5.2% this month"
                        />
                    </div>
                </section>

                {/* Cases by Status + Needs Attention */}
                <section className="mt-6 grid grid-cols-1 gap-[22px] xl:grid-cols-2">
                    <div className="rounded-[13.375px] border border-[#e5e7eb] bg-white p-[23.5px]">
                        <h3 className="text-[16.875px] leading-[25.313px] font-bold text-[#050315]">
                            Cases by Status
                        </h3>
                        <div className="mt-[15px] flex justify-center">
                            <div
                                className="relative size-40 rounded-full"
                                style={{
                                    background:
                                        'conic-gradient(#0260bd 0% 24%, #6ea2d5 24% 39%, #ef4444 39% 45%, #f967a1 45% 53%, #22c55e 53% 100%)',
                                }}
                                aria-hidden
                            >
                                <div className="absolute inset-[22%] rounded-full bg-white" />
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-x-[15px] gap-y-1.5">
                            {statusLegend.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-[7.5px]"
                                >
                                    <span
                                        className="size-[7.5px] shrink-0 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-[11.25px] leading-[15px] text-[#6a7282]">
                                        {item.label}
                                    </span>
                                    <span className="ml-auto text-[11.25px] leading-[15px] font-bold text-[#050315]">
                                        {item.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[13.375px] border border-[#e5e7eb] bg-white p-[23.5px]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[16.875px] leading-[25.313px] font-bold text-[#050315]">
                                Needs Attention
                            </h3>
                            <span className="rounded-full bg-[#ffe2e2] px-[9.375px] py-[1.875px] text-[11.25px] leading-[15px] font-semibold text-[#c10007]">
                                3 items
                            </span>
                        </div>
                        <div className="mt-[15px] flex flex-col gap-[7.5px]">
                            {attentionItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex flex-wrap items-center gap-[11.25px] rounded-[13.375px] bg-[#f9fafb] p-[11.25px]"
                                >
                                    <span
                                        className="size-[7.5px] shrink-0 rounded-full"
                                        style={{ backgroundColor: item.dot }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-[7.5px]">
                                            <span className="font-mono text-[11.25px] leading-[15px] text-[#99a1af]">
                                                {item.id}
                                            </span>
                                            <span className="text-[11.25px] leading-[15px] font-semibold text-[#050315]">
                                                {item.name}
                                            </span>
                                        </div>
                                        <p className="text-[11.25px] leading-[15px] text-[#99a1af]">
                                            {item.detail}
                                        </p>
                                    </div>
                                    <span
                                        className={
                                            item.statusTone === 'approved'
                                                ? 'rounded-full border border-[#b9f8cf] bg-[#f0fdf4] px-[8.5px] py-[2.875px] text-[11.25px] leading-[15px] text-[#008236]'
                                                : 'rounded-full border border-[#bedbff] bg-[#eff6ff] px-[8.5px] py-[2.875px] text-[11.25px] leading-[15px] text-[#1447e6]'
                                        }
                                    >
                                        {item.status}
                                    </span>
                                    {item.action ? (
                                        <button
                                            type="button"
                                            className={
                                                item.action.tone === 'pink'
                                                    ? 'rounded-[9.375px] bg-[#f967a1] px-[9.375px] py-[3.75px] text-[11.25px] leading-[15px] font-medium text-white'
                                                    : 'rounded-[9.375px] bg-[#0260bd] px-[9.375px] py-[3.75px] text-[11.25px] leading-[15px] font-medium text-white'
                                            }
                                        >
                                            {item.action.label}
                                        </button>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Recent Activity */}
                <section className="mt-6">
                    <div className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-[23.5px]">
                        <div className="mb-[15px] flex items-center justify-between">
                            <h3 className="text-[16.875px] leading-[25.313px] font-bold text-[#050315]">
                                Recent Activity
                            </h3>
                            <button
                                type="button"
                                className="text-[11.25px] leading-[15px] font-medium text-[#0260bd]"
                            >
                                View all
                            </button>
                        </div>
                        <div className="flex flex-col">
                            {activityItems.map((item, index) => (
                                <div
                                    key={`${item.title}-${item.time}-${index}`}
                                    className={`flex items-start gap-[11.25px] ${index > 0 ? 'pt-[11.25px]' : ''}`}
                                >
                                    <div
                                        className="flex size-[30px] shrink-0 items-center justify-center rounded-full"
                                        style={{ backgroundColor: item.iconBg }}
                                    >
                                        <span className="relative size-[13px] overflow-hidden">
                                            <img
                                                src={asset(item.icon)}
                                                alt=""
                                                className="size-full"
                                            />
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11.25px] leading-[15.469px] font-semibold text-[#050315]">
                                            {item.title}
                                        </p>
                                        <p className="mt-[1.875px] text-[11.25px] leading-[15px] text-[#475569]">
                                            {item.detail}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[11.25px] leading-[15px] text-[#475569]">
                                        {item.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
