import { Head, Link } from '@inertiajs/react';
import {
    ChevronDown,
    CircleCheck,
    Download,
    ExternalLink,
    Eye,
    Play,
    Search,
    Truck,
    Undo2,
    Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    PortalCaseTable,
    type PortalCaseRow,
} from '@/components/portal/case-table';
import { PortalPageShell } from '@/components/portal/page-shell';
import PortalLayout from '@/layouts/portal-layout';
import { cn } from '@/lib/utils';
import { show as assignedShow } from '@/routes/manufacturer/assigned';
import { show as inProductionShow } from '@/routes/manufacturer/in-production';

type AssignedJob = {
    id: string;
    customer: string;
    type: string;
    product: string;
    material: string;
    due_date: string;
    priority: string;
    status: string;
    status_tone: 'assigned' | 'accepted';
};

type InProductionJob = {
    id: string;
    customer: string;
    product: string;
    material: string;
    due_date: string;
    priority: string;
};

type QualityCheckJob = {
    id: string;
    customer: string;
    product: string;
    material: string;
    due_date: string;
    priority: string;
};

type ReadyToShipJob = {
    id: string;
    customer: string;
    product: string;
    material: string;
    due_date: string;
    shipping_address: string;
};

type ShippedJob = {
    id: string;
    customer: string;
    product: string;
    courier: string;
    tracking_number: string;
    est_delivery: string;
};

type Props = {
    title: string;
    cases: PortalCaseRow[];
    assignedJobs?: AssignedJob[] | null;
    inProductionJobs?: InProductionJob[] | null;
    qualityCheckJobs?: QualityCheckJob[] | null;
    readyToShipJobs?: ReadyToShipJob[] | null;
    shippedJobs?: ShippedJob[] | null;
};

const assignedJobStatusClasses: Record<AssignedJob['status_tone'], string> = {
    assigned: 'bg-[#eff6ff] text-[#155dfc]',
    accepted: 'bg-[#eff6ff] text-[#155dfc]',
};

