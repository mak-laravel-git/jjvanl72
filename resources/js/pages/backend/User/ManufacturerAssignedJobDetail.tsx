import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Circle,
    CircleCheck,
    Download,
    FileText,
    Package,
    Truck,
    Upload,
} from 'lucide-react';
import { useState } from 'react';

import PortalLayout from '@/layouts/portal-layout';
import { cn } from '@/lib/utils';

type JobFile = {
    name: string;
    meta: string;
};

type JobTimelineItem = {
    label: string;
    date: string;
};

type JobAction = {
    label: string;
    tone: 'primary' | 'accent';
    icon: 'check' | 'upload' | 'return' | 'package';
};

type JobDetail = {
    id: string;
    subtitle: string;
    customer_name: string;
    customer_type: string;
    customer_type_label?: string;
    product_type: string;
    material: string;
    shade: string;
    shade_label?: string;
    quantity: string;
    due_date: string;
    priority: string;
    priority_tone: 'high' | 'medium' | 'low';
    status: string;
    status_tone:
        | 'assigned'
        | 'accepted'
        | 'in-production'
        | 'quality-check'
        | 'ready-to-ship'
        | 'shipped';
    manufacturing_notes: string;
    shipping_address: string;
    files: JobFile[];
    timeline: JobTimelineItem[];
    action_label: string;
    action_tone: 'primary' | 'accent';
    actions?: JobAction[];
    production_panel?: 'actions' | 'shipping' | 'shipment-status';
    shipment?: {
        courier: string;
        tracking_number: string;
        est_delivery: string;
    };
    back_url: string;
};

type Props = {
    job: JobDetail;
};

const statusClasses: Record<JobDetail['status_tone'], string> = {
    assigned: 'bg-[#eff6ff] text-[#0260bd]',
    accepted: 'bg-[#eff6ff] text-[#0260bd]',
    'in-production': 'bg-[#eff6ff] text-[#0260bd]',
    'quality-check': 'bg-[#eff6ff] text-[#0260bd]',
    'ready-to-ship': 'bg-[#eff6ff] text-[#0260bd]',
    shipped: 'bg-[#eff6ff] text-[#0260bd]',
};

const priorityClasses: Record<JobDetail['priority_tone'], string> = {
    high: 'bg-[#fef2f2] text-[#ef4444]',
    medium: 'bg-[#fffbeb] text-[#bb4d00]',
    low: 'bg-[#f0fdf4] text-[#16a34a]',
};

const actionButtonClasses: Record<JobDetail['action_tone'], string> = {
    primary: 'bg-[#0260bd] hover:bg-[#024f9c]',
    accent: 'bg-[#f967a1] hover:bg-[#e85590]',
};

const shippingInputClass =
    'mt-1.5 h-10 w-full rounded-[10px] border border-[#e2e8f0] bg-white px-3 text-sm tracking-[-0.16px] text-[#050315] outline-none placeholder:text-[#94a3b8] focus:border-[#0260bd] focus:ring-2 focus:ring-[#0260bd]/10';

