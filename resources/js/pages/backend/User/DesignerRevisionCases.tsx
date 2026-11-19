import { Head, Link } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import PortalLayout from '@/layouts/portal-layout';
import { designerCaseHref, portalAsset } from '@/lib/portal-role';
import { cn } from '@/lib/utils';

export type DesignerRevisionCase = {
    id: string;
    customer: string;
    product: string;
    client: string;
    assigned_date: string;
    due_date: string;
    priority: 'High' | 'Medium' | 'Low';
    status: string;
    status_tone: 'revision';
};

type Props = {
    cases: DesignerRevisionCase[];
};

const priorityClasses: Record<DesignerRevisionCase['priority'], string> = {
    High: 'text-[#e7000b]',
    Medium: 'text-[#e17100]',
    Low: 'text-[#f967a1]',
};

const tableHeadings = [
    'Case ID',
    'Customer',
    'Product Type',
    'Dentist / Lab',
    'Assigned',
    'Due Date',
    'Priority',
    'Status',
    'Actions',
] as const;

function FilterSelect({
    value,
    onChange,
    options,
    ariaLabel,
}: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    ariaLabel: string;
}) {
    return (
        <div className="relative">
            <select
                aria-label={ariaLabel}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-9 appearance-none rounded-lg border border-[#475569] bg-white py-2 pr-10 pl-4 text-sm tracking-[-0.16px] text-[#050315] outline-none"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-[#050315]" />
        </div>
    );
}

export default function DesignerRevisionCases({ cases }: Props) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    const statusOptions = useMemo(
        () => [
            { value: 'all', label: 'All Statuses' },
            ...[...new Set(cases.map((item) => item.status))].map((status) => ({
                value: status,
                label: status,
            })),
        ],
        [cases],
    );

    const visibleCases = useMemo(
        () =>
            cases.filter(
                (item) =>
                    (statusFilter === 'all' || item.status === statusFilter) &&
                    (priorityFilter === 'all' ||
                        item.priority === priorityFilter),
            ),
        [cases, statusFilter, priorityFilter],
    );

    return (
        <PortalLayout>
            <Head title="Revision Requests" />

            <div className="flex flex-col gap-5 p-6 font-inter">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                            Revision Requests
                        </h1>
                        <p className="pt-0.5 text-xs leading-4 font-medium tracking-[-0.12px] text-[#475569]">
                            {visibleCases.length}{' '}
                            {visibleCases.length === 1 ? 'case' : 'cases'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="relative block size-3.5 shrink-0 overflow-hidden">
                            <img
                                src={portalAsset('icon-filter.svg')}
                                alt=""
                                className="size-full"
                            />
                        </span>
                        <FilterSelect
                            ariaLabel="Filter by status"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={statusOptions}
                        />
                        <FilterSelect
                            ariaLabel="Filter by priority"
                            value={priorityFilter}
                            onChange={setPriorityFilter}
                            options={[
                                { value: 'all', label: 'All Priorities' },
                                { value: 'High', label: 'High' },
                                { value: 'Medium', label: 'Medium' },
                                { value: 'Low', label: 'Low' },
                            ]}
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded border border-[#e2e8f0] bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#fdfdfd]">
                                    {tableHeadings.map((heading) => (
                                        <th
                                            key={heading}
                                            className="px-4 py-3 text-left text-xs font-semibold tracking-[-0.12px] whitespace-nowrap text-[#475569]"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visibleCases.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className={cn(
                                            'border-b border-[#e2e8f0] last:border-b-0',
                                            index % 2 === 1 &&
                                                'bg-[rgba(249,250,251,0.2)]',
                                        )}
                                    >
                                        <td className="px-4 py-[13px] text-sm leading-5 font-semibold tracking-[-0.16px] whitespace-nowrap text-[#0260bd]">
                                            {item.id}
                                        </td>
                                        <td className="px-4 py-[13px] text-xs tracking-[-0.12px] whitespace-nowrap text-[#4a5565]">
                                            {item.customer}
                                        </td>
                                        <td className="px-4 py-[13px] text-xs font-semibold tracking-[-0.12px] whitespace-nowrap text-[#1e2939]">
                                            {item.product}
                                        </td>
                                        <td className="px-4 py-[13px] text-xs tracking-[-0.12px] whitespace-nowrap text-[#6a7282]">
                                            {item.client}
                                        </td>
                                        <td className="px-4 py-[13px] text-xs tracking-[-0.12px] whitespace-nowrap text-[#99a1af]">
                                            {item.assigned_date}
                                        </td>
                                        <td className="px-4 py-[13px] text-xs tracking-[-0.12px] whitespace-nowrap text-[#6a7282]">
                                            {item.due_date}
                                        </td>
                                        <td
                                            className={cn(
                                                'px-4 py-[13px] text-xs font-semibold tracking-[-0.12px] whitespace-nowrap',
                                                priorityClasses[item.priority],
                                            )}
                                        >
                                            {item.priority}
                                        </td>
                                        <td className="px-4 py-[13px]">
                                            <span className="inline-flex h-[19px] min-w-[126px] items-center justify-center rounded border border-[#ffccd3] bg-[#fff1f2] px-2 font-mono text-[10px] leading-[15px] font-medium whitespace-nowrap text-[#c70036]">
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-[13px]">
                                            <Link
                                                href={designerCaseHref(
                                                    item.id,
                                                    'revisions',
                                                )}
                                                className="inline-flex items-center justify-center rounded bg-[#0260bd] px-3 py-2 text-xs leading-4 font-medium text-white hover:bg-[#024f9c]"
                                            >
                                                Open Case
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {visibleCases.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-4 py-12 text-center text-sm text-[#475569]"
                                        >
                                            No revision requests match these
                                            filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
