import { Head } from '@inertiajs/react';

import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

type ChartData = {
    title: string;
    labels: string[];
    values: number[];
    max: number;
    y_labels: (string | number)[];
};

type Designer = {
    id: number;
    name: string;
    initials: string;
    cases: number;
    avg_turnaround: string;
    approval_rate: number;
    revision_rate: number;
};

type Props = {
    casesChart: ChartData;
    revenueChart: ChartData;
    designers: Designer[];
};

function BarChart({ chart }: { chart: ChartData }) {
    return (
        <div className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
            <h2 className="text-[15px] leading-[22.5px] font-bold text-[#050315]">
                {chart.title}
            </h2>

            <div className="mt-6 flex gap-4">
                <div className="flex h-[180px] flex-col justify-between text-[10px] text-[#99a1af]">
                    {[...chart.y_labels].reverse().map((label) => (
                        <span key={String(label)}>{label}</span>
                    ))}
                </div>

                <div className="flex flex-1 flex-col">
                    <div className="relative flex h-[180px] items-end justify-between gap-2 border-b border-l border-[#e2e8f0] px-2 pb-0">
                        {chart.values.map((value, index) => {
                            const height = (value / chart.max) * 100;

                            return (
                                <div
                                    key={chart.labels[index]}
                                    className="flex flex-1 flex-col items-center justify-end"
                                >
                                    <div
                                        className="w-full max-w-[36px] rounded-t-[4px] bg-[#0260bd]"
                                        style={{ height: `${height}%` }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-2 flex justify-between px-2 text-[10px] text-[#99a1af]">
                        {chart.labels.map((label) => (
                            <span key={label} className="flex-1 text-center">
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function LineChart({ chart }: { chart: ChartData }) {
    const width = 400;
    const height = 180;
    const padding = 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = chart.values.map((value, index) => {
        const x = padding + (index / (chart.values.length - 1)) * chartWidth;
        const y = padding + chartHeight - (value / chart.max) * chartHeight;

        return `${x},${y}`;
    });

    const polylinePoints = points.join(' ');
    const areaPoints = `${padding},${padding + chartHeight} ${polylinePoints} ${padding + chartWidth},${padding + chartHeight}`;

    return (
        <div className="rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
            <h2 className="text-[15px] leading-[22.5px] font-bold text-[#050315]">
                {chart.title}
            </h2>

            <div className="mt-6 flex gap-4">
                <div className="flex h-[180px] flex-col justify-between text-[10px] text-[#99a1af]">
                    {[...chart.y_labels].reverse().map((label) => (
                        <span key={String(label)}>{label}</span>
                    ))}
                </div>

                <div className="flex flex-1 flex-col">
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="h-[180px] w-full border-b border-l border-[#e2e8f0]"
                        preserveAspectRatio="none"
                    >
                        <polygon
                            points={areaPoints}
                            fill="rgba(2,96,189,0.12)"
                        />
                        <polyline
                            points={polylinePoints}
                            fill="none"
                            stroke="#0260bd"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                        {chart.values.map((value, index) => {
                            const x =
                                padding +
                                (index / (chart.values.length - 1)) *
                                    chartWidth;
                            const y =
                                padding +
                                chartHeight -
                                (value / chart.max) * chartHeight;

                            return (
                                <circle
                                    key={chart.labels[index]}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#0260bd"
                                />
                            );
                        })}
                    </svg>
                    <div className="mt-2 flex justify-between text-[10px] text-[#99a1af]">
                        {chart.labels.map((label) => (
                            <span key={label} className="flex-1 text-center">
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ReportsAnalytics({
    casesChart,
    revenueChart,
    designers,
}: Props) {
    return (
        <AdminLayout>
            <Head title="Reports & Analytics" />

            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Reports & Analytics
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            Platform-wide performance metrics
                        </p>
                    </div>

                    <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-[9.375px] bg-[#0260bd] px-4 py-2.5 text-[13.125px] font-semibold text-white"
                    >
                        <span className="relative size-3.5 overflow-hidden">
                            <img
                                src={asset('btn-export-report.svg')}
                                alt=""
                                className="size-full"
                            />
                        </span>
                        Export Report
                    </button>
                </div>

                <div className="mt-[22.5px] grid grid-cols-1 gap-[15px] xl:grid-cols-2">
                    <BarChart chart={casesChart} />
                    <LineChart chart={revenueChart} />
                </div>

                <div className="mt-[22.5px] overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                    <div className="border-b border-[#e2e8f0] px-5 py-4">
                        <h2 className="text-[15px] leading-[22.5px] font-bold text-[#050315]">
                            Designer Performance
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Designer
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Cases
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Avg Turnaround
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Approval Rate
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Revision Rate
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {designers.map((designer, index) => (
                                    <tr
                                        key={designer.id}
                                        className={cn(
                                            'border-[#e2e8f0]',
                                            index < designers.length - 1 &&
                                                'border-b',
                                        )}
                                    >
                                        <td className="px-[19px] py-[14px]">
                                            <div className="flex items-center gap-[11.25px]">
                                                <div className="flex size-[26.25px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0260bd] to-[#6ea2d5]">
                                                    <span className="text-[11.25px] leading-[15px] font-semibold text-white">
                                                        {designer.initials}
                                                    </span>
                                                </div>
                                                <span className="text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                                                    {designer.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-[19px] py-[14px] text-[13.125px] leading-[18.75px] font-bold text-[#050315]">
                                            {designer.cases}
                                        </td>
                                        <td className="px-[19px] py-[14px] text-[11.25px] leading-[15px] text-[#475569]">
                                            {designer.avg_turnaround}
                                        </td>
                                        <td className="px-[19px] py-[14px]">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-24 overflow-hidden rounded-full bg-[#e2e8f0]">
                                                    <div
                                                        className="h-full rounded-full bg-[#22c55e]"
                                                        style={{
                                                            width: `${designer.approval_rate}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-[11.25px] font-semibold text-[#008236]">
                                                    {designer.approval_rate}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-[19px] py-[14px] text-[11.25px] font-semibold text-[#ea580c]">
                                            {designer.revision_rate}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