export default function ManufacturerAssignedJobDetail({ job }: Props) {
    const [courier, setCourier] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shippingNotes, setShippingNotes] = useState('');
    const showShippingPanel = job.production_panel === 'shipping';
    const showShipmentStatusPanel = job.production_panel === 'shipment-status';
    const customerTypeLabel = job.customer_type_label ?? 'Customer Type';
    const shadeLabel = job.shade_label ?? 'Shade';

    return (
        <PortalLayout>
            <Head title={`Job Details: ${job.id}`} />

            <div className="p-6 font-inter">
                <div className="flex flex-col gap-6">
                    <div className="flex items-start gap-3">
                        <Link
                            href={job.back_url}
                            className="mt-0.5 inline-flex size-5 items-center justify-center text-[#050315] hover:text-[#0260bd]"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <h1 className="text-[20px] leading-6 font-semibold text-[#050315]">
                                {`Job Details: ${job.id}`}
                            </h1>
                            <p className="pt-1 text-base leading-[22px] tracking-[-0.18px] text-[#475569]">
                                {job.subtitle}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_minmax(0,1fr)_400px]">
                        <section className="rounded-[10px] border border-[#e2e8f0] bg-white p-[25px]">
                            <h2 className="text-xl leading-6 font-semibold text-[#050315]">
                                Case Information
                            </h2>

                            <div className="pt-4">
                                <InfoRow
                                    label="Customer Name"
                                    value={job.customer_name}
                                />
                                {job.customer_type ? (
                                    <InfoRow
                                        label={customerTypeLabel}
                                        value={job.customer_type}
                                    />
                                ) : null}
                                <InfoRow
                                    label="Product Type"
                                    value={job.product_type}
                                />
                                <InfoRow
                                    label="Material"
                                    value={job.material}
                                />
                                <InfoRow label={shadeLabel} value={job.shade} />
                                <InfoRow
                                    label="Quantity"
                                    value={job.quantity}
                                />
                                <InfoRow
                                    label="Due Date"
                                    value={job.due_date}
                                />
                                <InfoRow
                                    label="Priority"
                                    value={job.priority}
                                    valueClassName={cn(
                                        'inline-flex rounded px-[7px] py-1 text-xs leading-4',
                                        priorityClasses[job.priority_tone],
                                    )}
                                />
                                <InfoRow
                                    label="Status"
                                    value={job.status}
                                    valueClassName={cn(
                                        'inline-flex rounded bg-[#eff6ff] px-1 py-1 text-xs leading-4',
                                        statusClasses[job.status_tone],
                                    )}
                                />
                            </div>

                            <div className="mt-4 border-t border-[#e2e8f0] pt-[17px]">
                                <h3 className="text-lg leading-7 font-medium text-[#050315]">
                                    Manufacturing Notes
                                </h3>
                                <p className="pt-2 text-sm leading-5 text-[#475569]">
                                    {job.manufacturing_notes}
                                </p>
                            </div>

                            <div className="mt-4 border-t border-[#e2e8f0] pt-[17px]">
                                <h3 className="text-lg leading-7 font-medium text-[#050315]">
                                    Shipping Address
                                </h3>
                                <p className="pt-2 text-sm leading-5 text-[#475569]">
                                    {job.shipping_address}
                                </p>
                            </div>
                        </section>

                        <div className="flex min-w-0 flex-col gap-4">
                            <section className="rounded-[10px] border border-[#e2e8f0] bg-white p-[25px]">
                                <div className="flex items-center justify-between gap-4">
                                    <h2 className="text-xl leading-6 font-semibold text-[#050315]">
                                        Download Center
                                    </h2>
                                    <button
                                        type="button"
                                        className="rounded-[10px] bg-[#0260bd] px-4 py-3 text-sm leading-5 font-medium text-white hover:bg-[#024f9c]"
                                    >
                                        Download All
                                    </button>
                                </div>

                                <div className="pt-4">
                                    {job.files.map((file) => (
                                        <div
                                            key={file.name}
                                            className="mt-3 flex items-center gap-3 rounded-[10px] border border-[#e2e8f0] p-[13px] first:mt-0"
                                        >
                                            <div className="rounded bg-[#eff6ff] p-2 text-[#0260bd]">
                                                <FileText className="size-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm leading-5 text-[#050315]">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs leading-4 text-[#475569]">
                                                    {file.meta}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className="rounded p-2 text-[#0260bd] transition-opacity hover:opacity-70"
                                                title={`Download ${file.name}`}
                                            >
                                                <Download className="size-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-[10px] border border-[#e2e8f0] bg-white p-[25px]">
                                <h2 className="text-xl leading-6 font-semibold text-[#050315]">
                                    Timeline
                                </h2>

                                <div className="pt-4">
                                    {job.timeline.map((item) => (
                                        <div
                                            key={`${item.label}-${item.date}`}
                                            className="mt-4 flex items-start gap-3 first:mt-0"
                                        >
                                            <div className="flex size-8 items-center justify-center rounded-full bg-[#eff6ff]">
                                                <Circle className="size-2 fill-[#0260bd] text-[#0260bd]" />
                                            </div>
                                            <div>
                                                <p className="text-sm leading-5 text-[#050315]">
                                                    {item.label}
                                                </p>
                                                <p className="pt-1 text-xs leading-4 text-[#475569]">
                                                    {item.date}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <section className="self-stretch rounded-[10px] border border-[#e2e8f0] bg-white p-[25px] xl:min-h-[388px]">
                            <h2 className="text-xl leading-6 font-semibold text-[#050315]">
                                Production Actions
                            </h2>

                            {showShippingPanel ? (
                                <div className="mt-4 flex flex-col gap-4">
                                    <div>
                                        <p className="text-sm leading-5 font-medium text-[#050315]">
                                            Shipping Information
                                        </p>
                                    </div>

                                    <label className="block">
                                        <span className="text-xs leading-4 text-[#475569]">
                                            Courier Company
                                        </span>
                                        <input
                                            value={courier}
                                            onChange={(event) =>
                                                setCourier(event.target.value)
                                            }
                                            placeholder="e.g. FedEx, UPS, DHL"
                                            className={shippingInputClass}
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-xs leading-4 text-[#475569]">
                                            Tracking Number
                                        </span>
                                        <input
                                            value={trackingNumber}
                                            onChange={(event) =>
                                                setTrackingNumber(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Enter tracking number"
                                            className={shippingInputClass}
                                        />
                                    </label>

                                    <label className="block">
                                        <span className="text-xs leading-4 text-[#475569]">
                                            Shipping Notes
                                        </span>
                                        <textarea
                                            value={shippingNotes}
                                            onChange={(event) =>
                                                setShippingNotes(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Special handling instructions..."
                                            rows={4}
                                            className={cn(
                                                shippingInputClass,
                                                'h-auto min-h-[96px] resize-none py-2.5',
                                            )}
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#0260bd] px-4 py-3 text-base leading-6 font-medium text-white hover:bg-[#024f9c]"
                                    >
                                        <Truck className="size-5" />
                                        Create Shipment
                                    </button>
                                </div>
                            ) : showShipmentStatusPanel && job.shipment ? (
                                <div className="mt-4 flex flex-col gap-4">
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs leading-4 text-[#f967a1]">
                                                Courier
                                            </p>
                                            <p className="pt-1 text-sm leading-5 text-[#050315]">
                                                {job.shipment.courier}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs leading-4 text-[#f967a1]">
                                                Tracking #
                                            </p>
                                            <a
                                                href={`https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(job.shipment.tracking_number)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-block pt-1 text-sm leading-5 text-[#0260bd] hover:underline"
                                            >
                                                {job.shipment.tracking_number}
                                            </a>
                                        </div>
                                        <div>
                                            <p className="text-xs leading-4 text-[#f967a1]">
                                                Est. Delivery
                                            </p>
                                            <p className="pt-1 text-sm leading-5 text-[#050315]">
                                                {job.shipment.est_delivery}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#0260bd] px-4 py-3 text-base leading-6 font-medium text-white hover:bg-[#024f9c]"
                                    >
                                        <CircleCheck className="size-5" />
                                        Mark As Delivered
                                    </button>
                                </div>
                            ) : (
                                (
                                    job.actions ?? [
                                        {
                                            label: job.action_label,
                                            tone: job.action_tone,
                                            icon:
                                                job.action_tone === 'accent'
                                                    ? 'upload'
                                                    : 'check',
                                        },
                                    ]
                                ).map((action, index) => (
                                    <button
                                        key={action.label}
                                        type="button"
                                        className={cn(
                                            'flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-3 text-base leading-6 font-medium text-white',
                                            index === 0 ? 'mt-4' : 'mt-3',
                                            actionButtonClasses[action.tone],
                                        )}
                                    >
                                        <ActionIcon icon={action.icon} />
                                        {action.label}
                                    </button>
                                ))
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </PortalLayout>
    );
}

function ActionIcon({ icon }: { icon: JobAction['icon'] }) {
    if (icon === 'return') {
        return <ArrowLeft className="size-5" />;
    }

    if (icon === 'upload') {
        return <Upload className="size-5" />;
    }

    if (icon === 'package') {
        return <Package className="size-5" />;
    }

    return <CircleCheck className="size-5" />;
}

function InfoRow({
    label,
    value,
    valueClassName,
}: {
    label: string;
    value: string;
    valueClassName?: string;
}) {
    return (
        <div className="pt-3 first:pt-0">
            <p className="text-xs leading-4 text-[#f967a1]">{label}</p>
            <div className="pt-1 text-sm leading-5 text-[#050315]">
                {valueClassName ? (
                    <span className={valueClassName}>{value}</span>
                ) : (
                    value
                )}
            </div>
        </div>
    );
}
