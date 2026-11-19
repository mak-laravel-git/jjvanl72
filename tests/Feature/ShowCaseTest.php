<?php

use App\Models\DentalCase;
use App\Models\DentalCaseFile;
use App\Models\DentalCaseItem;
use App\Models\DentalCaseItemTooth;
use App\Models\DentalClient;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

it('renders the show case page for a submitted case', function () {
    $client = DentalClient::factory()->create();
    $user = User::factory()->create(['client_id' => $client->id]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $case = DentalCase::factory()->configureFor($user)->submitted()->create([
        'patient_name_snapshot' => 'Show Patient',
    ]);

    $this->actingAs($user)
        ->get(route('cases.show', $case->case_number))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ShowCase')
                ->has('caseDetail')
                ->where('caseDetail.id', $case->case_number)
                ->where('caseDetail.patient', 'Show Patient')
                ->has('catalog')
                ->has('catalog.products')
        );
});

it('includes stored bridge items on the case show page', function () {
    $client = DentalClient::factory()->create();
    $user = User::factory()->create(['client_id' => $client->id]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $case = DentalCase::factory()->configureFor($user)->submitted()->create([
        'patient_name_snapshot' => 'Bridge Patient',
    ]);

    $abutment18 = DentalCaseItem::factory()->create([
        'case_id' => $case->id,
        'product_name_snapshot' => 'Crown / Retainer',
        'material_name_snapshot' => 'Zirconia',
        'quantity' => 1,
        'sort_order' => 0,
        'configuration_json' => [
            'kind' => 'tooth',
            'productKey' => 'crown',
        ],
    ]);
    DentalCaseItemTooth::factory()->create([
        'case_item_id' => $abutment18->id,
        'tooth_number' => 18,
    ]);

    $abutment15 = DentalCaseItem::factory()->create([
        'case_id' => $case->id,
        'product_name_snapshot' => 'Crown / Retainer',
        'material_name_snapshot' => 'Zirconia',
        'quantity' => 1,
        'sort_order' => 1,
        'configuration_json' => [
            'kind' => 'tooth',
            'productKey' => 'crown',
        ],
    ]);
    DentalCaseItemTooth::factory()->create([
        'case_item_id' => $abutment15->id,
        'tooth_number' => 15,
    ]);

    $bridge = DentalCaseItem::factory()->create([
        'case_id' => $case->id,
        'product_name_snapshot' => 'Crown / Retainer',
        'material_name_snapshot' => 'Zirconia',
        'quantity' => 4,
        'unit_price_minor' => 2000,
        'sort_order' => 2,
        'configuration_json' => [
            'kind' => 'bridge',
            'productKey' => 'crown',
            'bridgeFrom' => 18,
            'bridgeTo' => 15,
            'brokenEdges' => ['16-15'],
        ],
    ]);

    foreach ([18, 17, 16, 15] as $tooth) {
        DentalCaseItemTooth::factory()->create([
            'case_item_id' => $bridge->id,
            'tooth_number' => $tooth,
        ]);
    }

    $abutment18->update(['unit_price_minor' => 1500]);
    $abutment15->update(['unit_price_minor' => 1500]);

    $this->actingAs($user)
        ->get(route('cases.show', $case->case_number))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ShowCase')
                ->has('caseDetail.items', 3)
                ->where('caseDetail.items.2.kind', 'bridge')
                ->where('caseDetail.items.2.bridge_from', 18)
                ->where('caseDetail.items.2.bridge_to', 15)
                ->where('caseDetail.items.2.teeth', [18, 17, 16, 15])
                ->where('caseDetail.items.2.broken_edges', ['16-15'])
                ->where('caseDetail.items.2.quantity', 4)
                ->where('caseDetail.items.0.included_in_bridge', true)
                ->where('caseDetail.items.1.included_in_bridge', true)
                ->where('caseDetail.items.2.included_in_bridge', false)
                ->where('caseDetail.items.2.line_total', 80)
                ->where('caseDetail.cart_total', 80)
                ->has('caseDetail.teeth', 2)
                ->where('caseDetail.teeth.0.tooth_number', 18)
                ->where('caseDetail.teeth.0.product_key', 'crown')
                ->where('caseDetail.teeth.0.material', 'Zirconia')
                ->where('caseDetail.teeth.1.tooth_number', 15)
                ->where('caseDetail.teeth.1.product_key', 'crown')
        );
});

