<?php

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

function createBillingAdmin(string $email = 'billing-admin@dev.com'): User
{
    test()->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create([
        'email' => $email,
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

test('authenticated admins can view billing finance from the database', function () {
    $admin = createBillingAdmin();
    $invoice = Invoice::factory()->create([
        'number' => 'INV-5001',
        'customer' => 'Valley Dental Lab',
        'amount' => 3240,
        'status' => InvoiceStatus::Paid,
        'invoice_date' => now()->toDateString(),
        'due_date' => now()->addDays(14)->toDateString(),
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.billing.index'))
        ->assertOk()
        ->assertInertia(
            fn(Assert $page) => $page
                ->component('backend/Admin/BillingFinance')
                ->has('invoices', 1)
                ->where('invoices.0.id', $invoice->id)
                ->where('invoices.0.number', 'INV-5001')
                ->where('invoices.0.customer', 'Valley Dental Lab')
                ->where('invoices.0.amount', '$3,240')
                ->where('invoices.0.created_by', $admin->name)
                ->where('canCreateInvoices', true)
                ->where('canUpdateInvoices', true)
                ->where('canDeleteInvoices', true)
                ->has('kpis', 4)
        );
});

test('super admins can create an invoice', function () {
    $admin = createBillingAdmin('create-invoice@dev.com');

    $this->actingAs($admin)
        ->post(route('admin.billing.store'), [
            'customer' => 'Dr. Sarah Mitchell',
            'amount' => 1180,
            'status' => 'Pending',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(14)->toDateString(),
            'notes' => 'Design + manufacturing',
        ])
        ->assertRedirect(route('admin.billing.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('invoices', [
        'customer' => 'Dr. Sarah Mitchell',
        'amount' => '1180.00',
        'status' => 'Pending',
        'created_by' => $admin->id,
        'notes' => 'Design + manufacturing',
    ]);
});

test('super admins can update an invoice', function () {
    $admin = createBillingAdmin('update-invoice@dev.com');
    $invoice = Invoice::factory()->create([
        'customer' => 'Old Customer',
        'amount' => 500,
        'status' => InvoiceStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->put(route('admin.billing.update', $invoice), [
            'customer' => 'Updated Customer',
            'amount' => 750,
            'status' => 'Paid',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(10)->toDateString(),
            'notes' => null,
        ])
        ->assertRedirect(route('admin.billing.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('invoices', [
        'id' => $invoice->id,
        'customer' => 'Updated Customer',
        'amount' => '750.00',
        'status' => 'Paid',
    ]);
});

test('super admins can permanently delete an invoice', function () {
    $admin = createBillingAdmin('delete-invoice@dev.com');
    $invoice = Invoice::factory()->create([
        'number' => 'INV-9999',
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.billing.destroy', $invoice))
        ->assertRedirect(route('admin.billing.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('invoices', [
        'id' => $invoice->id,
    ]);
});

test('super admins can export and download invoices', function () {
    $admin = createBillingAdmin('export-invoice@dev.com');
    $invoice = Invoice::factory()->create([
        'number' => 'INV-7777',
        'customer' => 'Export Customer',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.billing.export'))
        ->assertOk()
        ->assertHeader('content-disposition');

    $this->actingAs($admin)
        ->get(route('admin.billing.download', $invoice))
        ->assertOk()
        ->assertDownload('INV-7777.txt');
});

test('super admins can mark an unpaid invoice as sent', function () {
    $admin = createBillingAdmin('send-invoice@dev.com');
    $invoice = Invoice::factory()->create([
        'status' => InvoiceStatus::Pending,
        'sent_at' => null,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.billing.send', $invoice))
        ->assertRedirect(route('admin.billing.index'))
        ->assertSessionHas('success');

    expect($invoice->fresh()->sent_at)->not->toBeNull();
});

test('invoice create requires validation', function () {
    $admin = createBillingAdmin('validate-invoice@dev.com');

    $this->actingAs($admin)
        ->from(route('admin.billing.index'))
        ->post(route('admin.billing.store'), [])
        ->assertRedirect(route('admin.billing.index'))
        ->assertSessionHasErrors([
            'customer',
            'amount',
            'status',
            'invoice_date',
            'due_date',
        ]);
});

test('users without billing permissions cannot mutate invoices', function () {
    test()->seed(RolePermissionSeeder::class);

    $dentist = User::factory()->create([
        'email' => 'dentist-billing@dev.com',
    ]);
    $dentist->assignRole(AppPermissions::DENTIST_ROLE);

    $invoice = Invoice::factory()->create();

    $this->actingAs($dentist)
        ->post(route('admin.billing.store'), [
            'customer' => 'Blocked',
            'amount' => 100,
            'status' => 'Pending',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
        ])
        ->assertForbidden();

    $this->actingAs($dentist)
        ->put(route('admin.billing.update', $invoice), [
            'customer' => 'Blocked',
            'amount' => 100,
            'status' => 'Paid',
            'invoice_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
        ])
        ->assertForbidden();

    $this->actingAs($dentist)
        ->delete(route('admin.billing.destroy', $invoice))
        ->assertForbidden();
});
