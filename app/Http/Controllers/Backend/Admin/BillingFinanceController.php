<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\DeleteInvoiceRequest;
use App\Http\Requests\Backend\Admin\StoreInvoiceRequest;
use App\Http\Requests\Backend\Admin\UpdateInvoiceRequest;
use App\Models\Invoice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BillingFinanceController extends Controller
{
    public function index(Request $request): Response
    {
        $invoices = Invoice::query()
            ->with('creator:id,name,email')
            ->orderByDesc('invoice_date')
            ->orderByDesc('id')
            ->get();

        $invoices->each->syncOverdueStatus();
        $invoices->load('creator:id,name,email');

        return Inertia::render('backend/Admin/BillingFinance', [
            'kpis' => $this->kpiPayload($invoices),
            'invoices' => $invoices
                ->map(fn(Invoice $invoice): array => $this->invoicePayload($invoice))
                ->values()
                ->all(),
            'statuses' => InvoiceStatus::values(),
            'canCreateInvoices' => $request->user()?->can('billing.create') ?? false,
            'canUpdateInvoices' => $request->user()?->can('billing.update') ?? false,
            'canDeleteInvoices' => $request->user()?->can('billing.delete') ?? false,
        ]);
    }

    public function store(StoreInvoiceRequest $request): RedirectResponse
    {
        $invoice = Invoice::query()->create([
            ...$request->validated(),
            'number' => Invoice::nextNumber(),
            'created_by' => $request->user()?->id,
        ]);

        $invoice->syncOverdueStatus();

        return redirect()
            ->route('admin.billing.index')
            ->with('success', "{$invoice->number} was created.");
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): RedirectResponse
    {
        $invoice->update($request->validated());
        $invoice->syncOverdueStatus();

        return redirect()
            ->route('admin.billing.index')
            ->with('success', "{$invoice->number} was updated.");
    }

    public function destroy(DeleteInvoiceRequest $request, Invoice $invoice): RedirectResponse
    {
        $number = $invoice->number;
        $invoice->delete();

        return redirect()
            ->route('admin.billing.index')
            ->with('success', "{$number} was permanently deleted.");
    }

    public function export(Request $request): StreamedResponse
    {
        abort_unless($request->user()?->can('billing.view') ?? false, 403);

        $filename = 'invoices-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function (): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'Invoice',
                'Customer',
                'Amount',
                'Status',
                'Invoice Date',
                'Due Date',
                'Created By',
                'Created At',
                'Notes',
            ]);

            Invoice::query()
                ->with('creator:id,name,email')
                ->orderByDesc('invoice_date')
                ->orderByDesc('id')
                ->chunk(100, function (Collection $invoices) use ($handle): void {
                    foreach ($invoices as $invoice) {
                        /** @var Invoice $invoice */
                        $invoice->syncOverdueStatus();

                        fputcsv($handle, [
                            $invoice->number,
                            $invoice->customer,
                            number_format((float) $invoice->amount, 2, '.', ''),
                            $invoice->status->value,
                            $invoice->invoice_date->toDateString(),
                            $invoice->due_date->toDateString(),
                            $invoice->creator?->name ?: ($invoice->creator?->email ?? 'System'),
                            optional($invoice->created_at)?->toDateTimeString(),
                            $invoice->notes,
                        ]);
                    }
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function download(Request $request, Invoice $invoice): StreamedResponse
    {
        abort_unless($request->user()?->can('billing.view') ?? false, 403);

        $invoice->loadMissing('creator:id,name,email');
        $invoice->syncOverdueStatus();

        $filename = $invoice->number . '.txt';

        return response()->streamDownload(function () use ($invoice): void {
            echo implode(PHP_EOL, [
                'DDS Invoice',
                str_repeat('-', 40),
                'Invoice: ' . $invoice->number,
                'Customer: ' . $invoice->customer,
                'Amount: ' . $this->formatMoney((float) $invoice->amount),
                'Status: ' . $invoice->status->value,
                'Invoice Date: ' . $invoice->invoice_date->toDateString(),
                'Due Date: ' . $invoice->due_date->toDateString(),
                'Created By: ' . ($invoice->creator?->name ?: ($invoice->creator?->email ?? 'System')),
                'Created At: ' . ($invoice->created_at
                    ? $invoice->created_at->timezone(config('app.timezone'))->format('M j, Y · g:i A')
                    : '—'),
                'Notes: ' . ($invoice->notes ?: '—'),
            ]);
        }, $filename, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    public function send(Request $request, Invoice $invoice): RedirectResponse
    {
        abort_unless($request->user()?->can('billing.update') ?? false, 403);

        if ($invoice->status === InvoiceStatus::Paid) {
            return redirect()
                ->route('admin.billing.index')
                ->with('error', "{$invoice->number} is already paid.");
        }

        $invoice->forceFill(['sent_at' => now()])->save();

        return redirect()
            ->route('admin.billing.index')
            ->with('success', "{$invoice->number} was marked as sent.");
    }

    /**
     * @param  Collection<int, Invoice>  $invoices
     * @return list<array<string, mixed>>
     */
    private function kpiPayload(Collection $invoices): array
    {
        $now = Carbon::now();
        $thisMonthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonthNoOverflow()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonthNoOverflow()->endOfMonth();

        $paidThisMonth = $invoices
            ->filter(fn(Invoice $invoice): bool => $invoice->status === InvoiceStatus::Paid
                && $invoice->invoice_date->greaterThanOrEqualTo($thisMonthStart)
                && $invoice->invoice_date->lessThanOrEqualTo($now))
            ->sum(fn(Invoice $invoice): float => (float) $invoice->amount);

        $paidLastMonth = $invoices
            ->filter(fn(Invoice $invoice): bool => $invoice->status === InvoiceStatus::Paid
                && $invoice->invoice_date->greaterThanOrEqualTo($lastMonthStart)
                && $invoice->invoice_date->lessThanOrEqualTo($lastMonthEnd))
            ->sum(fn(Invoice $invoice): float => (float) $invoice->amount);

        $outstanding = $invoices->filter(
            fn(Invoice $invoice): bool => in_array($invoice->status, [InvoiceStatus::Pending, InvoiceStatus::Overdue], true),
        );
        $overdue = $invoices->filter(fn(Invoice $invoice): bool => $invoice->status === InvoiceStatus::Overdue);

        $avgOrder = $invoices->avg(fn(Invoice $invoice): float => (float) $invoice->amount) ?: 0;
        $avgLastMonth = $invoices
            ->filter(fn(Invoice $invoice): bool => $invoice->invoice_date->greaterThanOrEqualTo($lastMonthStart)
                && $invoice->invoice_date->lessThanOrEqualTo($lastMonthEnd))
            ->avg(fn(Invoice $invoice): float => (float) $invoice->amount) ?: 0;

        $pendingCount = $outstanding->count();
        $overdueCount = $overdue->count();

        return [
            [
                'key' => 'monthly_revenue',
                'label' => 'Monthly Revenue',
                'value' => $this->formatMoney((float) $paidThisMonth),
                'icon' => 'fin-revenue.svg',
                'icon_bg' => '#dbeafe',
                'trend' => $this->percentTrend((float) $paidThisMonth, (float) $paidLastMonth, 'vs ' . $lastMonthStart->format('M')),
                'trend_tone' => 'green',
            ],
            [
                'key' => 'outstanding',
                'label' => 'Outstanding',
                'value' => $this->formatMoney((float) $outstanding->sum(fn(Invoice $invoice): float => (float) $invoice->amount)),
                'icon' => 'fin-outstanding.svg',
                'icon_bg' => '#fef3c7',
                'hint' => $pendingCount . ' pending invoice' . ($pendingCount === 1 ? '' : 's'),
            ],
            [
                'key' => 'overdue',
                'label' => 'Overdue',
                'value' => $this->formatMoney((float) $overdue->sum(fn(Invoice $invoice): float => (float) $invoice->amount)),
                'icon' => 'fin-outstanding.svg',
                'icon_bg' => '#fee2e2',
                'hint' => $overdueCount . ' overdue invoice' . ($overdueCount === 1 ? '' : 's'),
                'hint_tone' => 'red',
            ],
            [
                'key' => 'avg_order',
                'label' => 'Avg Order Value',
                'value' => $this->formatMoney((float) $avgOrder),
                'icon' => 'fin-avg-order.svg',
                'icon_bg' => '#dcfce7',
                'trend' => $this->percentTrend((float) $avgOrder, (float) $avgLastMonth, 'this month'),
                'trend_tone' => 'green',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function invoicePayload(Invoice $invoice): array
    {
        $creator = $invoice->creator;

        return [
            'id' => $invoice->id,
            'number' => $invoice->number,
            'customer' => $invoice->customer,
            'amount' => $this->formatMoney((float) $invoice->amount),
            'amount_value' => number_format((float) $invoice->amount, 2, '.', ''),
            'status' => $invoice->status->value,
            'status_tone' => $invoice->status->tone(),
            'date' => $invoice->invoice_date->toDateString(),
            'due_date' => $invoice->due_date->toDateString(),
            'notes' => $invoice->notes,
            'sent_at' => $invoice->sent_at
                ? $invoice->sent_at->timezone(config('app.timezone'))->format('M j, Y · g:i A')
                : null,
            'created_by' => $creator?->name ?: ($creator?->email ?? 'System'),
            'created_at' => $invoice->created_at
                ? $invoice->created_at->timezone(config('app.timezone'))->format('M j, Y · g:i A')
                : '—',
        ];
    }

    private function percentTrend(float $current, float $previous, string $suffix): ?string
    {
        if ($previous <= 0 && $current <= 0) {
            return null;
        }

        if ($previous <= 0) {
            return '+100% ' . $suffix;
        }

        $change = (($current - $previous) / $previous) * 100;
        $prefix = $change >= 0 ? '+' : '';

        return $prefix . number_format($change, 1) . '% ' . $suffix;
    }

    private function formatMoney(float $amount): string
    {
        if ($amount == floor($amount)) {
            return '$' . number_format($amount, 0);
        }

        return '$' . number_format($amount, 2);
    }
}
