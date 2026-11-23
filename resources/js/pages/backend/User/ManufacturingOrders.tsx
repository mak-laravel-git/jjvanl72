import { Head, Link } from '@inertiajs/react';

import PortalLayout from '@/layouts/portal-layout';
import { cn } from '@/lib/utils';
import { show } from '@/routes/cases/manufacturing';

type MfgCase = {
    id: string;
    product: string;
    reference: string;
    patient: string;
    status: string;
    status_tone: string;
    files_label: string;
    files_ok: boolean;
    updated: string;
};

type Props = {
    title: string;
    cases: MfgCase[];
};

const statusClasses: Record<string, string> = {
    green: 'bg-[#dcfce7] text-[#15803d]',
    blue: 'bg-[#dbeafe] text-[#0260bd]',
    orange: 'bg-[#ffedd5] text-[#c2410c]',
    purple: 'bg-[#f3e8ff] text-[#7e22ce]',
    pink: 'bg-[rgba(249,103,161,0.12)] text-[#f967a1]',
    gray: 'bg-[#f3f4f6] text-[#475569]',
};

const headers = [
    'Case',
    'Product',
    'Reference',
    'Patient',
    'Status',
    'Files',
    'Updated',
    'Actions',
] as const;

export default function ManufacturingOrders({ title, cases }: Props) {
    return (
        <PortalLayout>
            <Head title={title} />

            <div className="p-8 font-inter">
                <div className="flex flex-col gap-6">
                    <h1 className="text-[32px] leading-9.5 font-semibold tracking-[-0.2px] text-[#050315]">
                        {title}
                    </h1>

                    <div className="overflow-hidden rounded-lg border border-[#f3f4f6] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                        <div className="overflow-x-auto">
                            <table className="responsive-cards w-full min-w-[900px] border-collapse">
                                <thead>
                                    <tr className="bg-[#f9fafb]">
                                        {headers.map((h) => (
                                            <th
                                                key={h}
                                                className={cn(
                                                    'px-5 py-4 text-left text-xs font-semibold tracking-[0.4px] text-[#64748b] uppercase',
                                                    h === 'Actions' &&
                                                        'text-right',
                                                )}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {cases.map((c, i) => (
                                        <tr
                                            key={c.id}
                                            className={cn(
                                                'border-t',
                                                i === 0
                                                    ? 'border-[#e5e7eb]'
                                                    : 'border-[#f3f4f6]',
                                            )}
                                        >
                                            <td
                                                data-label="Case"
                                                className="px-5 py-4 text-sm font-semibold text-[#050315]"
                                            >
                                                {c.id}
                                            </td>
                                            <td
                                                data-label="Product"
                                                className="px-5 py-4 text-sm text-[#334155]"
                                            >
                                                {c.product}
                                            </td>
                                            <td
                                                data-label="Reference"
                                                className="px-5 py-4 text-sm text-[#334155]"
                                            >
                                                {c.reference}
                                            </td>
                                            <td
                                                data-label="Patient"
                                                className="px-5 py-4 text-sm text-[#334155]"
                                            >
                                                {c.patient || '—'}
                                            </td>
                                            <td
                                                data-label="Status"
                                                className="px-5 py-4"
                                            >
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tracking-[-0.12px]',
                                                        statusClasses[
                                                            c.status_tone
                                                        ] ?? statusClasses.gray,
                                                    )}
                                                >
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td
                                                data-label="Files"
                                                className="px-5 py-4"
                                            >
                                                <span
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-[-0.12px]',
                                                        c.files_ok
                                                            ? 'bg-[#dcfce7] text-[#15803d]'
                                                            : 'bg-[#ffedd5] text-[#c2410c]',
                                                    )}
                                                >
                                                    {c.files_label}
                                                    {c.files_ok && (
                                                        <span className="text-[10px]">
                                                            ✓
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td
                                                data-label="Updated"
                                                className="px-5 py-4 text-sm text-[#64748b]"
                                            >
                                                {c.updated}
                                            </td>
                                            <td
                                                data-label="Actions"
                                                className="px-5 py-4 text-right"
                                            >
                                                <Link
                                                    href={show.url(c.id)}
                                                    className="inline-flex rounded-md border border-[#e2e8f0] bg-white px-4 py-1.5 text-xs font-semibold text-[#334155] transition hover:bg-[#f8fafc]"
                                                >
                                                    Open
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {cases.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="border-t border-[#e5e7eb] px-5 py-12 text-center text-sm text-[#475569]"
                                            >
                                                No manufacturing orders.
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
