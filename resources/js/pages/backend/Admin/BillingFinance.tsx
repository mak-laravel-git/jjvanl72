import { Form, Head, router, usePage } from '@inertiajs/react';
import { type ReactNode, useState } from 'react';

import { AdminModal } from '@/components/admin-modal';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import {
    destroy,
    download,
    exportMethod,
    send,
    store,
    update,
} from '@/routes/admin/billing';
import type { SharedData } from '@/types';

const asset = (name: string) => `/images/admin-dashboard/${name}`;

type Kpi = {
    key: string;
    label: string;
    value: string;
    icon: string;
    icon_bg: string;
    hint?: string;
    hint_tone?: string;
    trend?: string | null;
    trend_tone?: string;
};

type Invoice = {
    id: number;
    number: string;
    customer: string;
    amount: string;
    amount_value: string;
    status: string;
    status_tone: string;
    date: string;
    due_date: string;
    notes: string | null;
    sent_at: string | null;
    created_by: string;
    created_at: string;
};

type Props = {
    kpis: Kpi[];
    invoices: Invoice[];
    statuses: string[];
    canCreateInvoices?: boolean;
    canUpdateInvoices?: boolean;
    canDeleteInvoices?: boolean;
};

const statusClasses: Record<string, string> = {
    paid: 'bg-[#dcfce7] text-[#008236]',
    pending: 'bg-[#ffedd5] text-[#c2410c]',
    overdue: 'bg-[#fee2e2] text-[#e7000b]',
};

const inputClassName =
    'h-10 w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 text-[13.125px] text-[#050315] outline-none focus:border-[#0260bd]';

const labelClassName =
    'mb-2 block text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase';

function KpiCard({ kpi }: { kpi: Kpi }) {
    return (
        <div className="flex flex-col rounded-[13.375px] border border-[#e2e8f0] bg-white p-5">
            <div className="flex items-start justify-between">
                <p className="text-[11.25px] font-semibold tracking-[0.5625px] text-[#99a1af] uppercase">
                    {kpi.label}
                </p>
                <div
                    className="flex size-[33.75px] items-center justify-center rounded-[13.375px]"
                    style={{ backgroundColor: kpi.icon_bg }}
                >
                    <span className="relative size-4 overflow-hidden">
                        <img
                            src={asset(kpi.icon)}
                            alt=""
                            className="size-full"
                        />
                    </span>
                </div>
            </div>
            <p className="mt-3 text-[22.5px] leading-[30px] font-bold text-[#050315]">
                {kpi.value}
            </p>
            {kpi.hint ? (
                <p
                    className={cn(
                        'mt-1 text-[11.25px] leading-[15px]',
                        kpi.hint_tone === 'red'
                            ? 'text-[#e7000b]'
                            : 'text-[#99a1af]',
                    )}
                >
                    {kpi.hint}
                </p>
            ) : null}
            {kpi.trend ? (
                <div className="mt-1.5 flex items-center gap-1">
                    <span className="relative size-[11px] shrink-0 overflow-hidden">
                        <img
                            src={asset('kpi-trend-up.svg')}
                            alt=""
                            className="size-full"
                        />
                    </span>
                    <span className="text-[11.25px] leading-[15px] font-medium text-[#096]">
                        {kpi.trend}
                    </span>
                </div>
            ) : null}
        </div>
    );
}

