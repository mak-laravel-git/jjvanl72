import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

import { AdminCaseDetailModal } from '@/components/admin-case-detail-modal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import {
    index as casesIndex,
    edit as editAdminCase,
} from '@/routes/admin/cases';
import type { PaginationData } from '@/types/data-table.types';

const asset = (name: string) => `/images/admin-dashboard/${name}`;
const ALL_VALUE = '__all__';

type CaseRow = {
    id: string;
    database_id: number;
    customer: string;
    customer_date: string;
    type: string;
    product: string;
    service_type: string;
    designer: string | null;
    manufacturer: string | null;
    status: string;
    status_tone: string;
    due_date: string;
    due_overdue: boolean;
    priority: string;
    priority_tone: string;
    notes: string | null;
    files_count: number;
    has_downloadable_files: boolean;
    creator: string;
};

type Props = {
    total: number;
    active: number;
    cases: CaseRow[];
    pagination: PaginationData;
    search: string;
    filters: Record<string, unknown>;
    sort_by: string;
    sort_order: string;
    statusOptions: Array<{ value: string; label: string }>;
    clientOptions: Array<{ id: number; name: string }>;
    serviceOptions: Array<{ value: string; label: string }>;
};

const statusClasses: Record<string, string> = {
    blue: 'border-[#b8e6fe] bg-[#f0f9ff] text-[#0069a8]',
    purple: 'border-[#e9d4ff] bg-[#faf5ff] text-[#8200db]',
    green: 'border-[#b9f8cf] bg-[#f0fdf4] text-[#008236]',
    teal: 'border-[#a2f4e0] bg-[#f0fdfa] text-[#0f766e]',
    yellow: 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]',
    orange: 'border-[#ffd6a7] bg-[#fff7ed] text-[#c2410c]',
    sky: 'border-[#bae6fd] bg-[#f0f9ff] text-[#0369a1]',
    gray: 'border-[#e5e7eb] bg-[#f9fafb] text-[#4b5563]',
    red: 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]',
};

function AssignLink({ label, tone }: { label: string; tone: 'blue' | 'pink' }) {
    return (
        <button
            type="button"
            className={cn(
                'inline-flex items-center gap-1 text-[11.25px] leading-[15px] font-medium',
                tone === 'blue' ? 'text-[#0260bd]' : 'text-[#f967a1]',
            )}
        >
            <span className="relative size-2.5 overflow-hidden">
                <img
                    src={asset(
                        tone === 'blue'
                            ? 'icon-plus-blue.svg'
                            : 'icon-plus-pink.svg',
                    )}
                    alt=""
                    className="size-full"
                />
            </span>
            {label}
        </button>
    );
}

