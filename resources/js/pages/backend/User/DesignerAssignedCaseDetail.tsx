import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

import CaseFileSlotsPanel, {
    type CaseFileSlotItem,
} from '@/components/case-file-slots-panel';
import PortalLayout from '@/layouts/portal-layout';
import { portalAsset } from '@/lib/portal-role';
import { cn } from '@/lib/utils';

type TimelineItem = {
    label: string;
    date: string | null;
    complete: boolean;
};

type CaseFile = {
    name: string;
    meta: string;
    type: string;
    type_tone: 'stl' | 'zip' | 'photo' | 'pdf';
};

export type DesignerAssignedCaseDetail = {
    id: string;
    database_id: number;
    customer: string;
    product: string;
    client: string;
    assigned_date: string;
    due_date: string;
    due_urgent: boolean;
    priority: 'High' | 'Medium' | 'Low';
    status: string;
    status_tone:
        | 'in-design'
        | 'assigned'
        | 'revision'
        | 'downloaded'
        | 'submitted'
        | 'approved'
        | 'completed';
    material: string;
    shade: string;
    implant_system: string;
    files: CaseFile[];
    file_slots: CaseFileSlotItem[];
    timeline: TimelineItem[];
    source: string;
    back_url: string;
    back_label: string;
    can_upload: boolean;
    can_manage_files: boolean;
    files_heading: string;
    notes_heading: string;
    alert: {
        tone: 'warning' | 'info' | 'success';
        title: string;
        body: string;
    } | null;
    header_actions: Array<{
        label: string;
        variant: 'primary' | 'danger' | 'accent';
    }>;
    workflow: Array<{
        label: string;
        icon: string;
        state: 'enabled' | 'disabled' | 'muted';
        tone?: 'default' | 'accent';
    }>;
    uploaded_design_files: string[];
};

type Props = {
    caseDetail: DesignerAssignedCaseDetail;
};

const statusBadgeClasses: Record<
    DesignerAssignedCaseDetail['status_tone'],
    string
> = {
    'in-design': 'border-[#fee685] bg-[#fffbeb] text-[#bb4d00]',
    assigned: 'border-[#bedbff] bg-[#eff6ff] text-[#1447e6]',
    revision: 'border-[#ffccd3] bg-[#fff1f2] text-[#c70036]',
    downloaded: 'border-[#c6d2ff] bg-[#eef2ff] text-[#432dd7]',
    submitted: 'border-[#ddd6ff] bg-[#f5f3ff] text-[#7008e7]',
    approved: 'border-[#b9f8cf] bg-[#f0fdf4] text-[#008236]',
    completed: 'border-[#e5e7eb] bg-[#f3f4f6] text-[#6a7282]',
};

const priorityClasses: Record<DesignerAssignedCaseDetail['priority'], string> =
    {
        High: 'text-[#e7000b]',
        Medium: 'text-[#e17100]',
        Low: 'text-[#475569]',
    };

const fileTypeClasses: Record<CaseFile['type_tone'], string> = {
    stl: 'bg-[#eff6ff] text-[#0260bd]',
    zip: 'bg-[#e2e8f0] text-[#475569]',
    photo: 'bg-[#e2e8f0] text-[#007a55]',
    pdf: 'bg-[#e2e8f0] text-[#c10007]',
};

const alertClasses: Record<
    NonNullable<DesignerAssignedCaseDetail['alert']>['tone'],
    string
> = {
    warning: 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]',
    info: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1e40af]',
    success: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]',
};

const headerActionClasses: Record<
    DesignerAssignedCaseDetail['header_actions'][number]['variant'],
    string
> = {
    primary:
        'rounded-lg bg-[#0260bd] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#024f9c]',
    danger: 'rounded-lg border border-[#e7000b] bg-white px-3 py-1.5 text-xs font-medium text-[#e7000b] hover:bg-[#fef2f2]',
    accent: 'rounded-lg border border-[#f967a1] bg-white px-3 py-1.5 text-xs font-medium text-[#f967a1] hover:bg-[#fff1f5]',
};

const workflowButtonClasses: Record<
    DesignerAssignedCaseDetail['workflow'][number]['state'],
    string
> = {
    enabled:
        'flex w-full items-center gap-2.5 rounded border border-[#e5e7eb] bg-white px-[13px] py-[11px] text-left text-xs leading-4 font-medium text-[#364153] hover:bg-[#f8fafc]',
    disabled:
        'flex w-full items-center gap-2.5 rounded bg-[#f3f4f6] px-3 py-2.5 text-left text-xs leading-4 font-medium text-[#99a1af]',
    muted: 'flex w-full items-center gap-2.5 rounded border border-[#e5e7eb] bg-white px-[13px] py-[11px] text-left text-xs leading-4 font-medium text-[#d1d5dc]',
};

