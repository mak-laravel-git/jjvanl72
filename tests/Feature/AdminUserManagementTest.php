<?php

use App\Enums\DentalCaseStatus;
use App\Models\DentalCase;
use App\Models\DentalCaseFile;
use App\Models\DentalClient;
use App\Models\DentalProduct;
use App\Models\DentalProductGroup;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function createAdminPanelUser(string $email = 'admin-panel@dev.com'): User
{
    test()->seed(RolePermissionSeeder::class);

    $admin = User::factory()->create([
        'name' => 'Dr. Nick Smith',
        'email' => $email,
    ]);

    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

test('authenticated admins can view user management', function () {
    $admin = createAdminPanelUser('users@dev.com');

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/UserManagement')
                ->has('users')
                ->has('tabs')
                ->where('activeTab', 'all')
        );
});

test('authenticated admins can view all cases', function () {
    $admin = createAdminPanelUser('cases@dev.com');
    $case = DentalCase::factory()->submitted()->create([
        'patient_name_snapshot' => 'Admin List Patient',
        'notes' => 'Shade A2',
        'configuration_json' => [
            'service' => 'manufacture',
            'shade' => 'A2',
            'impressionType' => 'Intra Oral Scan',
            'manufactureMethod' => 'mill',
            'output' => 'appliance',
            'modelService' => 'none',
        ],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.cases.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/AllCases')
                ->has('cases')
                ->has('pagination')
                ->has('statusOptions')
                ->has('clientOptions')
                ->where('total', 1)
                ->where('cases.0.id', $case->case_number)
                ->where('cases.0.customer_date', 'Admin List Patient')
                ->where('cases.0.service_type', 'Design + Manufacturing')
                ->where('cases.0.notes', 'Shade A2')
        );
});

test('admins can download case files as a zip', function () {
    Storage::fake('local');

    $admin = createAdminPanelUser('cases-download@dev.com');
    $case = DentalCase::factory()->submitted()->create([
        'case_number' => 'ADX-44323',
    ]);
    $path = 'dental-cases/'.$case->id.'/upper.stl';
    Storage::disk('local')->put($path, 'upper-scan-bytes');

    DentalCaseFile::factory()->create([
        'case_id' => $case->id,
        'requirement_code_snapshot' => 'upperArch',
        'storage_disk' => 'local',
        'storage_path' => $path,
        'original_name' => 'upper.stl',
        'uploaded_by_user_id' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.cases.files.download', $case->case_number))
        ->assertOk()
        ->assertDownload('ADX-44323-files.zip');
});

test('admin case download returns 404 when a case has no files', function () {
    $admin = createAdminPanelUser('cases-no-files@dev.com');
    $case = DentalCase::factory()->submitted()->create();

    $this->actingAs($admin)
        ->get(route('admin.cases.files.download', $case->case_number))
        ->assertNotFound();
});

test('admins can search and filter all cases', function () {
    $admin = createAdminPanelUser('cases-filter@dev.com');
    $client = DentalClient::factory()->create(['name' => 'Alpha Dental']);
    $otherClient = DentalClient::factory()->create(['name' => 'Beta Dental']);

    $match = DentalCase::factory()->configureFor($admin, $client)->submitted()->create([
        'case_number' => 'ADX-SEARCH1',
        'patient_name_snapshot' => 'Searchable Patient',
        'status' => DentalCaseStatus::Submitted,
    ]);
    DentalCase::factory()->configureFor($admin, $otherClient)->submitted()->create([
        'case_number' => 'ADX-OTHER1',
        'patient_name_snapshot' => 'Other Patient',
        'status' => DentalCaseStatus::Completed,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.cases.index', [
            'search' => 'Searchable',
            'filters' => [
                'status' => 'submitted',
                'client_id' => $client->id,
            ],
        ]))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/AllCases')
                ->has('cases', 1)
                ->where('cases.0.id', $match->case_number)
                ->where('search', 'Searchable')
                ->where('filters.status', 'submitted')
                ->where('filters.client_id', (string) $client->id)
        );
});

test('admins can edit any case via admin routes', function () {
    $admin = createAdminPanelUser('cases-edit@dev.com');
    $dentist = User::factory()->create();
    $dentist->assignRole(AppPermissions::DENTIST_ROLE);
    $case = DentalCase::factory()->configureFor($dentist)->submitted()->create([
        'patient_name_snapshot' => 'Admin Edit Patient',
        'lock_version' => 1,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.cases.edit', $case))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/User/CreateCase')
                ->where('adminMode', true)
                ->where('draftCase.patientName', 'Admin Edit Patient')
                ->where('draftCase.databaseId', $case->id)
        );

    $this->actingAs($admin)
        ->put(route('admin.cases.update', $case), [
            'intent' => 'draft',
            'client_id' => $case->client_id,
            'patient_name' => 'Admin Updated Patient',
            'lock_version' => 1,
        ])
        ->assertRedirect(route('admin.cases.index'));

    $case->refresh();

    expect($case->patient_name_snapshot)->toBe('Admin Updated Patient')
        ->and($case->status)->toBe(DentalCaseStatus::Submitted)
        ->and($case->lock_version)->toBe(2);
});

test('admin case update enforces the bridge rule and service enums on submit', function () {
    $admin = createAdminPanelUser('cases-bridge-rule@dev.com');
    $dentist = User::factory()->create();
    $dentist->assignRole(AppPermissions::DENTIST_ROLE);
    $case = DentalCase::factory()->configureFor($dentist)->submitted()->create(['lock_version' => 1]);

    $group = DentalProductGroup::factory()->create(['is_active' => true]);
    DentalProduct::factory()->create([
        'code' => 'crown',
        'name' => 'Crown / Retainer',
        'is_active' => true,
        'dental_product_group_id' => $group->id,
    ]);

    $crown = fn (int $tooth): array => [
        'product_key' => 'crown',
        'teeth' => [$tooth],
        'quantity' => 1,
        'kind' => 'tooth',
        'config' => [],
    ];
    $payload = [
        'intent' => 'submit',
        'client_id' => $case->client_id,
        'patient_name' => 'Admin Bridge Rule',
        'due_date' => now()->addDays(5)->toDateString(),
        'lock_version' => 1,
        'service' => 'design',
        'items' => json_encode([
            $crown(11),
            $crown(12),
            [...$crown(11), 'teeth' => [11, 12], 'quantity' => 2, 'kind' => 'bridge', 'bridge_from' => 11, 'bridge_to' => 12],
        ]),
    ];

    $this->actingAs($admin)
        ->put(route('admin.cases.update', $case), $payload)
        ->assertSessionHasErrors('items.2.kind');

    $this->actingAs($admin)
        ->put(route('admin.cases.update', $case), [...$payload, 'service' => 'teleport', 'items' => json_encode([$crown(11)])])
        ->assertSessionHasErrors('service');

    expect($case->fresh()->lock_version)->toBe(1);
});

test('all cases index includes database_id for Load', function () {
    $admin = createAdminPanelUser('cases-load-id@dev.com');
    $case = DentalCase::factory()->submitted()->create();

    $this->actingAs($admin)
        ->get(route('admin.cases.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->where('cases.0.database_id', $case->id)
        );
});

test('assignment center provides role-grouped assignment data', function () {
    $admin = createAdminPanelUser('assign-designer@dev.com');

    $this->actingAs($admin)
        ->get(route('admin.assignments.index'))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('backend/Admin/AssignmentCenter')
                ->has('roles')
                ->has('unassignedQueue')
                ->has('assignableUsers')
                ->has('designerQueue')
        );
});

test('authenticated admins can view remaining admin pages', function (string $routeName, string $component) {
    $admin = createAdminPanelUser($routeName.'@dev.com');

    $this->actingAs($admin)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component($component));
})->with([
    'assignments' => ['admin.assignments.index', 'backend/Admin/AssignmentCenter'],
    'design reviews' => ['admin.design-reviews.index', 'backend/Admin/DesignReviews'],
    'manufacturing' => ['admin.manufacturing.index', 'backend/Admin/ManufacturingOrders'],
    'products' => ['admin.products.index', 'backend/Admin/ProductsServices'],
    'billing' => ['admin.billing.index', 'backend/Admin/BillingFinance'],
    'reports' => ['admin.reports.index', 'backend/Admin/ReportsAnalytics'],
    'notifications' => ['admin.notifications.index', 'backend/Admin/Notifications'],
    'settings' => ['admin.settings.index', 'backend/Admin/SystemSettings'],
]);
