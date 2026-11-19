<?php

namespace App\Http\Controllers\Backend\User;

use App\Http\Controllers\Controller;
use App\Support\PortalDemoData;
use Inertia\Inertia;
use Inertia\Response;

class PortalBillingController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('backend/User/Billing', [
            'invoices' => PortalDemoData::invoices(),
            'payments' => [
                'summary' => PortalDemoData::paymentsSummary(),
                'invoices' => PortalDemoData::paymentInvoices(),
                'methods' => PortalDemoData::paymentMethods(),
                'cost_breakdown' => PortalDemoData::costBreakdown(),
            ],
            'transactions' => PortalDemoData::transactionHistory(),
            'refund_requests' => PortalDemoData::refundRequests(),
            'saved_payment_methods' => PortalDemoData::savedPaymentMethods(),
        ]);
    }
}
