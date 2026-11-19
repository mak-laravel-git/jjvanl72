<?php

use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

$portalNavPages = [
    'dashboard' => ['dashboard', 'backend/User/UserDashboard'],
    'create case' => ['cases.create', 'backend/User/CreateCase'],
    'draft cases' => ['cases.drafts', 'backend/User/DraftCases'],
    'active cases' => ['cases.active', 'backend/User/ActiveCases'],
    'pending reviews' => ['cases.pending-reviews', 'backend/User/PendingReviews'],
    'manufacturing orders' => ['cases.manufacturing', 'backend/User/ManufacturingOrders'],
    'completed cases' => ['cases.completed', 'backend/User/CompletedCases'],
    'billing' => ['billing.index', 'backend/User/Billing'],
    'notifications' => ['notifications.index', 'backend/User/Notifications'],
    'profile settings' => ['user-profile.edit', 'backend/User/ProfileSettings'],
];

test('dentist can visit every portal page from the figma navigation', function (string $routeName, string $component) {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page->component($component)
        );
})->with($portalNavPages);

test('denturist can visit every portal page from the figma navigation', function (string $routeName, string $component) {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTURIST_ROLE);

    $this->actingAs($user)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component($component)
                ->where('auth.user.role', AppPermissions::DENTURIST_ROLE)
        );
})->with($portalNavPages);

test('lab can visit every portal page from the figma navigation', function (string $routeName, string $component) {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::LAB_ROLE);

    $this->actingAs($user)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component($component)
                ->where('auth.user.role', AppPermissions::LAB_ROLE)
        );
})->with($portalNavPages);

$designerNavPages = [
    'dashboard' => ['dashboard', 'backend/User/UserDashboard'],
    'assigned cases' => ['designer.assigned', 'backend/User/DesignerAssignedCases'],
    'in progress' => ['designer.in-progress', 'backend/User/DesignerInProgressCases'],
    'revision requests' => ['designer.revisions', 'backend/User/DesignerRevisionCases'],
    'submitted designs' => ['designer.submitted', 'backend/User/DesignerSubmittedCases'],
    'completed cases' => ['designer.completed', 'backend/User/DesignerCompletedCases'],
    'file downloads' => ['designer.downloads', 'backend/User/DesignerFileDownloads'],
    'notifications' => ['designer.notifications', 'backend/User/DesignerNotifications'],
    'profile settings' => ['user-profile.edit', 'backend/User/ProfileSettings'],
];

test('designer can visit every portal page from the figma navigation', function (string $routeName, string $component) {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component($component)
                ->where('auth.user.role', AppPermissions::DESIGNER_ROLE)
        );
})->with($designerNavPages);

$manufacturerNavPages = [
    'dashboard' => ['dashboard', 'backend/User/UserDashboard'],
    'assigned jobs' => ['manufacturer.assigned', 'backend/User/ManufacturerCaseList'],
    'in production' => ['manufacturer.in-production', 'backend/User/ManufacturerCaseList'],
    'quality check' => ['manufacturer.quality-check', 'backend/User/ManufacturerCaseList'],
    'ready to ship' => ['manufacturer.ready-to-ship', 'backend/User/ManufacturerCaseList'],
    'shipped orders' => ['manufacturer.shipped', 'backend/User/ManufacturerCaseList'],
    'completed orders' => ['manufacturer.completed', 'backend/User/ManufacturerCaseList'],
    'download center' => ['manufacturer.downloads', 'backend/User/ManufacturerDownloadCenter'],
    'notifications' => ['manufacturer.notifications', 'backend/User/ManufacturerNotifications'],
    'profile settings' => ['user-profile.edit', 'backend/User/ProfileSettings'],
];

test('manufacturer can visit every portal page from the figma navigation', function (string $routeName, string $component) {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component($component)
                ->where('auth.user.role', AppPermissions::MANUFACTURER_ROLE)
        );
})->with($manufacturerNavPages);

test('manufacturer assigned jobs page lists only assigned cases', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.assigned'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ManufacturerCaseList')
                ->where('title', 'Assigned Jobs')
                ->has('assignedJobs', 0)
        );
});

test('manufacturer assigned job detail returns 404 without assignment', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.assigned.show', 'APEX-MISSING'))
        ->assertNotFound();
});

test('manufacturer in production page lists assigned manufacturing jobs', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.in-production'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ManufacturerCaseList')
                ->where('title', 'In Production')
                ->has('inProductionJobs', 0)
        );
});

test('manufacturer in production job detail returns 404 without assignment', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.in-production.show', 'APEX-MISSING'))
        ->assertNotFound();
});

test('manufacturer quality check page lists quality check jobs', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.quality-check'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ManufacturerCaseList')
                ->where('title', 'Quality Check')
                ->has('qualityCheckJobs', 0)
        );
});

test('manufacturer quality check job detail returns 404 without assignment', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.quality-check.show', 'APEX-MISSING'))
        ->assertNotFound();
});