export default function BillingFinance({
    kpis,
    invoices,
    statuses,
    canCreateInvoices = false,
    canUpdateInvoices = false,
    canDeleteInvoices = false,
}: Props) {
    const { flash } = usePage<SharedData>().props;
    const [createOpen, setCreateOpen] = useState(false);
    const [viewTarget, setViewTarget] = useState<Invoice | null>(null);
    const [editTarget, setEditTarget] = useState<Invoice | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [sendingId, setSendingId] = useState<number | null>(null);

    const closeCreate = () => setCreateOpen(false);
    const closeView = () => setViewTarget(null);
    const closeEdit = () => setEditTarget(null);

    const openView = (invoice: Invoice) => {
        setEditTarget(null);
        setDeleteTarget(null);
        setCreateOpen(false);
        setViewTarget(invoice);
    };

    const openEdit = (invoice: Invoice) => {
        if (!canUpdateInvoices) {
            return;
        }

        setViewTarget(null);
        setDeleteTarget(null);
        setCreateOpen(false);
        setEditTarget(invoice);
    };

    const openDelete = (invoice: Invoice) => {
        if (!canDeleteInvoices) {
            return;
        }

        setViewTarget(null);
        setEditTarget(null);
        setCreateOpen(false);
        setDeleteTarget(invoice);
    };

    const closeDelete = () => {
        setDeleteTarget(null);
        setDeleting(false);
    };

    const confirmDelete = () => {
        if (!deleteTarget || !canDeleteInvoices || deleting) {
            return;
        }

        setDeleting(true);

        router.delete(destroy.url(deleteTarget.id), {
            onSuccess: () => {
                closeDelete();
            },
            onError: () => {
                setDeleting(false);
            },
            onFinish: () => {
                setDeleting(false);
            },
        });
    };

    const sendInvoice = (invoice: Invoice) => {
        if (!canUpdateInvoices || sendingId !== null) {
            return;
        }

        setSendingId(invoice.id);

        router.post(
            send.url(invoice.id),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setSendingId(null);
                },
            },
        );
    };

    return (
        <AdminLayout>
            <Head title="Billing & Finance" />

            <div className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                            Billing & Finance
                        </h1>
                        <p className="mt-[1.875px] text-[13.125px] leading-[18.75px] text-[#475569]">
                            Revenue, invoices, and payments
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <a
                            href={exportMethod.url()}
                            className="inline-flex items-center gap-2 rounded-[9.375px] border border-[#e2e8f0] bg-white px-4 py-2.5 text-[13.125px] font-semibold text-[#475569]"
                        >
                            <span className="relative size-3.5 overflow-hidden">
                                <img
                                    src={asset('btn-export.svg')}
                                    alt=""
                                    className="size-full"
                                />
                            </span>
                            Export
                        </a>
                        {canCreateInvoices ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setViewTarget(null);
                                    setEditTarget(null);
                                    setDeleteTarget(null);
                                    setCreateOpen(true);
                                }}
                                className="inline-flex items-center gap-2 rounded-[9.375px] bg-[#0260bd] px-4 py-2.5 text-[13.125px] font-semibold text-white"
                            >
                                <span className="relative size-3.5 overflow-hidden">
                                    <img
                                        src={asset('btn-plus-white.svg')}
                                        alt=""
                                        className="size-full"
                                    />
                                </span>
                                New Invoice
                            </button>
                        ) : null}
                    </div>
                </div>

                {flash?.success ? (
                    <div className="mt-4 rounded-[9.375px] border border-[#b9f8cf] bg-[#f0fdf4] px-4 py-3 text-[13.125px] text-[#008236]">
                        {flash.success}
                    </div>
                ) : null}

                {flash?.error ? (
                    <div className="mt-4 rounded-[9.375px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13.125px] text-[#c10007]">
                        {flash.error}
                    </div>
                ) : null}

                <div className="mt-[22.5px] grid grid-cols-1 gap-[15px] sm:grid-cols-2 xl:grid-cols-4">
                    {kpis.map((kpi) => (
                        <KpiCard key={kpi.key} kpi={kpi} />
                    ))}
                </div>

                <div className="mt-[22.5px] overflow-hidden rounded-[13.375px] border border-[#e2e8f0] bg-white">
                    <div className="border-b border-[#e2e8f0] px-5 py-4">
                        <h2 className="text-[15px] leading-[22.5px] font-bold text-[#050315]">
                            Recent Invoices
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#e2e8f0] bg-[#f9fafb] text-left text-[11.25px] font-bold tracking-[0.5625px] text-[#475569] uppercase">
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Invoice
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Customer
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Amount
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Status
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Date
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Due Date
                                    </th>
                                    <th className="px-[19px] py-[11px] font-bold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-[19px] py-10 text-center text-[13.125px] text-[#475569]"
                                        >
                                            No invoices yet. Create your first
                                            invoice to start tracking revenue.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((invoice, index) => (
                                        <tr
                                            key={invoice.id}
                                            className={cn(
                                                'border-[#e2e8f0]',
                                                index < invoices.length - 1 &&
                                                    'border-b',
                                            )}
                                        >
                                            <td className="px-[19px] py-[14px]">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openView(invoice)
                                                    }
                                                    className="font-mono text-[11.25px] font-bold text-[#0260bd] hover:underline"
                                                >
                                                    {invoice.number}
                                                </button>
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[13.125px] leading-[18.75px] font-semibold text-[#050315]">
                                                {invoice.customer}
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[13.125px] leading-[18.75px] font-bold text-[#050315]">
                                                {invoice.amount}
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full px-[7.5px] py-[1.5px] text-[11.25px] leading-[15px] font-semibold',
                                                        statusClasses[
                                                            invoice.status_tone
                                                        ] ??
                                                            statusClasses.pending,
                                                    )}
                                                >
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[11.25px] leading-[15px] text-[#475569]">
                                                {invoice.date}
                                            </td>
                                            <td className="px-[19px] py-[14px] text-[11.25px] leading-[15px] text-[#475569]">
                                                {invoice.due_date}
                                            </td>
                                            <td className="px-[19px] py-[14px]">
                                                <div className="flex items-center gap-[1.875px]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openView(invoice)
                                                        }
                                                        className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50"
                                                        title="View invoice"
                                                        aria-label={`View ${invoice.number}`}
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
                                                    </button>
                                                    {canUpdateInvoices ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEdit(
                                                                    invoice,
                                                                )
                                                            }
                                                            className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50"
                                                            title="Edit invoice"
                                                            aria-label={`Edit ${invoice.number}`}
                                                        >
                                                            <span className="relative block size-[13px] overflow-hidden">
                                                                <img
                                                                    src={asset(
                                                                        'action-edit.svg',
                                                                    )}
                                                                    alt=""
                                                                    className="size-full"
                                                                />
                                                            </span>
                                                        </button>
                                                    ) : null}
                                                    <a
                                                        href={download.url(
                                                            invoice.id,
                                                        )}
                                                        className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50"
                                                        title="Download invoice"
                                                        aria-label={`Download ${invoice.number}`}
                                                    >
                                                        <span className="relative block size-[13px] overflow-hidden">
                                                            <img
                                                                src={asset(
                                                                    'action-pdf.svg',
                                                                )}
                                                                alt=""
                                                                className="size-full"
                                                            />
                                                        </span>
                                                    </a>
                                                    {canUpdateInvoices &&
                                                    invoice.status_tone !==
                                                        'paid' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                sendInvoice(
                                                                    invoice,
                                                                )
                                                            }
                                                            disabled={
                                                                sendingId ===
                                                                invoice.id
                                                            }
                                                            className="rounded-[3.75px] p-[5.625px] hover:bg-slate-50 disabled:opacity-40"
                                                            title="Mark as sent"
                                                            aria-label={`Send ${invoice.number}`}
                                                        >
                                                            <span className="relative block size-[13px] overflow-hidden">
                                                                <img
                                                                    src={asset(
                                                                        'action-send.svg',
                                                                    )}
                                                                    alt=""
                                                                    className="size-full"
                                                                />
                                                            </span>
                                                        </button>
                                                    ) : null}
                                                    {canDeleteInvoices ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openDelete(
                                                                    invoice,
                                                                )
                                                            }
                                                            className="rounded-[3.75px] p-[5.625px] text-[#dc2626] hover:bg-red-50"
                                                            title="Delete invoice"
                                                            aria-label={`Delete ${invoice.number}`}
                                                        >
                                                            <span className="relative block size-[13px] overflow-hidden">
                                                                <img
                                                                    src={asset(
                                                                        'action-delete.svg',
                                                                    )}
                                                                    alt=""
                                                                    className="size-full"
                                                                />
                                                            </span>
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AdminModal
                open={createOpen && canCreateInvoices}
                onOpenChange={(open) => {
                    if (!open) {
                        closeCreate();
                    }
                }}
                title="New invoice"
                className="max-w-[560px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            New invoice
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            Create a billing invoice for a customer
                        </p>
                    </div>
                }
            >
                <Form
                    {...store.form()}
                    className="px-[22.5px] py-5"
                    onSuccess={closeCreate}
                    resetOnSuccess
                >
                    {({ processing, errors }) => (
                        <InvoiceFormFields
                            statuses={statuses}
                            errors={errors}
                            footer={
                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={closeCreate}
                                        disabled={processing}
                                        className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13.125px] font-semibold text-[#475569] disabled:opacity-40"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white disabled:opacity-40"
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : 'Create Invoice'}
                                    </button>
                                </div>
                            }
                        />
                    )}
                </Form>
            </AdminModal>

            <AdminModal
                open={viewTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        closeView();
                    }
                }}
                title="Invoice details"
                className="max-w-[560px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Invoice details
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            {viewTarget?.number ?? 'Invoice'}
                        </p>
                    </div>
                }
                footer={
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeView}
                            className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13.125px] font-semibold text-[#475569]"
                        >
                            Close
                        </button>
                        {viewTarget && canUpdateInvoices ? (
                            <button
                                type="button"
                                onClick={() => openEdit(viewTarget)}
                                className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white"
                            >
                                Edit Invoice
                            </button>
                        ) : null}
                    </div>
                }
            >
                {viewTarget ? (
                    <div className="grid gap-3 px-[22.5px] py-5 sm:grid-cols-2">
                        <DetailField
                            label="Invoice"
                            value={viewTarget.number}
                        />
                        <DetailField
                            label="Customer"
                            value={viewTarget.customer}
                        />
                        <DetailField label="Amount" value={viewTarget.amount} />
                        <DetailField label="Status" value={viewTarget.status} />
                        <DetailField
                            label="Invoice Date"
                            value={viewTarget.date}
                        />
                        <DetailField
                            label="Due Date"
                            value={viewTarget.due_date}
                        />
                        <DetailField
                            label="Created By"
                            value={viewTarget.created_by}
                        />
                        <DetailField
                            label="Created At"
                            value={viewTarget.created_at}
                        />
                        <DetailField
                            label="Sent At"
                            value={viewTarget.sent_at ?? 'Not sent'}
                        />
                        <DetailField
                            label="Notes"
                            value={viewTarget.notes || '—'}
                        />
                    </div>
                ) : null}
            </AdminModal>

            <AdminModal
                open={editTarget !== null && canUpdateInvoices}
                onOpenChange={(open) => {
                    if (!open) {
                        closeEdit();
                    }
                }}
                title="Edit invoice"
                className="max-w-[560px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Edit invoice
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            {editTarget
                                ? `Update ${editTarget.number}`
                                : 'Update invoice'}
                        </p>
                    </div>
                }
            >
                {editTarget ? (
                    <Form
                        key={editTarget.id}
                        {...update.form(editTarget.id)}
                        className="px-[22.5px] py-5"
                        onSuccess={closeEdit}
                    >
                        {({ processing, errors }) => (
                            <InvoiceFormFields
                                statuses={statuses}
                                errors={errors}
                                defaults={editTarget}
                                footer={
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeEdit}
                                            disabled={processing}
                                            className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13.125px] font-semibold text-[#475569] disabled:opacity-40"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="rounded-[9.375px] bg-[#0260bd] px-4 py-2 text-[13.125px] font-semibold text-white disabled:opacity-40"
                                        >
                                            {processing
                                                ? 'Saving...'
                                                : 'Save Changes'}
                                        </button>
                                    </div>
                                }
                            />
                        )}
                    </Form>
                ) : null}
            </AdminModal>

            <AdminModal
                open={deleteTarget !== null && canDeleteInvoices}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDelete();
                    }
                }}
                title="Delete invoice"
                className="max-w-[480px]"
                header={
                    <div>
                        <p className="text-[18px] leading-6 font-bold text-[#050315]">
                            Permanent delete
                        </p>
                        <p className="mt-1 text-[12px] text-[#475569]">
                            This action cannot be undone
                        </p>
                    </div>
                }
                footer={
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeDelete}
                            disabled={deleting}
                            className="rounded-[9.375px] border border-[#e2e8f0] bg-white px-4 py-2 text-[13.125px] font-semibold text-[#475569] disabled:opacity-40"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="rounded-[9.375px] bg-[#dc2626] px-4 py-2 text-[13.125px] font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-40"
                        >
                            {deleting ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                    </div>
                }
            >
                {deleteTarget ? (
                    <div className="space-y-3 px-[22.5px] py-5">
                        <p className="text-[13.125px] leading-5 text-[#050315]">
                            Are you sure you want to permanently delete{' '}
                            <span className="font-semibold">
                                {deleteTarget.number}
                            </span>
                            ?
                        </p>
                        <div className="rounded-[9.375px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[12px] text-[#7f1d1d]">
                            {deleteTarget.customer} · {deleteTarget.amount}
                            <br />
                            {deleteTarget.status} · Due {deleteTarget.due_date}
                        </div>
                    </div>
                ) : null}
            </AdminModal>
        </AdminLayout>
    );
}

