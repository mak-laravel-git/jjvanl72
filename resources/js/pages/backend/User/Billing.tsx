import { Head } from '@inertiajs/react';
import {
    CreditCard,
    Download,
    Eye,
    MoreVertical,
    Plus,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { AddPaymentMethodModal } from '@/components/portal/add-payment-method-modal';
import { PortalStatusBadge } from '@/components/portal/case-table';
import PortalLayout from '@/layouts/portal-layout';
import { portalAsset } from '@/lib/portal-role';
import { cn } from '@/lib/utils';

type Invoice = {
    invoice: string;
    case_id: string;
    description: string;
    amount: string;
    due_date: string | null;
    status: string;
    status_tone: string;
};

type PaymentInvoice = {
    invoice: string;
    date: string;
    period: string;
    amount: string;
    status: string;
    status_tone: string;
};

type PaymentMethod = {
    id: string;
    brand: string;
    last_four: string;
    expires: string;
    is_default: boolean;
};

type CostBreakdownItem = {
    label: string;
    amount: string;
    percent: number;
    color: string;
};

type PaymentsSummary = {
    outstanding_balance: string;
    outstanding_label: string;
    paid_this_month: string;
    paid_this_month_change: string;
    paid_ytd: string;
    paid_ytd_change: string;
    avg_case_value: string;
    avg_case_value_note: string;
};

type PaymentsData = {
    summary: PaymentsSummary;
    invoices: PaymentInvoice[];
    methods: PaymentMethod[];
    cost_breakdown: {
        items: CostBreakdownItem[];
        total: string;
    };
};

type Transaction = {
    title: string;
    date: string;
    payment_detail: string;
    amount: string;
};

type RefundRequest = {
    case_id: string;
    refund_status: string;
};

type SavedPaymentMethod = {
    id: string;
    brand: string;
    last_four: string;
    expires: string;
};

type Props = {
    invoices: Invoice[];
    payments: PaymentsData;
    transactions: Transaction[];
    refund_requests: RefundRequest[];
    saved_payment_methods: SavedPaymentMethod[];
};

const tabs = [
    'Invoices',
    'Payments',
    'Transaction History',
    'Refund Requests',
    'Saved Payment Methods',
] as const;

function BillingTabPanel({
    title,
    action,
    children,
}: {
    title: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-lg border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between border-b border-[#f3f4f6] px-6 py-5">
                <h2 className="text-base leading-[22px] font-semibold tracking-[-0.18px] text-[#050315]">
                    {title}
                </h2>
                {action}
            </div>
            <div className="p-6">{children}</div>
        </section>
    );
}

function PaymentBrandIcon({ brand }: { brand: string }) {
    if (brand === 'PayPal') {
        return (
            <span className="flex h-6 w-10 items-center justify-center rounded bg-[#f8fafc] text-[10px] font-bold tracking-tight text-[#003087]">
                PayPal
            </span>
        );
    }

    return (
        <span className="flex h-6 w-10 items-center justify-center rounded bg-[#1a1f71] text-[10px] font-bold tracking-wider text-white italic">
            VISA
        </span>
    );
}

function SummaryStatCard({
    label,
    value,
    subtext,
    valueClassName,
    subtextClassName,
}: {
    label: string;
    value: string;
    subtext: string;
    valueClassName?: string;
    subtextClassName?: string;
}) {
    return (
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <p className="text-sm leading-5 tracking-[-0.16px] text-[#f967a1]">
                {label}
            </p>
            <p
                className={cn(
                    'mt-2 text-[28px] leading-[34px] font-semibold tracking-[-0.2px] text-[#050315]',
                    valueClassName,
                )}
            >
                {value}
            </p>
            <p
                className={cn(
                    'mt-1 text-xs leading-4 tracking-[-0.12px] text-[#475569]',
                    subtextClassName,
                )}
            >
                {subtext}
            </p>
        </div>
    );
}

function PaymentsTab({
    payments,
    onAddMethod,
}: {
    payments: PaymentsData;
    onAddMethod: () => void;
}) {
    const { summary, invoices, methods, cost_breakdown: breakdown } = payments;

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryStatCard
                    label="Outstanding Balance"
                    value={summary.outstanding_balance}
                    subtext={summary.outstanding_label}
                    subtextClassName="font-semibold uppercase tracking-[0.08em] text-[#0260bd]"
                />
                <SummaryStatCard
                    label="Paid this month"
                    value={summary.paid_this_month}
                    subtext={summary.paid_this_month_change}
                    valueClassName="text-[#0260bd]"
                    subtextClassName="text-[#0260bd]"
                />
                <SummaryStatCard
                    label="Paid YTD"
                    value={summary.paid_ytd}
                    subtext={summary.paid_ytd_change}
                />
                <SummaryStatCard
                    label="Avg. case value"
                    value={summary.avg_case_value}
                    subtext={summary.avg_case_value_note}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
                <section className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between border-b border-[#f3f4f6] px-6 py-5">
                        <h2 className="text-base leading-[22px] font-semibold tracking-[-0.18px] text-[#050315]">
                            Invoices
                        </h2>
                        <button
                            type="button"
                            className="text-sm leading-5 font-medium tracking-[-0.16px] text-[#0260bd] transition-opacity hover:opacity-70"
                        >
                            View All
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="responsive-cards w-full min-w-[720px] border-collapse">
                            <thead>
                                <tr className="bg-[#f9fafb]">
                                    {[
                                        'Invoice #',
                                        'Date',
                                        'Period',
                                        'Amount',
                                        'Status',
                                        'Actions',
                                    ].map((heading) => (
                                        <th
                                            key={heading}
                                            className={cn(
                                                'px-6 py-4 text-sm font-semibold tracking-[-0.16px] text-[#475569] uppercase',
                                                heading === 'Actions' &&
                                                    'text-right',
                                            )}
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice, index) => (
                                    <tr
                                        key={invoice.invoice}
                                        className={cn(
                                            index === 0
                                                ? 'border-t border-[#e5e7eb]'
                                                : 'border-t border-[#f3f4f6]',
                                        )}
                                    >
                                        <td
                                            data-label="Invoice #"
                                            className="px-6 py-5 text-sm font-medium tracking-[-0.16px] text-[#050315]"
                                        >
                                            {invoice.invoice}
                                        </td>
                                        <td
                                            data-label="Date"
                                            className="px-6 py-5 text-sm tracking-[-0.16px] text-[#475569]"
                                        >
                                            {invoice.date}
                                        </td>
                                        <td
                                            data-label="Period"
                                            className="px-6 py-5 text-sm tracking-[-0.16px] text-[#475569]"
                                        >
                                            {invoice.period}
                                        </td>
                                        <td
                                            data-label="Amount"
                                            className="px-6 py-5 text-sm font-semibold tracking-[-0.16px] text-[#050315]"
                                        >
                                            {invoice.amount}
                                        </td>
                                        <td
                                            data-label="Status"
                                            className="px-6 py-5"
                                        >
                                            <PortalStatusBadge
                                                status={invoice.status}
                                                tone={invoice.status_tone}
                                            />
                                        </td>
                                        <td
                                            data-label="Actions"
                                            className="px-6 py-5"
                                        >
                                            <div className="flex items-center justify-end gap-4">
                                                <button
                                                    type="button"
                                                    title="Download"
                                                    className="transition-opacity hover:opacity-70"
                                                >
                                                    <span className="relative block size-5 overflow-hidden">
                                                        <img
                                                            src={portalAsset(
                                                                'case-action-download.svg',
                                                            )}
                                                            alt=""
                                                            className="size-full"
                                                        />
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    title="More options"
                                                    className="text-[#64748b] transition-opacity hover:opacity-70"
                                                >
                                                    <MoreVertical className="size-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="flex flex-col gap-6">
                    <section className="rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                        <h2 className="text-base leading-[22px] font-semibold tracking-[-0.18px] text-[#050315]">
                            Payment methods
                        </h2>

                        <div className="mt-6 flex flex-col gap-3">
                            {methods.map((method) => (
                                <div
                                    key={method.id}
                                    className={cn(
                                        'flex items-center justify-between rounded-lg border px-4 py-4',
                                        method.is_default
                                            ? 'border-[#0260bd] bg-[rgba(2,96,189,0.05)]'
                                            : 'border-[#e2e8f0] bg-white',
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <PaymentBrandIcon
                                            brand={method.brand}
                                        />
                                        <div>
                                            <p className="text-sm leading-5 font-medium tracking-[-0.16px] text-[#050315]">
                                                **** {method.last_four}
                                            </p>
                                            <p className="text-xs leading-4 tracking-[-0.12px] text-[#475569]">
                                                Expires {method.expires}
                                            </p>
                                        </div>
                                    </div>
                                    {method.is_default && (
                                        <span className="rounded-full bg-[rgba(2,96,189,0.1)] px-2.5 py-1 text-[10px] leading-3 font-semibold tracking-[0.08em] text-[#0260bd] uppercase">
                                            Default
                                        </span>
                                    )}
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={onAddMethod}
                                className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#cbd5e1] px-4 py-4 text-sm leading-5 font-medium tracking-[-0.16px] text-[#0260bd] transition-colors hover:border-[#0260bd]/40 hover:bg-[#f8fafc]"
                            >
                                <Plus className="size-4" />
                                Add method
                            </button>
                        </div>
                    </section>

                    <section className="rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
                        <h2 className="text-base leading-[22px] font-semibold tracking-[-0.18px] text-[#050315]">
                            Cost breakdown - this month
                        </h2>

                        <div className="mt-6 flex flex-col gap-5">
                            {breakdown.items.map((item) => (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm leading-5 tracking-[-0.16px] text-[#f967a1]">
                                            {item.label}
                                        </span>
                                        <span className="text-sm leading-5 font-medium tracking-[-0.16px] text-[#050315]">
                                            {item.amount}
                                        </span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f1f5f9]">
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${item.percent}%`,
                                                backgroundColor: item.color,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="flex items-center justify-between border-t border-[#f3f4f6] pt-4">
                                <span className="text-sm leading-5 font-semibold tracking-[-0.16px] text-[#050315]">
                                    Total
                                </span>
                                <span className="text-base leading-[22px] font-semibold tracking-[-0.18px] text-[#0260bd]">
                                    {breakdown.total}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function TransactionHistoryTab({
    transactions,
}: {
    transactions: Transaction[];
}) {
    return (
        <BillingTabPanel title="Transaction History">
            <div className="flex flex-col gap-4">
                {transactions.map((transaction) => (
                    <div
                        key={transaction.title}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#e2e8f0] px-6 py-5"
                    >
                        <div>
                            <p className="text-sm leading-5 font-semibold tracking-[-0.16px] text-[#050315]">
                                {transaction.title}
                            </p>
                            <p className="mt-1 text-sm leading-5 tracking-[-0.16px] text-[#475569]">
                                {transaction.date} •{' '}
                                {transaction.payment_detail}
                            </p>
                        </div>
                        <p className="text-sm leading-5 font-semibold tracking-[-0.16px] text-[#050315]">
                            {transaction.amount}
                        </p>
                    </div>
                ))}
            </div>
        </BillingTabPanel>
    );
}

function RefundRequestsTab({
    refundRequests,
}: {
    refundRequests: RefundRequest[];
}) {
    return (
        <BillingTabPanel title="Refund Requests">
            <div className="flex flex-col gap-6">
                {refundRequests.map((request) => (
                    <div
                        key={request.case_id}
                        className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f3f4f6] pb-6 last:border-b-0 last:pb-0"
                    >
                        <div>
                            <p className="text-sm leading-5 font-semibold tracking-[-0.16px] text-[#050315]">
                                {request.case_id}
                            </p>
                            <p className="mt-1 text-sm leading-5 tracking-[-0.16px]">
                                <span className="text-[#475569]">
                                    Refund Status:{' '}
                                </span>
                                <span className="text-[#f967a1]">
                                    {request.refund_status}
                                </span>
                            </p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm leading-5 font-medium tracking-[-0.16px] text-[#050315] transition-colors hover:bg-[#f8fafc]"
                        >
                            <RotateCcw className="size-4 text-[#64748b]" />
                            Request Refund
                        </button>
                    </div>
                ))}
            </div>
        </BillingTabPanel>
    );
}

function SavedPaymentMethodsTab({
    methods,
    onAddMethod,
}: {
    methods: SavedPaymentMethod[];
    onAddMethod: () => void;
}) {
    return (
        <BillingTabPanel
            title="Saved Payment Methods"
            action={
                <button
                    type="button"
                    onClick={onAddMethod}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2 text-sm leading-5 font-medium tracking-[-0.16px] text-[#050315] transition-colors hover:bg-[#f8fafc]"
                >
                    <Plus className="size-4" />
                    Add Method
                </button>
            }
        >
            <div className="flex flex-col gap-4">
                {methods.map((method) => (
                    <div
                        key={method.id}
                        className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-5 py-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-[rgba(2,96,189,0.1)]">
                                <CreditCard className="size-5 text-[#0260bd]" />
                            </div>
                            <div>
                                <p className="text-sm leading-5 font-semibold tracking-[-0.16px] text-[#050315]">
                                    {method.brand} ending in {method.last_four}
                                </p>
                                <p className="text-sm leading-5 tracking-[-0.16px] text-[#f967a1]">
                                    Expires {method.expires}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            title="Remove payment method"
                            className="text-[#94a3b8] transition-colors hover:text-[#64748b]"
                        >
                            <Trash2 className="size-5" />
                        </button>
                    </div>
                ))}
            </div>
        </BillingTabPanel>
    );
}

export default function Billing({
    invoices,
    payments,
    transactions,
    refund_requests,
    saved_payment_methods,
}: Props) {
    const [activeTab, setActiveTab] =
        useState<(typeof tabs)[number]>('Payments');
    const [addMethodOpen, setAddMethodOpen] = useState(false);

    return (
        <PortalLayout>
            <Head title="Billing" />

            <div className="p-8 font-inter">
                <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
                    <h1 className="text-[32px] leading-[38px] font-semibold tracking-[-0.2px] text-[#050315]">
                        Billing
                    </h1>

                    <div className="rounded-lg border border-[#e2e8f0] bg-white p-1.5">
                        <div className="flex flex-wrap gap-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        'rounded-lg px-4 py-2.5 text-sm font-medium tracking-[-0.16px] transition-colors',
                                        activeTab === tab
                                            ? 'bg-[rgba(2,96,189,0.1)] text-[#0260bd]'
                                            : 'text-[#64748b] hover:text-[#0260bd]',
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'Invoices' ? (
                        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                            <div className="overflow-x-auto">
                                <table className="responsive-cards w-full min-w-[1000px] border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                                            {[
                                                'Invoice #',
                                                'Case',
                                                'Description',
                                                'Amount',
                                                'Due Date',
                                                'Status',
                                                'Actions',
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className="px-6 py-4 text-left text-sm font-semibold tracking-[-0.16px] text-[#475569]"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map((invoice, index) => {
                                            const unpaid =
                                                invoice.status === 'Unpaid';

                                            return (
                                                <tr
                                                    key={invoice.invoice}
                                                    className={cn(
                                                        index > 0 &&
                                                            'border-t border-[#f1f5f9]',
                                                    )}
                                                >
                                                    <td
                                                        data-label="Invoice #"
                                                        className="px-6 py-4 text-sm font-medium text-[#050315]"
                                                    >
                                                        {invoice.invoice}
                                                    </td>
                                                    <td
                                                        data-label="Case"
                                                        className="px-6 py-4 text-sm font-medium text-[#050315]"
                                                    >
                                                        {invoice.case_id}
                                                    </td>
                                                    <td
                                                        data-label="Description"
                                                        className="px-6 py-4 text-sm text-[#475569]"
                                                    >
                                                        {invoice.description}
                                                    </td>
                                                    <td
                                                        data-label="Amount"
                                                        className="px-6 py-4 text-sm font-semibold text-[#050315]"
                                                    >
                                                        {invoice.amount}
                                                    </td>
                                                    <td
                                                        data-label="Due Date"
                                                        className="px-6 py-4 text-sm text-[#475569]"
                                                    >
                                                        {invoice.due_date ??
                                                            '—'}
                                                    </td>
                                                    <td
                                                        data-label="Status"
                                                        className="px-6 py-4"
                                                    >
                                                        <PortalStatusBadge
                                                            status={
                                                                invoice.status
                                                            }
                                                            tone={
                                                                invoice.status_tone
                                                            }
                                                        />
                                                    </td>
                                                    <td
                                                        data-label="Actions"
                                                        className="px-6 py-4"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    !unpaid
                                                                }
                                                                className={cn(
                                                                    'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white',
                                                                    unpaid
                                                                        ? 'bg-[#0260bd] hover:bg-[#024f9c]'
                                                                        : 'cursor-not-allowed bg-[#cbd5e1]',
                                                                )}
                                                            >
                                                                <span>$</span>
                                                                Pay
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="rounded-lg border border-[#e2e8f0] p-2 text-[#64748b] hover:bg-[#f8fafc]"
                                                                title="Download"
                                                            >
                                                                <Download className="size-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="rounded-lg border border-[#e2e8f0] p-2 text-[#64748b] hover:bg-[#f8fafc]"
                                                                title="View"
                                                            >
                                                                <Eye className="size-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : activeTab === 'Payments' ? (
                        <PaymentsTab
                            payments={payments}
                            onAddMethod={() => setAddMethodOpen(true)}
                        />
                    ) : activeTab === 'Transaction History' ? (
                        <TransactionHistoryTab transactions={transactions} />
                    ) : activeTab === 'Refund Requests' ? (
                        <RefundRequestsTab refundRequests={refund_requests} />
                    ) : activeTab === 'Saved Payment Methods' ? (
                        <SavedPaymentMethodsTab
                            methods={saved_payment_methods}
                            onAddMethod={() => setAddMethodOpen(true)}
                        />
                    ) : (
                        <div className="rounded-xl border border-[#e2e8f0] bg-white p-10 text-center text-sm text-[#475569] shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                            {activeTab} content coming soon.
                        </div>
                    )}
                </div>
            </div>

            <AddPaymentMethodModal
                open={addMethodOpen}
                onOpenChange={setAddMethodOpen}
            />
        </PortalLayout>
    );
}