test('manufacturer ready to ship page lists ready to ship jobs', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.ready-to-ship'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ManufacturerCaseList')
                ->where('title', 'Ready To Ship')
                ->has('readyToShipJobs', 0)
        );
});

test('manufacturer ready to ship job detail returns 404 without assignment', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.ready-to-ship.show', 'APEX-MISSING'))
        ->assertNotFound();
});

test('manufacturer shipped orders page lists shipped jobs', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.shipped'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ManufacturerCaseList')
                ->where('title', 'Shipped Orders')
                ->has('shippedJobs', 0)
        );
});

test('manufacturer shipped job detail returns 404 without assignment', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.shipped.show', 'APEX-MISSING'))
        ->assertNotFound();
});

test('manufacturer download center page lists assigned case files', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.downloads'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ManufacturerDownloadCenter')
                ->has('files', 0)
        );
});

test('guests cannot visit portal case pages', function () {
    $this->get(route('cases.active'))->assertRedirect(route('login'));
});

test('dentist can open a pending design review from the case list', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('cases.pending-reviews.show', 'ADX-12491'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/DesignReview')
                ->where('review.id', 'ADX-12491')
                ->where('review.patient', 'Jane Doe')
                ->where('review.file_name', 'crown_14_design.stl')
        );
});

test('dentist cannot open a missing design review', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('cases.pending-reviews.show', 'MISSING'))
        ->assertNotFound();
});

test('guests cannot visit a pending design review', function () {
    $this->get(route('cases.pending-reviews.show', 'ADX-12491'))
        ->assertRedirect(route('login'));
});

test('users without cases permission cannot visit a pending design review', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('cases.pending-reviews.show', 'ADX-12491'))
        ->assertForbidden();
});

test('dentist can open manufacturing tracking from the case list', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('cases.manufacturing.show', 'ADX-12493'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ManufacturingTracking')
                ->where('tracking.id', 'ADX-12493')
                ->where('tracking.patient', 'Sarah Lee')
                ->has('tracking.pipeline')
                ->has('tracking.teeth')
        );
});

test('dentist can open shipped manufacturing tracking', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('cases.manufacturing.show', 'ADX-12494'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ManufacturingTracking')
                ->where('tracking.id', 'ADX-12494')
                ->has('tracking.pipeline')
                ->has('tracking.files')
        );
});

test('dentist cannot open a missing manufacturing tracking page', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('cases.manufacturing.show', 'MISSING'))
        ->assertNotFound();
});

test('guests cannot visit manufacturing tracking', function () {
    $this->get(route('cases.manufacturing.show', 'ADX-12493'))
        ->assertRedirect(route('login'));
});

test('users without cases permission cannot visit manufacturing tracking', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('cases.manufacturing.show', 'ADX-12493'))
        ->assertForbidden();
});

test('dentist completed cases page matches figma demo rows', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('cases.completed'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/CompletedCases')
                ->where('title', 'Completed Cases')
                ->has('cases', 2)
                ->where('cases.0.id', 'APX-SSTQBJ')
                ->where('cases.0.product', 'Crown & Bridge')
                ->where('cases.0.status', 'Completed')
                ->where('cases.0.status_tone', 'green')
                ->where('cases.1.id', 'APX-LQ9VCJ')
                ->where('cases.1.patient', 'Smoke Test')
        );
});

test('dentist billing page includes payments tab demo data', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('billing.index'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/Billing')
                ->has('payments.summary')
                ->where('payments.summary.outstanding_balance', '$2,452.00')
                ->where('payments.summary.paid_this_month', '$249.00')
                ->has('payments.invoices', 2)
                ->where('payments.invoices.0.invoice', '#INV-00824')
                ->where('payments.invoices.1.status', 'Overdue')
                ->has('payments.methods', 2)
                ->where('payments.methods.0.is_default', true)
                ->where('payments.cost_breakdown.total', '$249.00')
                ->has('transactions', 1)
                ->where('transactions.0.title', 'Payment for ADX-12491')
                ->where('transactions.0.amount', '-$249.00')
                ->has('refund_requests', 1)
                ->where('refund_requests.0.case_id', 'ADX-12491')
                ->where('refund_requests.0.refund_status', 'N/A')
                ->has('saved_payment_methods', 1)
                ->where('saved_payment_methods.0.brand', 'Visa')
                ->where('saved_payment_methods.0.expires', '12/26')
        );
});

test('dentist notifications page matches figma demo rows', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/Notifications')
                ->where('unreadCount', 9)
                ->has('notifications', 10)
                ->where('notifications.0.title', 'Manufacturing update')
                ->where('notifications.0.message', 'Case ADX-12493 manufacturing status: Delivered.')
                ->where('notifications.0.read', false)
                ->where('notifications.8.read', true)
                ->where('notifications.7.title', 'Design ready for review')
                ->where('notifications.9.message', 'Case ADX-12494 has shipped via FedEx.')
        );
});

