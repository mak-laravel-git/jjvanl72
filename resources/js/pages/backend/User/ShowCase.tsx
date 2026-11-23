import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, Download, FileText } from 'lucide-react';
import { useMemo } from 'react';

import CaseFileSlotsPanel from '@/components/case-file-slots-panel';
import { PortalStatusBadge } from '@/components/portal/case-table';
import PortalLayout from '@/layouts/portal-layout';
import { cn } from '@/lib/utils';
import { active, edit } from '@/routes/cases';
import { download as downloadCaseFiles } from '@/routes/cases/files';

import CaseToothChart from './create-case/CaseToothChart';
import MaterialSwatch from './create-case/MaterialSwatch';
import {
    formatPalmerSpan,
    formatPalmerTeeth,
    prescriptionItemDetail,
    prescriptionItemTitle,
} from './create-case/helpers';
import type { CaseCreateCatalog, PrescriptionItem } from './create-case/types';

type CaseItemDetail = {
    id: number;
    kind: 'tooth' | 'bridge';
    product_key: string;
    action: string;
    material: string;
    contour: string;
    shade: string;
    quantity: number;
    teeth: number[];
    bridge_from: number | null;
    bridge_to: number | null;
    broken_edges: string[];
    price: number;
    line_total: number;
    included_in_bridge: boolean;
};

type FileItem = {
    id: string;
    slot_id?: number | null;
    label: string;
    required: boolean;
    uploaded: boolean;
};

type CaseDetail = {
    id: string;
    database_id: number;
    patient: string;
    product: string;
    status: string;
    status_tone: string;
    submission_date: string | null;
    due_date: string | null;
    manufacturing_type: string;
    reference: string;
    notes: string;
    service: string;
    case_approval: boolean;
    case_shade: string;
    scan_mode: string;
    source_scanner: string;
    model_output: string;
    items: CaseItemDetail[];
    files: FileItem[];
    has_downloadable_files: boolean;
    can_manage_files: boolean;
    cart_total: number;
};

type Props = {
    caseDetail: CaseDetail;
    catalog: CaseCreateCatalog;
};

const labelCls =
    'text-xs font-semibold tracking-[0.6px] text-[#64748b] uppercase';
const valueCls = 'text-sm text-[#334155]';

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className={labelCls}>{label}</span>
            <span className={valueCls}>{value || '—'}</span>
        </div>
    );
}

function materialColors(
    catalog: CaseCreateCatalog,
    materialName: string,
): string[] {
    for (const materials of Object.values(catalog.materialsByGroup)) {
        const match = materials.find((entry) => entry.name === materialName);

        if (match) {
            return match.colors;
        }
    }

    return ['#d4d4d6', '#eeeeee'];
}

function toPrescriptionItem(item: CaseItemDetail): PrescriptionItem {
    return {
        id: String(item.id),
        kind: item.kind,
        productKey: item.product_key,
        teeth: item.teeth,
        arch: '',
        quantity: item.quantity,
        unitPrice: item.price,
        material: item.material,
        shade: item.shade,
        config: {},
        bridgeFrom: item.bridge_from ?? undefined,
        bridgeTo: item.bridge_to ?? undefined,
        brokenEdges: item.broken_edges,
    };
}