export default function AllCases({
    total,
    active,
    cases,
    pagination,
    search: searchProp,
    filters,
    sort_by,
    sort_order,
    statusOptions,
    clientOptions,
    serviceOptions,
}: Props) {
    const [openCase, setOpenCase] = useState<CaseRow | null>(null);
    const [search, setSearch] = useState(searchProp ?? '');
    const statusFilter = String(filters?.status ?? '');
    const clientFilter = String(filters?.client_id ?? '');
    const serviceFilter = String(filters?.service ?? '');

    const navigate = useCallback(
        (overrides: Record<string, string | number | undefined>) => {
            const params: Record<string, string | number | undefined> = {
                search: search || undefined,
                sort_by: sort_by || undefined,
                sort_order: sort_by ? sort_order || 'asc' : undefined,
                per_page: pagination.per_page,
                page: pagination.current_page,
                ...(statusFilter ? { 'filters[status]': statusFilter } : {}),
                ...(clientFilter ? { 'filters[client_id]': clientFilter } : {}),
                ...(serviceFilter ? { 'filters[service]': serviceFilter } : {}),
                ...overrides,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            router.get(casesIndex.url(), params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [
            search,
            sort_by,
            sort_order,
            pagination.per_page,
            pagination.current_page,
            statusFilter,
            clientFilter,
            serviceFilter,
        ],
    );

    useEffect(() => {
        setSearch(searchProp ?? '');
    }, [searchProp]);

    useEffect(() => {
        if (search === (searchProp ?? '')) {
            return;
        }

        const timeout = window.setTimeout(() => {
            navigate({ search: search || undefined, page: 1 });
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [search, searchProp, navigate]);

    const pageNumbers = buildPageNumbers(
        pagination.current_page,
        pagination.last_page,
    );

    return (
        <AdminLayout>
            <Head title="All Cases" />

            <div className="p-6">
                <div>
                    <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        All Cases
                    </h1>
                    <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                        {total} total · {active} active
                    </p>
                </div>

                <div className="mt-[22.5px] flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px] flex-1">
                        <span className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 overflow-hidden">
                            <img
                                src={asset('icon-search.svg')}
                                alt=""
                                className="size-full"
                            />
                        </span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search case #, patient, client, dentist..."
                            className="h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white py-2 pr-3 pl-10 text-[13.125px] text-[#050315] outline-none placeholder:text-[#99a1af] focus:border-[#0260bd]"
                        />
                    </div>

                    <Select
                        value={statusFilter || ALL_VALUE}
                        onValueChange={(value) =>
                            navigate({
                                'filters[status]':
                                    value === ALL_VALUE ? undefined : value,
                                page: 1,
                            })
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by status"
                            className="h-10 w-[180px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>
                                All statuses
                            </SelectItem>
                            {statusOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={clientFilter || ALL_VALUE}
                        onValueChange={(value) =>
                            navigate({
                                'filters[client_id]':
                                    value === ALL_VALUE ? undefined : value,
                                page: 1,
                            })
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by client"
                            className="h-10 w-[200px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="All clients" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>
                                All clients
                            </SelectItem>
                            {clientOptions.map((option) => (
                                <SelectItem
                                    key={option.id}
                                    value={String(option.id)}
                                >
                                    {option.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={serviceFilter || ALL_VALUE}
                        onValueChange={(value) =>
                            navigate({
                                'filters[service]':
                                    value === ALL_VALUE ? undefined : value,
                                page: 1,
                            })
                        }
                    >
                        <SelectTrigger
                            aria-label="Filter by service"
                            className="h-10 w-[200px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue placeholder="All services" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_VALUE}>
                                All services
                            </SelectItem>
                            {serviceOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={String(pagination.per_page)}
                        onValueChange={(value) =>
                            navigate({
                                per_page: Number(value),
                                page: 1,
                            })
                        }
                    >
                        <SelectTrigger
                            aria-label="Rows per page"
                            className="h-10 w-[120px] rounded-[9.375px] border-[#e2e8f0] bg-white text-[13.125px] text-[#050315] shadow-none focus:border-[#0260bd] focus:ring-[#0260bd]/20"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[5, 10, 15, 30, 50].map((value) => (
                                <SelectItem key={value} value={String(value)}>
                                    {value} / page
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <span className="ml-auto text-[11.25px] text-[#99a1af]">
                        {pagination.total} results
                    </span>
                </div>

                <div className="mt-[15px] overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                    <div className="overflow-x-auto">
                        <table className="responsive-cards w-full min-w-[1100px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                    <th className="px-[15px] py-[11px]">
                                        Case ID
                                    </th>
                                    <th className="px-[15px] py-[11px]">
                                        Client / Patient
                                    </th>
                                    <th className="px-[15px] py-[11px]">
                                        Service
                                    </th>
                                    <th className="px-[15px] py-[11px]">
                                        Product
                                    </th>
                                    <th className="px-[15px] py-[11px]">
                                        Designer
                                    </th>
                                    <th className="px-[15px] py-[11px]">
                                        Manufacturer
                                    </th>
                                    <th className="px-[15px] py-[11px]">
                                        Status
                                    </th>
                                    <th className="px-[15px] py-[11px]">
                                        Due Date
                                    </th>
                                    <th className="px-[15px] py-[11px]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {cases.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-[15px] py-10 text-center text-[13.125px] text-[#94a3b8]"
                                        >
                                            No cases match your search or
                                            filters.
                                        </td>
                                    </tr>
                                ) : (
                                    cases.map((item, index) => (
                                        <tr
                                            key={item.database_id}
                                            className={cn(
                                                'border-[#e2e8f0]',
                                                index < cases.length - 1 &&
                                                    'border-b',
                                            )}
                                        >
                                            <td
                                                data-label="Case ID"
                                                className="px-[15px] py-4 font-mono text-[11.25px] font-bold text-[#0260bd]"
                                            >
                                                {item.id}
                                            </td>
                                            <td
                                                data-label="Client / Patient"
                                                className="px-[15px] py-3"
                                            >
                                                <p className="text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                                                    {item.customer}
                                                </p>
                                                <p className="text-[11.25px] leading-[15px] text-[#475569]">
                                                    {item.customer_date}
                                                </p>
                                            </td>
                                            <td
                                                data-label="Service"
                                                className="px-[15px] py-4"
                                            >
                                                <span className="inline-flex rounded-full bg-[#f3f4f6] px-[7.5px] py-[1.5px] text-[11.25px] text-[#475569]">
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td
                                                data-label="Product"
                                                className="px-[15px] py-4 text-[13.125px] text-[#050315]"
                                            >
                                                {item.product}
                                            </td>
                                            <td
                                                data-label="Designer"
                                                className="px-[15px] py-4"
                                            >
                                                {item.designer ? (
                                                    <span className="text-[11.25px] text-[#475569]">
                                                        {item.designer}
                                                    </span>
                                                ) : (
                                                    <AssignLink
                                                        label="Assign"
                                                        tone="blue"
                                                    />
                                                )}
                                            </td>
                                            <td
                                                data-label="Manufacturer"
                                                className="px-[15px] py-4"
                                            >
                                                {item.manufacturer ? (
                                                    <span className="text-[11.25px] text-[#475569]">
                                                        {item.manufacturer}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11.25px] text-[#d1d5dc]">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                data-label="Status"
                                                className="px-[15px] py-4"
                                            >
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full border px-[7.5px] py-[1.5px] text-[11.25px]',
                                                        statusClasses[
                                                            item.status_tone
                                                        ] ?? statusClasses.gray,
                                                    )}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td
                                                data-label="Due Date"
                                                className={cn(
                                                    'px-[15px] py-4 text-[11.25px]',
                                                    item.due_overdue
                                                        ? 'font-semibold text-[#e7000b]'
                                                        : 'text-[#475569]',
                                                )}
                                            >
                                                {item.due_date}
                                            </td>
                                            <td
                                                data-label="Actions"
                                                className="px-[15px] py-4"
                                            >
                                                <div className="flex items-center gap-[1.875px]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOpenCase(item)
                                                        }
                                                        className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50"
                                                    >
                                                        <span className="relative block size-[13px] overflow-hidden">
                                                            <img
                                                                src={asset(
                                                                    'action-view.svg',
                                                                )}
                                                                alt=""
                                                                className="size-full"
                                                            />
                                                        </span>
                                                        <span className="sr-only">
                                                            View {item.id}
                                                        </span>
                                                    </button>
                                                    <a
                                                        href={editAdminCase.url(
                                                            item.database_id,
                                                        )}
                                                        className="rounded-[3.75px] px-[7.5px] py-[5.625px] text-[11.25px] font-semibold text-[#0260bd] hover:bg-slate-50"
                                                    >
                                                        Load
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.total > 0 ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] px-[15px] py-3">
                            <p className="text-[11.25px] text-[#64748b]">
                                {pagination.from && pagination.to
                                    ? `Showing ${pagination.from}-${pagination.to} of ${pagination.total}`
                                    : `${pagination.total} total`}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    disabled={pagination.current_page <= 1}
                                    onClick={() =>
                                        navigate({
                                            page: pagination.current_page - 1,
                                        })
                                    }
                                    className="rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[11.25px] text-[#475569] disabled:opacity-40"
                                >
                                    Prev
                                </button>
                                {pageNumbers.map((page, index) =>
                                    page === '…' ? (
                                        <span
                                            key={`ellipsis-${index}`}
                                            className="px-1 text-[11.25px] text-[#94a3b8]"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => navigate({ page })}
                                            className={cn(
                                                'min-w-8 rounded-[6px] px-2.5 py-1.5 text-[11.25px]',
                                                page === pagination.current_page
                                                    ? 'bg-[#0260bd] text-white'
                                                    : 'border border-[#e2e8f0] text-[#475569]',
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ),
                                )}
                                <button
                                    type="button"
                                    disabled={
                                        pagination.current_page >=
                                        pagination.last_page
                                    }
                                    onClick={() =>
                                        navigate({
                                            page: pagination.current_page + 1,
                                        })
                                    }
                                    className="rounded-[6px] border border-[#e2e8f0] px-2.5 py-1.5 text-[11.25px] text-[#475569] disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <AdminCaseDetailModal
                caseDetail={openCase}
                statusClassName={
                    openCase
                        ? (statusClasses[openCase.status_tone] ??
                          statusClasses.gray)
                        : ''
                }
                onClose={() => setOpenCase(null)}
            />
        </AdminLayout>
    );
}

function buildPageNumbers(current: number, last: number): Array<number | '…'> {
    if (last <= 1) {
        return last === 1 ? [1] : [];
    }

    if (last <= 7) {
        return Array.from({ length: last }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, last, current - 1, current, current + 1]);
    const sorted = [...pages]
        .filter((page) => page >= 1 && page <= last)
        .sort((a, b) => a - b);

    const result: Array<number | '…'> = [];
    let previous = 0;

    for (const page of sorted) {
        if (previous && page - previous > 1) {
            result.push('…');
        }
        result.push(page);
        previous = page;
    }

    return result;
}