test('designer assigned cases page lists only assigned cases', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('designer.assigned'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/DesignerAssignedCases')
                ->has('cases', 0)
        );
});

test('users without assignment permission cannot visit assigned cases', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('designer.assigned'))
        ->assertForbidden();
});

test('guests cannot visit assigned cases', function () {
    $this->get(route('designer.assigned'))->assertRedirect(route('login'));
});

test('designer in progress page lists designing assignments', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('designer.in-progress'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/DesignerInProgressCases')
                ->has('cases', 0)
        );
});

test('users without designs permission cannot visit in progress cases', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('designer.in-progress'))
        ->assertForbidden();
});

test('guests cannot visit in progress cases', function () {
    $this->get(route('designer.in-progress'))->assertRedirect(route('login'));
});

test('designer revision requests page lists revision assignments', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('designer.revisions'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/DesignerRevisionCases')
                ->has('cases', 0)
        );
});

test('users without designs permission cannot visit revision requests', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('designer.revisions'))
        ->assertForbidden();
});

test('guests cannot visit revision requests', function () {
    $this->get(route('designer.revisions'))->assertRedirect(route('login'));
});

test('designer submitted designs page lists submitted assignments', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('designer.submitted'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/DesignerSubmittedCases')
                ->has('cases', 0)
        );
});

test('users without designs permission cannot visit submitted designs', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('designer.submitted'))
        ->assertForbidden();
});

test('guests cannot visit submitted designs', function () {
    $this->get(route('designer.submitted'))->assertRedirect(route('login'));
});

test('designer completed cases page lists completed assignments', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('designer.completed'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/DesignerCompletedCases')
                ->has('cases', 0)
        );
});

test('users without designs permission cannot visit completed cases', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('designer.completed'))
        ->assertForbidden();
});

test('guests cannot visit designer completed cases', function () {
    $this->get(route('designer.completed'))->assertRedirect(route('login'));
});

test('designer assigned case detail returns 404 without assignment', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('designer.assigned.show', 'APX-MISSING'))
        ->assertNotFound();
});

test('designer file downloads page lists assigned cases', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('designer.downloads'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/DesignerFileDownloads')
                ->has('cases', 0)
        );
});

test('designer assigned case detail returns 404 for unknown cases', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('designer.assigned.show', 'INVALID-999'))
        ->assertNotFound();
});

test('users without assignment permission cannot open assigned cases', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('designer.assigned.show', 'APX-MISSING'))
        ->assertForbidden();
});

test('guests cannot open assigned cases', function () {
    $this->get(route('designer.assigned.show', 'APX-MISSING'))
        ->assertRedirect(route('login'));
});

test('designer notifications page matches figma demo rows', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($user)
        ->get(route('designer.notifications'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/DesignerNotifications')
                ->where('unreadCount', 3)
                ->has('notifications', 5)
                ->where('notifications.0.title', 'New Case Assigned')
                ->where('notifications.0.body', 'APX-2861 — Implant Abutment from Dr. Carlos Mendes. Due July 5.')
                ->where('notifications.0.read', false)
                ->where('notifications.0.icon', 'notif-new-case.svg')
                ->where('notifications.2.title', 'Design Approved')
                ->where('notifications.3.read', true)
                ->where('notifications.4.time', 'Yesterday')
        );
});

test('manufacturer notifications page matches figma demo rows', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('manufacturer.notifications'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ManufacturerNotifications')
                ->where('unreadCount', 2)
                ->has('notifications', 4)
                ->where('notifications.0.title', 'New Job Assigned')
                ->where('notifications.0.body', 'APEX-2026-001: Crown for Dr. Sarah Johnson')
                ->where('notifications.0.category', 'new-jobs')
                ->where('notifications.0.tone', 'info')
                ->where('notifications.0.read', false)
                ->where('notifications.0.time', 'Jun 25, 2026 9:30 AM')
                ->where('notifications.1.title', 'Urgent Deadline Warning')
                ->where('notifications.1.category', 'urgent')
                ->where('notifications.1.tone', 'urgent')
                ->where('notifications.2.title', 'QC Reminder')
                ->where('notifications.2.read', true)
                ->where('notifications.3.title', 'Delivery Confirmation')
                ->where('notifications.3.category', 'delivery')
        );
});

test('manufacturer profile settings page loads for manufacturing role', function () {
    $user = User::factory()->create([
        'name' => 'Max Smith',
        'email' => 'manufacturer-profile@dev.com',
    ]);
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    $this->actingAs($user)
        ->get(route('user-profile.edit'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ProfileSettings')
                ->where('profile.name', 'Max Smith')
                ->where('profile.email', 'manufacturer-profile@dev.com')
                ->where('auth.user.role', AppPermissions::MANUFACTURER_ROLE)
        );
});

test('users without notifications permission cannot visit notifications page', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertForbidden();
});

test('users without cases permission cannot visit active cases', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('cases.active'))
        ->assertForbidden();
});
