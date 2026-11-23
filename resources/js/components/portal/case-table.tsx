import { Link } from '@inertiajs/react';

import { portalAsset } from '@/lib/portal-role';
import { cn } from '@/lib/utils';

export type PortalCaseRow = {
    id: string;
    databaseId?: number;
    patient: string;
    product: string;
    status: string;
    status_tone: string;
    submission_date: string | null;
    due_date: string | null;
    manufacturing_type: string;
    actions: string[];
};

const statusClasses: Record<string, string> = {
    gray: 'bg-[#f3f4f6] text-[#475569]',
    blue: 'bg-[#dbeafe] text-[#0260bd]',
    completed: 'bg-[rgba(2,96,189,0.1)] text-[#0260bd]',
    orange: 'bg-[#ffedd5] text-[#c2410c]',
    red: 'bg-[#fee2e2] text-[#b91c1c]',
    purple: 'bg-[#f3e8ff] text-[#7e22ce]',
    sky: 'bg-[#e0f2fe] text-[#0369a1]',
    green: 'bg-[#dcfce7] text-[#15803d]',
    pink: 'bg-[rgba(249,103,161,0.12)] text-[#f967a1]',
};

const actionIcons: Record<string, string> = {
    view: portalAsset('case-action-view.svg'),
    download: portalAsset('case-action-download.svg'),
    approve: portalAsset('case-action-approve.svg'),
    submit: portalAsset('case-action-submit.svg'),
    edit: portalAsset('case-action-edit.svg'),
    duplicate: portalAsset('case-action-duplicate.svg'),
    delete: portalAsset('case-action-delete.svg'),
};

export function PortalStatusBadge({
    status,
    tone,
}: {
    status: string;
    tone: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2.5 py-1 text-xs tracking-[-0.12px]',
                tone === 'completed' ? 'font-medium' : 'font-semibold',
                statusClasses[tone] ?? statusClasses.gray,
            )}
        >
            {status}
        </span>
    );
}

function CaseActionIcon({ action }: { action: string }) {
    return (
        <span className="relative block size-5 overflow-hidden">
            <img
                src={actionIcons[action] ?? portalAsset('case-action-view.svg')}
                alt=""
                className="size-full"
            />
        </span>
    );
}

function CaseActions({
    actions,
    row,
    actionHrefs,
}: {
    actions: string[];
    row: PortalCaseRow;
    actionHrefs?: Partial<Record<string, (row: PortalCaseRow) => string>>;
}) {
    return (
        <div className="flex items-center justify-end gap-4">
            {actions.map((action) => {
                const href = actionHrefs?.[action]?.(row);

                if (href) {
                    return (
                        <Link
                            key={action}
                            href={href}
                            title={action === 'edit' ? 'Load' : action}
                            className="transition-opacity hover:opacity-70"
                        >
                            <CaseActionIcon action={action} />
                        </Link>
                    );
                }

                return (
                    <button
                        key={action}
                        type="button"
                        title={action}
                        className="transition-opacity hover:opacity-70"
                    >
                        <CaseActionIcon action={action} />
                    </button>
                );
            })}
        </div>
    );
}

type PortalCaseTableProps = {
    cases: PortalCaseRow[];
    actionHrefs?: Partial<Record<string, (row: PortalCaseRow) => string>>;
};

const tableHeaders = [
    { label: 'Case ID', align: 'left' },
    { label: 'Patient Reference', align: 'left' },
    { label: 'Product', align: 'left' },
    { label: 'Status', align: 'center' },
    { label: 'Submission Date', align: 'left' },
    { label: 'Due Date', align: 'left' },
    { label: 'Manufacturing Type', align: 'left' },
    { label: 'Actions', align: 'right' },
] as const;

export function PortalCaseTable({ cases, actionHrefs }: PortalCaseTableProps) {
    return (
        <div className="overflow-hidden rounded-lg border border-[#f3f4f6] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="overflow-x-auto">
                <table className="responsive-cards w-full min-w-[1100px] border-collapse">
                    <thead>
                        <tr className="bg-[#f9fafb]">
                            {tableHeaders.map((heading) => (
                                <th
                                    key={heading.label}
                                    className={cn(
                                        'px-6 py-5 text-sm font-semibold tracking-[-0.16px] text-[#475569] uppercase',
                                        heading.align === 'right' &&
                                            'text-right',
                                        heading.align === 'center' &&
                                            'text-center',
                                        heading.align === 'left' && 'text-left',
                                    )}
                                >
                                    {heading.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {cases.map((item, index) => (
                            <tr
                                key={item.id}
                                className={cn(
                                    index === 0
                                        ? 'border-t border-[#e5e7eb]'
                                        : 'border-t border-[#f3f4f6]',
                                )}
                            >
                                <td
                                    data-label="Case ID"
                                    className="px-6 py-5 text-sm font-semibold tracking-[-0.16px] text-[#050315]"
                                >
                                    {item.id}
                                </td>
                                <td
                                    data-label="Patient Reference"
                                    className="px-6 py-5 text-sm tracking-[-0.16px] text-[#050315]"
                                >
                                    {item.patient}
                                </td>
                                <td
                                    data-label="Product"
                                    className="px-6 py-5 text-sm tracking-[-0.16px] text-[#050315]"
                                >
                                    {item.product}
                                </td>
                                <td
                                    data-label="Status"
                                    className="px-6 py-5 text-center"
                                >
                                    <PortalStatusBadge
                                        status={item.status}
                                        tone={item.status_tone}
                                    />
                                </td>
                                <td
                                    data-label="Submission Date"
                                    className="px-6 py-5 text-sm tracking-[-0.16px] text-[#475569]"
                                >
                                    {item.submission_date ?? '-'}
                                </td>
                                <td
                                    data-label="Due Date"
                                    className="px-6 py-5 text-sm tracking-[-0.16px] text-[#475569]"
                                >
                                    {item.due_date ?? '-'}
                                </td>
                                <td
                                    data-label="Manufacturing Type"
                                    className="px-6 py-5 text-sm tracking-[-0.16px] text-[#050315]"
                                >
                                    {item.manufacturing_type}
                                </td>
                                <td data-label="Actions" className="px-6 py-5">
                                    <CaseActions
                                        actions={item.actions}
                                        row={item}
                                        actionHrefs={actionHrefs}
                                    />
                                </td>
                            </tr>
                        ))}
                        {cases.length === 0 && (
                            <tr>
                                <td
                                    colSpan={8}
                                    className="border-t border-[#e5e7eb] px-6 py-12 text-center text-sm text-[#475569]"
                                >
                                    No cases to show.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