export default function ShowCase({ caseDetail, catalog }: Props) {
    const c = caseDetail;
    const items = c.items ?? [];
    const prescriptionItems = items.map(toPrescriptionItem);

    const chartItems = useMemo(
        () =>
            items.map((item) => ({
                id: item.id,
                kind: item.kind,
                productKey: item.product_key,
                teeth: item.teeth,
                brokenEdges: item.broken_edges,
            })),
        [items],
    );

    return (
        <PortalLayout>
            <Head title={`Case ${c.id}`} />

            <div className="bg-[#fdfdfd] p-4 font-inter sm:p-6 lg:p-8">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                            <Link
                                href={active.url()}
                                className="mb-2 inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#1e293b]"
                            >
                                <ArrowLeft className="size-4" />
                                Back to Active Cases
                            </Link>
                            <h1 className="text-[32px] leading-9.5 font-semibold tracking-[-0.2px] text-[#050315]">
                                Case {c.id}
                            </h1>
                            <div className="mt-1 flex flex-wrap items-center gap-3">
                                <PortalStatusBadge
                                    status={c.status}
                                    tone={c.status_tone}
                                />
                                <span className="text-sm text-[#475569]">
                                    {c.product}
                                </span>
                                <span className="text-sm text-[#475569]">
                                    ·
                                </span>
                                <span className="text-sm text-[#475569]">
                                    {c.manufacturing_type}
                                </span>
                            </div>
                        </div>
                        <Link
                            href={edit.url(c.database_id)}
                            className="inline-flex items-center justify-center rounded-md bg-[#0260bd] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0250a0]"
                        >
                            Load
                        </Link>
                    </div>

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                        <div className="w-full shrink-0 rounded-lg border border-[#e2e8f0] bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)] xl:w-80 2xl:w-95.5">
                            <div className="border-b border-[#e2e8f0] px-4 py-4">
                                <p className="text-sm font-bold text-[#1e293b]">
                                    Case Details
                                </p>
                            </div>
                            <div className="flex flex-col gap-5 p-4">
                                <InfoRow
                                    label="REFERENCE"
                                    value={c.reference}
                                />
                                <InfoRow label="PATIENT" value={c.patient} />
                                <InfoRow label="NOTES" value={c.notes} />

                                <div className="flex flex-col gap-1">
                                    <span className={labelCls}>SERVICE</span>
                                    <div className="rounded-lg border border-[#e2e8f0] bg-[rgba(239,246,255,0.3)] p-4">
                                        <p className="text-sm font-semibold text-[#0f172a]">
                                            {c.service === 'design_only'
                                                ? 'Design Only'
                                                : 'Design & Process'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className={labelCls}>
                                        CASE APPROVAL
                                    </span>
                                    <span
                                        className={cn(
                                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                                            c.case_approval
                                                ? 'bg-[#dcfce7] text-[#15803d]'
                                                : 'bg-[#f3f4f6] text-[#475569]',
                                        )}
                                    >
                                        {c.case_approval
                                            ? 'Enabled'
                                            : 'Disabled'}
                                    </span>
                                </div>

                                <InfoRow
                                    label="CASE SHADE"
                                    value={c.case_shade}
                                />
                                <InfoRow
                                    label="SCAN MODE"
                                    value={c.scan_mode}
                                />
                                <InfoRow
                                    label="SOURCE SCANNER"
                                    value={c.source_scanner}
                                />
                                <InfoRow
                                    label="SUBMISSION DATE"
                                    value={c.submission_date ?? '—'}
                                />
                                <InfoRow
                                    label="DUE DATE"
                                    value={c.due_date ?? '—'}
                                />
                                <InfoRow
                                    label="MODEL OUTPUT"
                                    value={c.model_output}
                                />
                            </div>
                        </div>

                        <div className="w-full min-w-0 xl:flex-1">
                            <div className="rounded-lg border border-[#e2e8f0] bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                                <div className="border-b border-[#e2e8f0] px-6 py-4">
                                    <p className="text-sm font-bold text-[#1e293b]">
                                        Tooth Chart
                                    </p>
                                </div>
                                <div className="p-6">
                                    <CaseToothChart
                                        catalog={catalog}
                                        items={chartItems}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex w-full shrink-0 flex-col gap-4 xl:w-80 2xl:w-95.5">
                            <div className="rounded-lg border border-[#e2e8f0] bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                                <div className="border-b border-[#e2e8f0] px-4 py-4">
                                    <p className="text-sm font-bold text-[#1e293b]">
                                        Prescription
                                    </p>
                                </div>
                                <div className="flex flex-col divide-y divide-[#f1f5f9]">
                                    {items.length === 0 && (
                                        <p className="px-4 py-6 text-center text-sm text-[#94a3b8]">
                                            No teeth specified.
                                        </p>
                                    )}
                                    {items.map((item) => {
                                        const product =
                                            catalog.products[item.product_key];
                                        const prescriptionItem =
                                            toPrescriptionItem(item);

                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-start gap-3 px-4 py-3"
                                            >
                                                <span
                                                    className="mt-1 size-3 shrink-0 rounded-sm"
                                                    style={{
                                                        backgroundColor:
                                                            item.kind ===
                                                            'bridge'
                                                                ? '#16a34a'
                                                                : (product?.color ??
                                                                  '#d4d4d6'),
                                                    }}
                                                />
                                                {item.kind !== 'bridge' && (
                                                    <MaterialSwatch
                                                        colors={materialColors(
                                                            catalog,
                                                            item.material,
                                                        )}
                                                    />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-[#1e293b]">
                                                        {prescriptionItemTitle(
                                                            prescriptionItem,
                                                            product?.label ??
                                                                item.action,
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-[#64748b]">
                                                        {prescriptionItemDetail(
                                                            prescriptionItem,
                                                            product?.label ??
                                                                item.action,
                                                            prescriptionItems,
                                                        )}
                                                        {item.kind !==
                                                            'bridge' &&
                                                        item.contour
                                                            ? ` · ${item.contour}`
                                                            : ''}
                                                        {item.kind !==
                                                            'bridge' &&
                                                        item.shade
                                                            ? ` · Shade ${item.shade}`
                                                            : ''}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-semibold text-[#1e293b]">
                                                    {item.included_in_bridge
                                                        ? 'Included'
                                                        : `$${item.line_total.toFixed(2)}`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-lg border border-[#e2e8f0] bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                                <div className="border-b border-[#e2e8f0] px-4 py-4">
                                    <p className="text-sm font-bold text-[#1e293b]">
                                        Materials Used
                                    </p>
                                </div>
                                <div className="grid gap-2 p-4 sm:grid-cols-1">
                                    {[
                                        ...new Map(
                                            items
                                                .filter(
                                                    (item) =>
                                                        item.kind !==
                                                            'bridge' &&
                                                        item.material,
                                                )
                                                .map((item) => [
                                                    item.material,
                                                    item,
                                                ]),
                                        ).values(),
                                    ].map((item) => (
                                        <div
                                            key={item.material}
                                            className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3"
                                        >
                                            <MaterialSwatch
                                                colors={materialColors(
                                                    catalog,
                                                    item.material,
                                                )}
                                            />
                                            <span className="text-sm font-medium text-[#334155]">
                                                {item.material}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-lg border border-[#e2e8f0] bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                                <div className="border-b border-[#e2e8f0] px-4 py-4">
                                    <p className="text-sm font-bold text-[#1e293b]">
                                        Cart Summary
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 p-4">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-[#475569]">
                                                {item.kind === 'bridge' &&
                                                item.bridge_from !== null &&
                                                item.bridge_to !== null
                                                    ? `Bridge ${formatPalmerSpan(item.bridge_from, item.bridge_to)}`
                                                    : `Tooth ${formatPalmerTeeth(item.teeth)} — ${item.action}`}
                                                {item.kind !== 'bridge' &&
                                                item.material
                                                    ? ` · ${item.material}`
                                                    : ''}
                                                {item.included_in_bridge
                                                    ? ' · included in bridge'
                                                    : ''}
                                            </span>
                                            <span className="font-mono text-[#1e293b]">
                                                {item.included_in_bridge
                                                    ? '—'
                                                    : `$${item.line_total.toFixed(2)}`}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="border-t border-[#e2e8f0] pt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-[#1e293b]">
                                                Total
                                            </span>
                                            <span className="text-lg font-bold text-[#0260bd]">
                                                $
                                                {c.cart_total.toLocaleString(
                                                    'en-US',
                                                    {
                                                        minimumFractionDigits: 2,
                                                    },
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-[#e2e8f0] bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                                <div className="border-b border-[#e2e8f0] px-4 py-4">
                                    <p className="text-sm font-bold text-[#1e293b]">
                                        Files
                                    </p>
                                    <p className="pt-1 text-xs text-[#64748b]">
                                        Empty fields are requests for Lab or
                                        Designer to fulfill.
                                    </p>
                                </div>
                                {c.can_manage_files ? (
                                    <div className="p-4">
                                        <CaseFileSlotsPanel
                                            caseDatabaseId={c.database_id}
                                            canManage
                                            slots={c.files
                                                .filter(
                                                    (
                                                        file,
                                                    ): file is FileItem & {
                                                        slot_id: number;
                                                    } =>
                                                        typeof file.slot_id ===
                                                        'number',
                                                )
                                                .map((file) => ({
                                                    id: file.slot_id,
                                                    code: file.id,
                                                    label: file.label,
                                                    uploaded: file.uploaded,
                                                }))}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col divide-y divide-[#f1f5f9]">
                                        {c.files.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center justify-between px-4 py-3"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="size-4 text-[#94a3b8]" />
                                                    <span className="text-sm text-[#334155]">
                                                        {file.label}
                                                    </span>
                                                    {file.required && (
                                                        <span className="text-[10px] font-bold text-[#ef4444] uppercase">
                                                            Required
                                                        </span>
                                                    )}
                                                </div>
                                                {file.uploaded ? (
                                                    <Check className="size-4 text-[#10b981]" />
                                                ) : (
                                                    <span className="text-xs text-[#94a3b8]">
                                                        Not uploaded
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {c.has_downloadable_files ? (
                                <a
                                    href={downloadCaseFiles.url(c.id)}
                                    className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0260bd] px-4 py-3 text-base font-medium text-white transition hover:bg-[#0250a0]"
                                >
                                    <Download className="size-4" />
                                    Download Case Files
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    disabled
                                    className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-md bg-[#94a3b8] px-4 py-3 text-base font-medium text-white"
                                >
                                    <Download className="size-4" />
                                    No Files to Download
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}
