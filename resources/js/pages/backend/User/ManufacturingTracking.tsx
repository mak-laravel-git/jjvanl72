import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import PortalLayout from '@/layouts/portal-layout';
import { cn } from '@/lib/utils';
import { manufacturing } from '@/routes/cases';

type PipelineStep = { label: string; done: boolean };
type ToothSpec = {
    tooth_number: number;
    action: string;
    material: string;
    contour: string;
    shade: string;
    price: number;
};
type FileEntry = { name: string; type: string; size: string };
type DesignFile = { name: string; type: string; size: string };

type Tracking = {
    id: string;
    product: string;
    reference: string;
    patient: string;
    status: string;
    status_tone: string;
    pipeline: PipelineStep[];
    client: string;
    office: string;
    customer: string;
    service: string;
    case_approval: string;
    header_shade: string;
    scan_mode: string;
    source_scanner: string;
    due_date: string;
    teeth: ToothSpec[];
    design_output: DesignFile[];
    order_total: number;
    payment_method: string;
    files: FileEntry[];
    files_complete: boolean;
    messages: { sender: string; text: string; time: string }[];
    event_log_count: number;
    carrier: string;
    tracking_number: string;
};

type Props = { tracking: Tracking; backUrl?: string };

const TOOTH_POSITIONS: Record<number, { x: number; y: number }> = {
    18: { x: 30, y: 150 },
    17: { x: 24, y: 125 },
    16: { x: 20, y: 100 },
    15: { x: 26, y: 78 },
    14: { x: 38, y: 58 },
    13: { x: 56, y: 42 },
    12: { x: 78, y: 30 },
    11: { x: 104, y: 24 },
    21: { x: 134, y: 24 },
    22: { x: 160, y: 30 },
    23: { x: 182, y: 42 },
    24: { x: 200, y: 58 },
    25: { x: 212, y: 78 },
    26: { x: 218, y: 100 },
    27: { x: 214, y: 125 },
    28: { x: 208, y: 150 },
    38: { x: 208, y: 200 },
    37: { x: 214, y: 225 },
    36: { x: 218, y: 250 },
    35: { x: 212, y: 272 },
    34: { x: 200, y: 292 },
    33: { x: 182, y: 308 },
    32: { x: 160, y: 320 },
    31: { x: 134, y: 326 },
    41: { x: 104, y: 326 },
    42: { x: 78, y: 320 },
    43: { x: 56, y: 308 },
    44: { x: 38, y: 292 },
    45: { x: 26, y: 272 },
    46: { x: 20, y: 250 },
    47: { x: 24, y: 225 },
    48: { x: 30, y: 200 },
};

const ALL_TEETH = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33,
    34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48,
];

const STAGE_COLORS: Record<number, { bg: string; label: string }> = {
    1: { bg: '#f97316', label: 'Stage 1 · Action' },
    2: { bg: '#8b5cf6', label: 'Stage 2 · Material' },
    3: { bg: '#ec4899', label: 'Stage 3 · Options' },
    4: { bg: '#3b82f6', label: 'Stage 4 · Shade' },
};

const statusClasses: Record<string, string> = {
    green: 'bg-[#dcfce7] text-[#15803d]',
    blue: 'bg-[#dbeafe] text-[#0260bd]',
    orange: 'bg-[#ffedd5] text-[#c2410c]',
    purple: 'bg-[#f3e8ff] text-[#7e22ce]',
    pink: 'bg-[rgba(249,103,161,0.12)] text-[#f967a1]',
    gray: 'bg-[#f3f4f6] text-[#475569]',
};

const labelCls =
    'text-[10px] font-bold tracking-[0.5px] text-[#64748b] uppercase';
const valCls = 'text-sm text-[#1e293b]';

function InfoField({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className={labelCls}>{label}</span>
            <span className={valCls}>{value || '—'}</span>
        </div>
    );
}