function FilterSelect({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (value: string) => void;
    options: string[];
}) {
    return (
        <div className="relative min-w-[200px] flex-1">
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-[42px] w-full appearance-none rounded-lg border border-[#e2e8f0] bg-white px-4 pr-10 text-sm tracking-[-0.16px] text-[#050315] outline-none focus:border-[#0260bd] focus:ring-2 focus:ring-[#0260bd]/10"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-[#6b7280]" />
        </div>
    );
}

export default function ManufacturerCaseList({
    title,
    cases,
    assignedJobs,
    inProductionJobs,
    qualityCheckJobs,
    readyToShipJobs,
    shippedJobs,
}: Props) {
    if (title === 'Assigned Jobs' && assignedJobs) {
        return <AssignedJobsPage jobs={assignedJobs} />;
    }

    if (title === 'In Production' && inProductionJobs) {
        return <InProductionPage jobs={inProductionJobs} />;
    }

    if (title === 'Quality Check' && qualityCheckJobs) {
        return <QualityCheckPage jobs={qualityCheckJobs} />;
    }

    if (title === 'Ready To Ship' && readyToShipJobs) {
        return <ReadyToShipPage jobs={readyToShipJobs} />;
    }

    if (title === 'Shipped Orders' && shippedJobs) {
        return <ShippedOrdersPage jobs={shippedJobs} />;
    }

    return (
        <PortalPageShell title={title}>
            <PortalCaseTable cases={cases} />
        </PortalPageShell>
    );
}

function AssignedJobsPage({ jobs }: { jobs: AssignedJob[] }) {
    const [search, setSearch] = useState('');
    const [customerType, setCustomerType] = useState('All Customer Types');
    const [productType, setProductType] = useState('All Product Types');
    const [priority, setPriority] = useState('All Priorities');

    const visibleJobs = useMemo(() => {
        const term = search.trim().toLowerCase();

        return jobs.filter((job) => {
            const matchesSearch =
                term.length === 0 ||
                [
                    job.id,
                    job.customer,
                    job.type,
                    job.product,
                    job.material,
                ].some((value) => value.toLowerCase().includes(term));

            const matchesCustomerType =
                customerType === 'All Customer Types' ||
                job.type === customerType;

            const matchesProductType =
                productType === 'All Product Types' ||
                job.product === productType;

            const matchesPriority =
                priority === 'All Priorities' || job.priority === priority;

            return (
                matchesSearch &&
                matchesCustomerType &&
                matchesProductType &&
                matchesPriority
            );
        });
    }, [customerType, jobs, priority, productType, search]);

    return (
        <PortalLayout>
            <Head title="Assigned Jobs" />

            <div className="p-6 font-inter">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                            Assigned Jobs
                        </h1>
                        <p className="pt-1 text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                            Review and accept new manufacturing jobs
                        </p>
                    </div>

                    <div className="rounded-[10px] border border-[#e2e8f0] bg-white p-[17px]">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:gap-6">
                            <label className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[#6b7280]" />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search jobs..."
                                    className="h-[42px] w-full rounded-[10px] border border-[#e2e8f0] bg-[#fdfdfd] pl-11 text-base text-[#475569] outline-none placeholder:text-[#475569] focus:border-[#0260bd] focus:ring-2 focus:ring-[#0260bd]/10"
                                />
                            </label>

                            <FilterSelect
                                value={customerType}
                                onChange={setCustomerType}
                                options={[
                                    'All Customer Types',
                                    'Dentist',
                                    'Lab',
                                ]}
                            />
                            <FilterSelect
                                value={productType}
                                onChange={setProductType}
                                options={[
                                    'All Product Types',
                                    'Crown',
                                    'Bridge',
                                ]}
                            />
                            <FilterSelect
                                value={priority}
                                onChange={setPriority}
                                options={['All Priorities', 'High']}
                            />
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] border-collapse">
                                <thead>
                                    <tr className="bg-[#e2e8f0]">
                                        {[
                                            'Case ID',
                                            'Customer',
                                            'Type',
                                            'Product',
                                            'Material',
                                            'Due Date',
                                            'Priority',
                                            'Status',
                                            'Actions',
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className={cn(
                                                    'px-6 py-3 text-left text-sm font-semibold tracking-[-0.16px] text-[#475569]',
                                                    heading === 'Actions' &&
                                                        'text-center',
                                                )}
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleJobs.map((job) => (
                                        <tr
                                            key={job.id}
                                            className="border-t border-[#e2e8f0]"
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold tracking-[-0.16px] text-[#0260bd]">
                                                {job.id}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.customer}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.type}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.product}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.material}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.due_date}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold tracking-[-0.16px] text-[#ef4444]">
                                                {job.priority}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded px-1.5 py-0.5 text-[10px] leading-[15px] tracking-[-0.12px]',
                                                        assignedJobStatusClasses[
                                                            job.status_tone
                                                        ],
                                                    )}
                                                >
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-4 text-[#0260bd]">
                                                    <Link
                                                        href={assignedShow.url(
                                                            job.id,
                                                        )}
                                                        className="transition-opacity hover:opacity-70"
                                                        title="View job"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="transition-opacity hover:opacity-70"
                                                        title="Download files"
                                                    >
                                                        <Download className="size-4" />
                                                    </button>
                                                    {job.status ===
                                                        'Accepted' && (
                                                        <button
                                                            type="button"
                                                            className="text-[#f967a1] transition-opacity hover:opacity-70"
                                                            title="Start production"
                                                        >
                                                            <Play className="size-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {visibleJobs.length === 0 && (
                                        <tr className="border-t border-[#e2e8f0]">
                                            <td
                                                colSpan={9}
                                                className="px-6 py-10 text-center text-sm text-[#475569]"
                                            >
                                                No assigned jobs match these
                                                filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}

function InProductionPage({ jobs }: { jobs: InProductionJob[] }) {
    return (
        <PortalLayout>
            <Head title="In Production" />

            <div className="p-6 font-inter">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                            In Production
                        </h1>
                        <p className="pt-1 text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                            Jobs currently being manufactured
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] border-collapse">
                                <thead>
                                    <tr className="bg-[#e2e8f0]">
                                        {[
                                            'Case ID',
                                            'Customer',
                                            'Product',
                                            'Material',
                                            'Due Date',
                                            'Priority',
                                            'Actions',
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className={cn(
                                                    'px-6 py-3 text-left text-sm font-semibold tracking-[-0.16px] text-[#475569]',
                                                    heading === 'Actions' &&
                                                        'text-center',
                                                )}
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.map((job) => (
                                        <tr
                                            key={job.id}
                                            className="border-t border-[#e2e8f0]"
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold tracking-[-0.16px] text-[#0260bd]">
                                                {job.id}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.customer}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.product}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.material}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.due_date}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex rounded bg-[#fffbeb] px-[7px] py-1 text-xs leading-4 text-[#bb4d00]">
                                                    {job.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-4">
                                                    <Link
                                                        href={inProductionShow.url(
                                                            job.id,
                                                        )}
                                                        className="text-[#0260bd] transition-opacity hover:opacity-70"
                                                        title="View job"
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="text-[#f967a1] transition-opacity hover:opacity-70"
                                                        title="Move to quality check"
                                                    >
                                                        <Upload className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}

function QualityCheckPage({ jobs }: { jobs: QualityCheckJob[] }) {
    const jobDetailHref = (id: string): string =>
        `/manufacturer/quality-check/${encodeURIComponent(id)}`;

    return (
        <PortalLayout>
            <Head title="Quality Check" />

            <div className="p-6 font-inter">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                            Quality Check
                        </h1>
                        <p className="pt-1 text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                            Jobs awaiting quality control approval
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] border-collapse">
                                <thead>
                                    <tr className="bg-[#e2e8f0]">
                                        {[
                                            'Case ID',
                                            'Customer',
                                            'Product',
                                            'Material',
                                            'Due Date',
                                            'Priority',
                                            'Actions',
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className={cn(
                                                    'px-6 py-3 text-left text-sm font-semibold tracking-[-0.16px] text-[#475569]',
                                                    heading === 'Actions' &&
                                                        'text-center',
                                                )}
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.map((job) => (
                                        <tr
                                            key={job.id}
                                            className="border-t border-[#e2e8f0]"
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold tracking-[-0.16px]">
                                                <Link
                                                    href={jobDetailHref(job.id)}
                                                    className="text-[#0260bd] hover:underline"
                                                >
                                                    {job.id}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.customer}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.product}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.material}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.due_date}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex rounded bg-[#eff6ff] px-[7px] py-1 text-xs leading-4 text-[#0260bd]">
                                                    {job.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-4">
                                                    <Link
                                                        href={jobDetailHref(
                                                            job.id,
                                                        )}
                                                        className="text-[#0260bd] transition-opacity hover:opacity-70"
                                                        title="View job details"
                                                        aria-label={`View details for ${job.id}`}
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="text-[#16a34a] transition-opacity hover:opacity-70"
                                                        title="Mark ready to ship"
                                                    >
                                                        <CircleCheck className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-[#eab308] transition-opacity hover:opacity-70"
                                                        title="Return to production"
                                                    >
                                                        <Undo2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}

function ReadyToShipPage({ jobs }: { jobs: ReadyToShipJob[] }) {
    const jobDetailHref = (id: string): string =>
        `/manufacturer/ready-to-ship/${encodeURIComponent(id)}`;

    return (
        <PortalLayout>
            <Head title="Ready To Ship" />

            <div className="p-6 font-inter">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                            Ready To Ship
                        </h1>
                        <p className="pt-1 text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                            Jobs approved and ready for shipment
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] border-collapse">
                                <thead>
                                    <tr className="bg-[#e2e8f0]">
                                        {[
                                            'Case ID',
                                            'Customer',
                                            'Product',
                                            'Material',
                                            'Due Date',
                                            'Shipping Address',
                                            'Actions',
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className={cn(
                                                    'px-6 py-3 text-left text-sm font-semibold tracking-[-0.16px] text-[#475569]',
                                                    heading === 'Actions' &&
                                                        'text-center',
                                                )}
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.map((job) => (
                                        <tr
                                            key={job.id}
                                            className="border-t border-[#e2e8f0]"
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold tracking-[-0.16px]">
                                                <Link
                                                    href={jobDetailHref(job.id)}
                                                    className="text-[#0260bd] hover:underline"
                                                >
                                                    {job.id}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.customer}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.product}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.material}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.due_date}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.shipping_address}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-4">
                                                    <Link
                                                        href={jobDetailHref(
                                                            job.id,
                                                        )}
                                                        className="text-[#0260bd] transition-opacity hover:opacity-70"
                                                        title="View job details"
                                                        aria-label={`View details for ${job.id}`}
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        className="text-[#f967a1] transition-opacity hover:opacity-70"
                                                        title="Create shipment"
                                                    >
                                                        <Truck className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}

function ShippedOrdersPage({ jobs }: { jobs: ShippedJob[] }) {
    const jobDetailHref = (id: string): string =>
        `/manufacturer/shipped/${encodeURIComponent(id)}`;

    return (
        <PortalLayout>
            <Head title="Shipped Orders" />

            <div className="p-6 font-inter">
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                            Shipped Orders
                        </h1>
                        <p className="pt-1 text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                            Orders currently in transit
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] border-collapse">
                                <thead>
                                    <tr className="bg-[#e2e8f0]">
                                        {[
                                            'Case ID',
                                            'Customer',
                                            'Product',
                                            'Courier',
                                            'Tracking Number',
                                            'Est. Delivery',
                                            'Actions',
                                        ].map((heading) => (
                                            <th
                                                key={heading}
                                                className={cn(
                                                    'px-6 py-3 text-left text-sm font-semibold tracking-[-0.16px] text-[#475569]',
                                                    heading === 'Actions' &&
                                                        'text-center',
                                                )}
                                            >
                                                {heading}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobs.map((job) => (
                                        <tr
                                            key={job.id}
                                            className="border-t border-[#e2e8f0]"
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold tracking-[-0.16px]">
                                                <Link
                                                    href={jobDetailHref(job.id)}
                                                    className="text-[#0260bd] hover:underline"
                                                >
                                                    {job.id}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.customer}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.product}
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.courier}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium tracking-[-0.16px]">
                                                <a
                                                    href={`https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(job.tracking_number)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[#0260bd] hover:underline"
                                                >
                                                    {job.tracking_number}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 text-sm tracking-[-0.16px] text-[#050315]">
                                                {job.est_delivery}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-4">
                                                    <Link
                                                        href={jobDetailHref(
                                                            job.id,
                                                        )}
                                                        className="text-[#0260bd] transition-opacity hover:opacity-70"
                                                        title="View job details"
                                                        aria-label={`View details for ${job.id}`}
                                                    >
                                                        <Eye className="size-4" />
                                                    </Link>
                                                    <a
                                                        href={`https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(job.tracking_number)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[#f967a1] transition-opacity hover:opacity-70"
                                                        title="Track shipment"
                                                        aria-label={`Track shipment ${job.tracking_number}`}
                                                    >
                                                        <ExternalLink className="size-4" />
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