it('does not flatten bridge pontics into product rows on show', function () {
    $client = DentalClient::factory()->create();
    $user = User::factory()->create(['client_id' => $client->id]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $case = DentalCase::factory()->configureFor($user)->submitted()->create();
    $bridge = DentalCaseItem::factory()->create([
        'case_id' => $case->id,
        'quantity' => 4,
        'configuration_json' => [
            'kind' => 'bridge',
            'productKey' => 'crown',
            'bridgeFrom' => 18,
            'bridgeTo' => 15,
            'brokenEdges' => [],
        ],
    ]);

    foreach ([18, 17, 16, 15] as $tooth) {
        DentalCaseItemTooth::factory()->create([
            'case_item_id' => $bridge->id,
            'tooth_number' => $tooth,
        ]);
    }

    $this->actingAs($user)
        ->get(route('cases.show', $case->case_number))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->has('caseDetail.items', 1)
                ->where('caseDetail.items.0.kind', 'bridge')
                ->where('caseDetail.items.0.teeth', [18, 17, 16, 15])
                ->has('caseDetail.teeth', 0)
        );
});

it('returns 404 for a non-existent case', function () {
    $client = DentalClient::factory()->create();
    $user = User::factory()->create(['client_id' => $client->id]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('cases.show', 'INVALID-999'))
        ->assertNotFound();
});

it('returns 404 when another dentist views a case', function () {
    $client = DentalClient::factory()->create();
    $owner = User::factory()->create(['client_id' => $client->id]);
    $owner->assignRole(AppPermissions::DENTIST_ROLE);
    $case = DentalCase::factory()->configureFor($owner)->submitted()->create();

    $otherClient = DentalClient::factory()->create();
    $other = User::factory()->create(['client_id' => $otherClient->id]);
    $other->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($other)
        ->get(route('cases.show', $case->case_number))
        ->assertNotFound();
});

it('requires authentication to view a case', function () {
    $this->get(route('cases.show', 'ADX-41109'))
        ->assertRedirect();
});

it('downloads case files as a zip for the owning dentist', function () {
    Storage::fake('local');

    $client = DentalClient::factory()->create();
    $user = User::factory()->create(['client_id' => $client->id]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $case = DentalCase::factory()->configureFor($user)->submitted()->create();
    $path = 'dental-cases/'.$case->id.'/upper.stl';
    Storage::disk('local')->put($path, 'upper-scan-bytes');

    DentalCaseFile::factory()->create([
        'case_id' => $case->id,
        'requirement_code_snapshot' => 'upperArch',
        'storage_disk' => 'local',
        'storage_path' => $path,
        'original_name' => 'upper.stl',
        'uploaded_by_user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->get(route('cases.files.download', $case->case_number));

    $response->assertOk()
        ->assertDownload($case->case_number.'-files.zip');
});

it('returns 404 when downloading files for another dentist case', function () {
    Storage::fake('local');

    $owner = User::factory()->create([
        'client_id' => DentalClient::factory()->create()->id,
    ]);
    $owner->assignRole(AppPermissions::DENTIST_ROLE);
    $case = DentalCase::factory()->configureFor($owner)->submitted()->create();
    $path = 'dental-cases/'.$case->id.'/upper.stl';
    Storage::disk('local')->put($path, 'bytes');

    DentalCaseFile::factory()->create([
        'case_id' => $case->id,
        'storage_disk' => 'local',
        'storage_path' => $path,
        'uploaded_by_user_id' => $owner->id,
    ]);

    $other = User::factory()->create([
        'client_id' => DentalClient::factory()->create()->id,
    ]);
    $other->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($other)
        ->get(route('cases.files.download', $case->case_number))
        ->assertNotFound();
});

it('returns 404 when the case has no files to download', function () {
    $client = DentalClient::factory()->create();
    $user = User::factory()->create(['client_id' => $client->id]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);
    $case = DentalCase::factory()->configureFor($user)->submitted()->create();

    $this->actingAs($user)
        ->get(route('cases.files.download', $case->case_number))
        ->assertNotFound();
});

it('marks show page as having downloadable files when uploads exist', function () {
    Storage::fake('local');

    $client = DentalClient::factory()->create();
    $user = User::factory()->create(['client_id' => $client->id]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);
    $case = DentalCase::factory()->configureFor($user)->submitted()->create();
    $path = 'dental-cases/'.$case->id.'/bite.stl';
    Storage::disk('local')->put($path, 'bite');

    DentalCaseFile::factory()->create([
        'case_id' => $case->id,
        'storage_disk' => 'local',
        'storage_path' => $path,
        'uploaded_by_user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('cases.show', $case->case_number))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->where('caseDetail.has_downloadable_files', true)
        );
});
