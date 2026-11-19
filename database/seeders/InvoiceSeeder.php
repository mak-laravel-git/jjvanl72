<?php

namespace Database\Seeders;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use App\Models\User;
use App\Support\AppPermissions;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class InvoiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $createdBy = User::query()
            ->role(AppPermissions::SUPER_ADMIN_ROLE, AppPermissions::GUARD)
            ->value('id');

        $today = Carbon::today();

        $invoices = [
            [
                'number' => 'INV-1047',
                'customer' => 'Valley Dental Lab',
                'amount' => 3240,
                'status' => InvoiceStatus::Paid,
                'invoice_date' => $today->copy()->subDays(8)->toDateString(),
                'due_date' => $today->copy()->addDays(6)->toDateString(),
            ],
            [
                'number' => 'INV-1046',
                'customer' => 'Dr. Sarah Mitchell',
                'amount' => 1180,
                'status' => InvoiceStatus::Paid,
                'invoice_date' => $today->copy()->subDays(12)->toDateString(),
                'due_date' => $today->copy()->addDays(2)->toDateString(),
            ],
            [
                'number' => 'INV-1045',
                'customer' => 'Metro Dental Lab',
                'amount' => 5620,
                'status' => InvoiceStatus::Pending,
                'invoice_date' => $today->copy()->subDays(15)->toDateString(),
                'due_date' => $today->copy()->addDays(5)->toDateString(),
            ],
            [
                'number' => 'INV-1044',
                'customer' => 'Dr. Rachel Torres',
                'amount' => 2890,
                'status' => InvoiceStatus::Pending,
                'invoice_date' => $today->copy()->subDays(18)->toDateString(),
                'due_date' => $today->copy()->addDays(3)->toDateString(),
            ],
            [
                'number' => 'INV-1043',
                'customer' => 'Sunrise Dental Partners',
                'amount' => 4100,
                'status' => InvoiceStatus::Overdue,
                'invoice_date' => $today->copy()->subDays(40)->toDateString(),
                'due_date' => $today->copy()->subDays(12)->toDateString(),
            ],
            [
                'number' => 'INV-1042',
                'customer' => 'Dr. Kevin Park',
                'amount' => 980,
                'status' => InvoiceStatus::Paid,
                'invoice_date' => $today->copy()->subMonthNoOverflow()->subDays(5)->toDateString(),
                'due_date' => $today->copy()->subMonthNoOverflow()->addDays(9)->toDateString(),
            ],
            [
                'number' => 'INV-1041',
                'customer' => 'Capital Denture Clinic',
                'amount' => 2150,
                'status' => InvoiceStatus::Pending,
                'invoice_date' => $today->copy()->subDays(6)->toDateString(),
                'due_date' => $today->copy()->addDays(8)->toDateString(),
            ],
        ];

        foreach ($invoices as $invoice) {
            Invoice::query()->updateOrCreate(
                ['number' => $invoice['number']],
                [
                    ...$invoice,
                    'created_by' => $createdBy,
                ],
            );
        }
    }
}