const workflowAccentClass =
    'flex w-full items-center gap-2.5 rounded bg-[#f967a1] px-3 py-2.5 text-left text-xs leading-4 font-medium text-white hover:bg-[#e85590]';

function workflowButtonClass(
    action: DesignerAssignedCaseDetail['workflow'][number],
): string {
    if (action.state === 'enabled' && action.tone === 'accent') {
        return workflowAccentClass;
    }

    return workflowButtonClasses[action.state];
}

const noteFields = [
    { key: 'design', label: 'Design Notes', placeholder: 'Add design notes…' },
    {
        key: 'manufacturing',
        label: 'Manufacturing Notes',
        placeholder: 'Add manufacturing notes…',
    },
    {
        key: 'customer',
        label: 'Customer Notes',
        placeholder: 'Add customer notes…',
    },
    {
        key: 'internal',
        label: 'Internal Notes',
        placeholder: 'Add internal notes…',
    },
] as const;

function Icon({ name, size }: { name: string; size: number }) {
    return (
        <span
            className="relative block shrink-0 overflow-hidden"
            style={{ width: size, height: size }}
        >
            <img src={portalAsset(name)} alt="" className="size-full" />
        </span>
    );
}

function PrescriptionRow({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div>
            <p className="font-mono text-[10px] leading-[14.286px] text-[#99a1af]">
                {label}
            </p>
            <p
                className={cn(
                    'pt-0.5 text-xs leading-4 text-[#1e2939]',
                    valueClassName,
                )}
            >
                {value}
            </p>
        </div>
    );
}