function InvoiceFormFields({
    statuses,
    errors,
    defaults,
    footer,
}: {
    statuses: string[];
    errors: Record<string, string>;
    defaults?: Invoice;
    footer: ReactNode;
}) {
    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="customer" className={labelClassName}>
                    Customer
                </label>
                <input
                    id="customer"
                    name="customer"
                    type="text"
                    required
                    defaultValue={defaults?.customer ?? ''}
                    placeholder="e.g. Valley Dental Lab"
                    className={inputClassName}
                />
                {errors.customer ? (
                    <p className="mt-2 text-[12px] text-[#c10007]">
                        {errors.customer}
                    </p>
                ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="amount" className={labelClassName}>
                        Amount
                    </label>
                    <input
                        id="amount"
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        defaultValue={defaults?.amount_value ?? ''}
                        placeholder="1180.00"
                        className={inputClassName}
                    />
                    {errors.amount ? (
                        <p className="mt-2 text-[12px] text-[#c10007]">
                            {errors.amount}
                        </p>
                    ) : null}
                </div>

                <div>
                    <label htmlFor="status" className={labelClassName}>
                        Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        required
                        defaultValue={defaults?.status ?? 'Pending'}
                        className={inputClassName}
                    >
                        {statuses.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                    {errors.status ? (
                        <p className="mt-2 text-[12px] text-[#c10007]">
                            {errors.status}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="invoice_date" className={labelClassName}>
                        Invoice date
                    </label>
                    <input
                        id="invoice_date"
                        name="invoice_date"
                        type="date"
                        required
                        defaultValue={defaults?.date ?? ''}
                        className={inputClassName}
                    />
                    {errors.invoice_date ? (
                        <p className="mt-2 text-[12px] text-[#c10007]">
                            {errors.invoice_date}
                        </p>
                    ) : null}
                </div>

                <div>
                    <label htmlFor="due_date" className={labelClassName}>
                        Due date
                    </label>
                    <input
                        id="due_date"
                        name="due_date"
                        type="date"
                        required
                        defaultValue={defaults?.due_date ?? ''}
                        className={inputClassName}
                    />
                    {errors.due_date ? (
                        <p className="mt-2 text-[12px] text-[#c10007]">
                            {errors.due_date}
                        </p>
                    ) : null}
                </div>
            </div>

            <div>
                <label htmlFor="notes" className={labelClassName}>
                    Notes
                </label>
                <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    defaultValue={defaults?.notes ?? ''}
                    placeholder="Optional billing notes"
                    className="w-full rounded-[9.375px] border border-[#e2e8f0] bg-white px-3 py-2 text-[13.125px] text-[#050315] outline-none focus:border-[#0260bd]"
                />
                {errors.notes ? (
                    <p className="mt-2 text-[12px] text-[#c10007]">
                        {errors.notes}
                    </p>
                ) : null}
            </div>

            {footer}
        </div>
    );
}

function DetailField({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-[9.375px] border border-[#e2e8f0] bg-[#f9fafb] px-3 py-2.5">
            <p className="text-[11.25px] font-semibold tracking-[0.2813px] text-[#99a1af] uppercase">
                {label}
            </p>
            <p className="mt-1 text-[13.125px] font-semibold text-[#050315]">
                {value}
            </p>
        </div>
    );
}