function SectionCard({
    title,
    children,
    className,
}: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-lg border border-[#e2e8f0] bg-white',
                className,
            )}
        >
            <div className="border-b border-[#e2e8f0] px-5 py-3.5">
                <h3 className="text-sm font-bold text-[#0f172a]">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export default function ManufacturingTracking({ tracking, backUrl }: Props) {
    const t = tracking;
    const selectedTeeth = new Set(t.teeth.map((x) => x.tooth_number));
    const [message, setMessage] = useState('');
    const [logOpen, setLogOpen] = useState(false);

    const pipelineDoneCount = t.pipeline.filter((s) => s.done).length;

    return (
        <PortalLayout>
            <Head title="Manufacturing Tracking" />

            <div className="bg-[#fdfdfd] p-8 font-inter">
                <div className="flex flex-col gap-6">
                    {/* Back + Title */}
                    <div className="flex items-start gap-3">
                        <Link
                            href={backUrl ?? manufacturing.url()}
                            className="mt-1 text-[#475569] transition hover:text-[#1e293b]"
                        >
                            <ArrowLeft className="size-5" />
                        </Link>
                        <div className="flex flex-col gap-0.5">
                            <h1 className="text-2xl font-semibold tracking-[-0.15px] text-[#050315]">
                                Manufacturing Tracking
                            </h1>
                            <p className="text-sm text-[#f967a1]">
                                {t.id} • {t.patient || t.reference}
                            </p>
                        </div>
                    </div>

                    {/* Case ID + Status + Product */}
                    <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-[#050315]">
                            {t.id}
                        </span>
                        <span
                            className={cn(
                                'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                statusClasses[t.status_tone] ??
                                    statusClasses.gray,
                            )}
                        >
                            {t.status}
                        </span>
                        <span className="text-sm text-[#475569]">
                            {t.product}
                        </span>
                    </div>

                    {/* Pipeline */}
                    <div className="rounded-lg border border-[#e2e8f0] bg-white px-6 py-5">
                        <div className="flex items-center gap-0">
                            {t.pipeline.map((step, i) => {
                                const isLast = i === t.pipeline.length - 1;
                                return (
                                    <div
                                        key={step.label}
                                        className="flex items-center"
                                    >
                                        <span
                                            className={cn(
                                                'inline-flex rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition',
                                                step.done
                                                    ? 'bg-[#0260bd] text-white'
                                                    : 'border border-[#e2e8f0] bg-white text-[#94a3b8]',
                                            )}
                                        >
                                            {step.label}
                                        </span>
                                        {!isLast && (
                                            <div
                                                className={cn(
                                                    'mx-0.5 h-0.5 w-4',
                                                    i < pipelineDoneCount - 1
                                                        ? 'bg-[#0260bd]'
                                                        : 'bg-[#e2e8f0]',
                                                )}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Info grid */}
                    <div className="rounded-lg border border-[#e2e8f0] bg-white p-6">
                        <div className="grid grid-cols-5 gap-x-8 gap-y-5">
                            <InfoField
                                label="CLIENT (YOU)"
                                value={`${t.reference} · rdf`}
                            />
                            <InfoField label="PATIENT" value={t.patient} />
                            <InfoField
                                label="OFFICE / END CLIENT"
                                value={t.office}
                            />
                            <InfoField label="CUSTOMER" value={t.customer} />
                            <div />
                            <InfoField label="SERVICE" value={t.service} />
                            <InfoField
                                label="CASE APPROVAL"
                                value={t.case_approval}
                            />
                            <InfoField
                                label="HEADER SHADE"
                                value={t.header_shade}
                            />
                            <InfoField label="SCAN MODE" value={t.scan_mode} />
                            <div />
                            <InfoField
                                label="SOURCE SCANNER"
                                value={t.source_scanner}
                            />
                            <InfoField label="DUE DATE" value={t.due_date} />
                        </div>
                    </div>

                    {/* Main content: 3 columns */}
                    <div className="grid grid-cols-12 gap-5">
                        {/* Left: Indication & Materials */}
                        <div className="col-span-5">
                            <SectionCard title="Indication & Materials">
                                <div className="flex items-center justify-center">
                                    <div className="relative h-[360px] w-[250px]">
                                        {ALL_TEETH.map((num) => {
                                            const pos = TOOTH_POSITIONS[num];
                                            if (!pos) return null;
                                            const spec = t.teeth.find(
                                                (x) => x.tooth_number === num,
                                            );
                                            const isSelected =
                                                selectedTeeth.has(num);
                                            const stageColor = spec
                                                ? '#0260bd'
                                                : undefined;
                                            return (
                                                <div
                                                    key={num}
                                                    className={cn(
                                                        'absolute flex size-7 items-center justify-center rounded-full text-[10px] font-bold',
                                                        isSelected
                                                            ? 'text-white shadow-md'
                                                            : 'border border-[#d1d5db] bg-white text-[#9ca3af]',
                                                    )}
                                                    style={{
                                                        left: pos.x,
                                                        top: pos.y,
                                                        backgroundColor:
                                                            isSelected
                                                                ? stageColor
                                                                : undefined,
                                                    }}
                                                >
                                                    {num}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                {/* Legend */}
                                <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#f1f5f9] pt-4">
                                    {Object.entries(STAGE_COLORS).map(
                                        ([key, { bg, label }]) => (
                                            <div
                                                key={key}
                                                className="flex items-center gap-1.5"
                                            >
                                                <span
                                                    className="size-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor: bg,
                                                    }}
                                                />
                                                <span className="text-[10px] text-[#64748b]">
                                                    {label}
                                                </span>
                                            </div>
                                        ),
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-full bg-[#ef4444]" />
                                        <span className="text-[10px] text-[#64748b]">
                                            Crown · Terminal
                                        </span>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* Middle: Prescription */}
                        <div className="col-span-3">
                            <SectionCard title="Prescription">
                                <div className="flex flex-col gap-4">
                                    {t.teeth.map((tooth) => (
                                        <div
                                            key={tooth.tooth_number}
                                            className="flex items-start justify-between"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm font-semibold text-[#1e293b]">
                                                    Tooth {tooth.tooth_number}
                                                </p>
                                                <p className="text-xs text-[#64748b]">
                                                    {tooth.material} · Shade{' '}
                                                    {tooth.shade}
                                                </p>
                                                <p className="text-xs text-[#64748b]">
                                                    {tooth.contour}
                                                </p>
                                            </div>
                                            <span className="text-sm font-medium text-[#0260bd]">
                                                {tooth.action}
                                            </span>
                                        </div>
                                    ))}
                                    {t.teeth.length === 0 && (
                                        <p className="text-sm text-[#94a3b8]">
                                            No teeth specified.
                                        </p>
                                    )}
                                </div>
                            </SectionCard>
                        </div>

                        {/* Right column */}
                        <div className="col-span-4 flex flex-col gap-5">
                            {/* Design output */}
                            <SectionCard title="Design output">
                                <div className="flex flex-col gap-3">
                                    {t.design_output.map((f) => (
                                        <div
                                            key={f.name}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-[#1e293b]">
                                                    {f.name}
                                                </span>
                                                <span className="text-xs text-[#94a3b8]">
                                                    {f.type} · {f.size}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="text-xs font-medium text-[#0260bd] hover:underline"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>

                            {/* Orders & invoices */}
                            <SectionCard title="Orders & invoices">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[#475569]">
                                            Order (submit) · {t.payment_method}
                                        </span>
                                        <span className="text-sm font-semibold text-[#1e293b]">
                                            ${t.order_total.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-[#f1f5f9] pt-3">
                                        <span className="text-sm font-semibold text-[#1e293b]">
                                            Case total
                                        </span>
                                        <span className="text-sm font-bold text-[#1e293b]">
                                            ${t.order_total.toFixed(2)}
                                        </span>
                                    </div>
                                    {t.carrier !== '-' && (
                                        <div className="flex items-center gap-2 pt-1 text-xs text-[#0260bd]">
                                            <span>{t.status}</span>
                                            <span>FedEx</span>
                                            <span className="text-[#64748b]">
                                                {t.tracking_number}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </SectionCard>

                            {/* Messages */}
                            <SectionCard title="Messages">
                                <div className="flex flex-col gap-4">
                                    {t.messages.length === 0 && (
                                        <p className="text-sm text-[#94a3b8]">
                                            No messages yet.
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            placeholder="Message the case thread..."
                                            value={message}
                                            onChange={(e) =>
                                                setMessage(e.target.value)
                                            }
                                            className="flex-1 rounded-md border border-[#e2e8f0] px-3 py-2 text-sm outline-none placeholder:text-[#94a3b8] focus:border-[#3b82f6]"
                                        />
                                        <button
                                            type="button"
                                            className="flex items-center justify-center rounded-md bg-[#0260bd] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#024f9c]"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Event log */}
                            <button
                                type="button"
                                onClick={() => setLogOpen(!logOpen)}
                                className="flex items-center gap-1.5 px-1 text-sm text-[#475569] hover:text-[#1e293b]"
                            >
                                <ChevronRight
                                    className={cn(
                                        'size-4 transition',
                                        logOpen && 'rotate-90',
                                    )}
                                />
                                Event log ({t.event_log_count})
                            </button>
                        </div>
                    </div>

                    {/* Files section */}
                    <SectionCard
                        title={`Files : ${t.files_complete ? 'DSP complete' : 'Pending'}`}
                        className="mt-1"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div />
                            {t.files_complete && (
                                <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-[#15803d]">
                                    All mandatory items received
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col divide-y divide-[#f1f5f9]">
                            {t.files.map((f) => (
                                <div
                                    key={f.name}
                                    className="flex items-center justify-between py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-[#1e293b]">
                                            {f.name}
                                        </span>
                                        <span className="text-xs text-[#94a3b8]">
                                            {f.type} · {f.size}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="text-sm font-medium text-[#0260bd] hover:underline"
                                    >
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            </div>
        </PortalLayout>
    );
}