export default function DesignerAssignedCaseDetail({ caseDetail }: Props) {
    const [notes, setNotes] = useState({
        design: '',
        manufacturing: '',
        customer: '',
        internal: '',
    });

    return (
        <PortalLayout>
            <Head title={`${caseDetail.id} Case Details`} />

            <div className="flex flex-col gap-6 font-inter">
                <div className="flex h-14 items-center gap-4 border-b border-[#e2e8f0] bg-white px-6">
                    <Link
                        href={caseDetail.back_url}
                        className="inline-flex items-center gap-1.5 text-xs leading-4 font-medium text-[#475569] hover:text-[#1e2939]"
                    >
                        <Icon name="case-detail-back.svg" size={14} />
                        {caseDetail.back_label}
                    </Link>

                    <span className="h-4 w-px bg-[#e5e7eb]" />

                    <span className="font-mono text-sm leading-5 font-semibold text-[#050315]">
                        {caseDetail.id}
                    </span>
                    <span className="text-base leading-6 text-[#d1d5dc]">
                        —
                    </span>
                    <span className="text-sm leading-5 text-[#475569]">
                        {caseDetail.product}
                    </span>
                    <span className="text-xs leading-4 text-[#f967a1]">
                        {caseDetail.client}
                    </span>

                    <div className="ml-auto flex items-center gap-3">
                        <span
                            className={cn(
                                'rounded border px-[13px] py-[7px] text-[10px] leading-3 font-medium',
                                statusBadgeClasses[caseDetail.status_tone],
                            )}
                        >
                            {caseDetail.status}
                        </span>
                        <span
                            className={cn(
                                'text-xs leading-4 font-semibold tracking-[-0.12px]',
                                priorityClasses[caseDetail.priority],
                            )}
                        >
                            {caseDetail.priority} Priority
                        </span>
                        {caseDetail.header_actions.map((action) => (
                            <button
                                key={action.label}
                                type="button"
                                className={headerActionClasses[action.variant]}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>

                {caseDetail.alert ? (
                    <div className="px-6">
                        <div
                            className={cn(
                                'rounded-lg border px-4 py-3',
                                alertClasses[caseDetail.alert.tone],
                            )}
                        >
                            <p className="text-xs leading-4 font-semibold">
                                {caseDetail.alert.title}
                            </p>
                            <p className="pt-0.5 text-xs leading-4">
                                {caseDetail.alert.body}
                            </p>
                        </div>
                    </div>
                ) : null}

                <div className="flex items-stretch px-6 pb-6">
                    <aside className="flex w-[248px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
                        <div className="border-b border-[#e5e7eb] px-5 py-3">
                            <h2 className="font-mono text-[10px] leading-[15px] font-semibold tracking-[0.5px] text-[#6a7282] uppercase">
                                Prescription
                            </h2>
                        </div>

                        <div className="flex flex-col px-5 py-4">
                            <PrescriptionRow
                                label="Customer Type"
                                value={caseDetail.customer}
                            />
                            <div className="pt-4">
                                <PrescriptionRow
                                    label="Dentist / Lab"
                                    value={caseDetail.client}
                                />
                            </div>

                            <div className="mt-4 border-t border-[#e5e7eb] pt-[17px]">
                                <p className="font-mono text-[10px] leading-[14.286px] tracking-[0.5px] text-[#99a1af] uppercase">
                                    Case Details
                                </p>
                                <div className="flex flex-col gap-3 pt-3">
                                    <PrescriptionRow
                                        label="Case ID"
                                        value={caseDetail.id}
                                        valueClassName="font-mono"
                                    />
                                    <PrescriptionRow
                                        label="Product"
                                        value={caseDetail.product}
                                    />
                                    <PrescriptionRow
                                        label="Material"
                                        value={caseDetail.material}
                                    />
                                    <PrescriptionRow
                                        label="Shade"
                                        value={caseDetail.shade}
                                        valueClassName="font-mono"
                                    />
                                    <PrescriptionRow
                                        label="Implant System"
                                        value={caseDetail.implant_system}
                                    />
                                    <PrescriptionRow
                                        label="Due Date"
                                        value={caseDetail.due_date}
                                        valueClassName={cn(
                                            'font-mono',
                                            caseDetail.due_urgent &&
                                                'text-[#e7000b]',
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 border-t border-[#e5e7eb] pt-[17px]">
                                <p className="font-mono text-[10px] leading-[14.286px] tracking-[0.5px] text-[#99a1af] uppercase">
                                    Timeline
                                </p>
                                <div className="flex flex-col gap-2.5 pt-3">
                                    {caseDetail.timeline.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex items-start gap-2.5"
                                        >
                                            <span
                                                className={cn(
                                                    'mt-0.5 size-3 shrink-0 rounded-full border-2',
                                                    item.complete
                                                        ? 'border-[#22c55e] bg-[#22c55e]'
                                                        : 'border-[#d1d5dc] bg-white',
                                                )}
                                            />
                                            <div>
                                                <p
                                                    className={cn(
                                                        'text-xs leading-4',
                                                        item.complete
                                                            ? 'text-[#1e2939]'
                                                            : 'text-[#99a1af]',
                                                    )}
                                                >
                                                    {item.label}
                                                </p>
                                                {item.date ? (
                                                    <p className="font-mono text-[10px] leading-[14.286px] text-[#99a1af]">
                                                        {item.date}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </aside>

                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="px-4">
                            <section className="rounded-lg border border-[#e2e8f0] bg-white">
                                <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-3">
                                    <h2 className="text-xs leading-4 font-semibold tracking-[0.3px] text-[#1e2939] uppercase">
                                        {caseDetail.files_heading}
                                    </h2>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 rounded bg-[#0260bd] px-3 py-2 text-xs leading-4 font-medium text-white hover:bg-[#024f9c]"
                                    >
                                        <Icon
                                            name="case-detail-batch-download.svg"
                                            size={12}
                                        />
                                        Batch Download
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2 p-4">
                                    {caseDetail.files.map((file) => (
                                        <div
                                            key={file.name}
                                            className="flex items-center gap-3 rounded border border-[#e2e8f0] bg-white px-[17px] py-[11px]"
                                        >
                                            <span
                                                className={cn(
                                                    'flex size-9 shrink-0 items-center justify-center rounded font-mono text-[10px] leading-[15px] font-bold',
                                                    fileTypeClasses[
                                                        file.type_tone
                                                    ],
                                                )}
                                            >
                                                {file.type}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs leading-4 font-medium text-[#050315]">
                                                    {file.name}
                                                </p>
                                                <p className="font-mono text-[10px] leading-[15px] text-[#475569]">
                                                    {file.meta}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1.5 text-xs leading-4 font-medium text-[#0260bd] hover:text-[#024f9c]"
                                            >
                                                <Icon
                                                    name="case-detail-download.svg"
                                                    size={14}
                                                />
                                                Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="p-4">
                            <section className="rounded border border-[#e2e8f0] bg-white">
                                <div className="border-b border-[#e5e7eb] px-4 py-3">
                                    <h2 className="text-xs leading-4 font-semibold text-[#050315]">
                                        Case File Fields
                                    </h2>
                                    <p className="pt-0.5 text-[10px] leading-[15px] text-[#475569]">
                                        {caseDetail.can_manage_files
                                            ? 'Fill requested fields or add your own upload fields.'
                                            : 'Uploads are closed for this case status.'}
                                    </p>
                                </div>
                                <div className="p-4">
                                    {caseDetail.can_manage_files ? (
                                        <CaseFileSlotsPanel
                                            caseDatabaseId={
                                                caseDetail.database_id
                                            }
                                            canManage
                                            slots={caseDetail.file_slots ?? []}
                                        />
                                    ) : (
                                        <div className="rounded-[6px] border border-[#e5e7eb] bg-[#f8fafc] px-4 py-6 text-center text-xs leading-4 text-[#475569]">
                                            Final files are available above.
                                            Resubmit the case if a follow-up
                                            design is required.
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="px-4 pb-4">
                            <section className="rounded border border-[#e2e8f0] bg-white">
                                <div className="border-b border-[#e2e8f0] px-4 py-3">
                                    <h2 className="text-xs leading-4 font-semibold text-[#1e2939]">
                                        {caseDetail.notes_heading}
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 gap-x-3 gap-y-3 p-4 md:grid-cols-2">
                                    {noteFields.map((field) => (
                                        <label
                                            key={field.key}
                                            className="flex flex-col"
                                        >
                                            <span className="pb-1 text-[10px] leading-3 font-medium text-[#475569]">
                                                {field.label}
                                            </span>
                                            <textarea
                                                value={notes[field.key]}
                                                onChange={(event) =>
                                                    setNotes((current) => ({
                                                        ...current,
                                                        [field.key]:
                                                            event.target.value,
                                                    }))
                                                }
                                                placeholder={field.placeholder}
                                                className="h-[72px] resize-none rounded border border-[#e2e8f0] p-[11px] text-xs leading-4 text-[#1e2939] outline-none placeholder:text-[#e2e8f0]"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>

                    <aside className="flex w-[208px] shrink-0 flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
                        <div className="border-b border-[#e5e7eb] px-5 py-3">
                            <h2 className="font-mono text-[10px] leading-[15px] font-semibold tracking-[0.5px] text-[#6a7282] uppercase">
                                Workflow Actions
                            </h2>
                        </div>

                        <div className="flex flex-col p-4">
                            {caseDetail.workflow.map((action, index) => (
                                <button
                                    key={action.label}
                                    type="button"
                                    disabled={action.state !== 'enabled'}
                                    className={cn(
                                        index > 0 && 'mt-2',
                                        workflowButtonClass(action),
                                    )}
                                >
                                    <Icon name={action.icon} size={14} />
                                    {action.label}
                                </button>
                            ))}

                            <div className="mt-2 border-t border-[#e5e7eb] pt-[13px]">
                                <p className="font-mono text-[10px] leading-[15px] tracking-[0.5px] text-[#99a1af] uppercase">
                                    Current Status
                                </p>
                                <div
                                    className={cn(
                                        'mt-2 flex w-full items-center justify-center rounded border px-[11px] py-[7px] text-center text-[10px] leading-3 font-medium',
                                        statusBadgeClasses[
                                            caseDetail.status_tone
                                        ],
                                    )}
                                >
                                    {caseDetail.status}
                                </div>
                            </div>

                            <div className="mt-2 border-t border-[#e5e7eb] pt-[13px]">
                                <p className="font-mono text-[10px] leading-[15px] tracking-[0.5px] text-[#99a1af] uppercase">
                                    More Actions
                                </p>
                                <button
                                    type="button"
                                    className="mt-1.5 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs leading-4 font-medium text-[#6a7282] hover:bg-[#f8fafc]"
                                >
                                    <Icon
                                        name="case-detail-more-timeline.svg"
                                        size={14}
                                    />
                                    View Full Timeline
                                </button>
                                <button
                                    type="button"
                                    className="mt-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs leading-4 font-medium text-[#6a7282] hover:bg-[#f8fafc]"
                                >
                                    <Icon
                                        name="case-detail-more-note.svg"
                                        size={14}
                                    />
                                    Add Internal Note
                                </button>
                                <button
                                    type="button"
                                    className="mt-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs leading-4 font-medium text-[#6a7282] hover:bg-[#f8fafc]"
                                >
                                    <Icon
                                        name="case-detail-more-download.svg"
                                        size={14}
                                    />
                                    Download Submitted
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </PortalLayout>
    );
}
