<?php

use App\Enums\CaseService;
use App\Enums\DentalCaseStatus;
use App\Enums\ParameterType;
use App\Models\DentalCase;
use App\Models\DentalClient;
use App\Models\DentalMaterial;
use App\Models\DentalPackagePrice;
use App\Models\DentalProduct;
use App\Models\DentalProductGroup;
use App\Models\Parameter;
use App\Models\ParameterGroup;
use App\Models\ParameterOption;
use App\Models\User;
use App\Support\AppPermissions;
use App\Support\CaseCreateCatalog;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

it('renders the create case page for a dentist', function () {
    $user = User::factory()->create();
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->get(route('cases.create'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/CreateCase')
                ->has('caseReference')
                ->has('catalog')
                ->has('catalog.productGroups')
                ->has('catalog.products')
                ->has('catalog.materialsByProduct')
                ->has('catalog.materialsByGroup')
                ->has('catalog.protocols')
                ->has('catalog.shades')
                ->has('clients')
        );
});

it('passes a case reference string to the page', function () {
    $client = DentalClient::factory()->create();
    $user = User::factory()->create(['client_id' => $client->id]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $group = DentalProductGroup::factory()->create([
        'is_active' => true,
        'sort_order' => 1,
    ]);
    DentalProduct::factory()->create([
        'code' => 'crown',
        'name' => 'Crown / Retainer',
        'is_active' => true,
        'dental_product_group_id' => $group->id,
    ]);

    $this->actingAs($user)
        ->get(route('cases.create'))
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->where('caseReference', '')
                ->where('client.name', $client->name)
                ->where('clients.0.id', $client->id)
                ->where('catalog.source', 'database')
                ->has('catalog.products.crown')
                ->where('catalog.products.crown.key', 'crown')
        );
});

it('requires authentication to access the create case page', function () {
    $this->get(route('cases.create'))
        ->assertRedirect();
});

it('builds the create-case catalog from active dental products', function () {
    $group = DentalProductGroup::factory()->create([
        'code' => 'crown-bridge',
        'name' => 'Crown and Bridge',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $product = DentalProduct::factory()->create([
        'code' => 'CROWN',
        'name' => 'Crown / Retainer',
        'is_active' => true,
        'sort_order' => 1,
        'dental_product_group_id' => $group->id,
    ]);
    $material = DentalMaterial::factory()->create([
        'code' => 'ZIR',
        'name' => 'Zirconia',
        'is_active' => true,
    ]);
    $product->materials()->attach($material->id, [
        'sort_order' => 1,
        'is_default' => true,
    ]);

    $parameterGroup = ParameterGroup::factory()->create([
        'name' => 'Restoration Options',
        'sort_order' => 2,
        'is_active' => true,
    ]);
    $parameter = Parameter::factory()->create([
        'name' => 'Contour',
        'field_name' => 'contour',
        'group_id' => $parameterGroup->id,
        'product_id' => $product->id,
        'material_id' => $material->id,
        'type' => ParameterType::Option,
    ]);
    ParameterOption::factory()->create([
        'parameter_id' => $parameter->id,
        'label' => 'Full Contour',
        'value' => 'Full Contour',
    ]);

    $catalog = CaseCreateCatalog::fromDatabase();

    expect($catalog['source'])->toBe('database')
        ->and($catalog['productGroups'])->toHaveCount(1)
        ->and($catalog['products'])->toHaveKey('crown')
        ->and($catalog['products']['crown']['label'])->toBe('Crown / Retainer')
        ->and($catalog['materialsByProduct']['crown'][0]['name'])->toBe('Zirconia')
        ->and($catalog['materialsByProduct']['crown'][0]['id'])->toBe($material->id)
        ->and($catalog['products']['crown']['parameters'][0]['fieldName'])->toBe('contour')
        ->and($catalog['products']['crown']['parameters'][0]['materialId'])->toBe($material->id)
        ->and($catalog['products']['crown']['parameters'][0]['groupId'])->toBe($parameterGroup->id)
        ->and($catalog['products']['crown']['parameters'][0]['groupName'])->toBe('Restoration Options')
        ->and($catalog['products']['crown']['parameters'][0]['groupSortOrder'])->toBe(2)
        ->and($catalog['products']['crown']['parameters'][0]['options'][0]['label'])->toBe('Full Contour');
});

it('returns an empty database catalog when no active products exist', function () {
    $catalog = CaseCreateCatalog::forPortal();

    expect($catalog['source'])->toBe('database')
        ->and($catalog['productGroups'])->toBe([])
        ->and($catalog['products'])->toBe([])
        ->and($catalog['materialsByProduct'])->toBe([])
        ->and($catalog['shades'])->not->toBeEmpty();
});

it('marks forPortal catalog as database when active products exist', function () {
    $group = DentalProductGroup::factory()->create([
        'is_active' => true,
        'sort_order' => 1,
    ]);
    DentalProduct::factory()->create([
        'code' => 'ONLAY',
        'name' => 'Onlay',
        'is_active' => true,
        'dental_product_group_id' => $group->id,
    ]);

    $catalog = CaseCreateCatalog::forPortal();

    expect($catalog['source'])->toBe('database')
        ->and($catalog['products'])->toHaveKey('onlay');
});

function createCaseDentist(): User
{
    $client = DentalClient::factory()->create(['is_active' => true]);
    $user = User::factory()->create(['client_id' => $client->id]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    return $user;
}

/**
 * @return array{product: DentalProduct, material: DentalMaterial}
 */
function createCrownCatalog(): array
{
    $group = DentalProductGroup::factory()->create(['is_active' => true]);
    $product = DentalProduct::factory()->create([
        'code' => 'CROWN',
        'name' => 'Crown / Retainer',
        'is_active' => true,
        'dental_product_group_id' => $group->id,
    ]);
    $material = DentalMaterial::factory()->create([
        'name' => 'Zirconia',
        'is_active' => true,
    ]);
    $product->materials()->attach($material->id, [
        'sort_order' => 1,
        'is_default' => true,
    ]);

    return ['product' => $product, 'material' => $material];
}

it('does not save a draft without a client', function () {
    $user = User::factory()->create(['client_id' => null]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'patient_name' => 'Jane Doe',
        ])
        ->assertSessionHasErrors('client_id');

    expect(DentalCase::query()->count())->toBe(0);
});

it('saves a draft case with a new patient', function () {
    $user = createCaseDentist();

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Jane Doe',
            'due_date' => now()->addWeek()->toDateString(),
            'notes' => 'Night guard notes',
        ])
        ->assertRedirect();

    $case = DentalCase::query()->first();

    expect($case)->not->toBeNull()
        ->and($case->status)->toBe(DentalCaseStatus::Draft)
        ->and($case->created_by)->toBe($user->id)
        ->and($case->client_id)->toBe($user->client_id)
        ->and($case->patient_name_snapshot)->toBe('Jane Doe');

    $this->assertDatabaseHas('patients', [
        'id' => $case->patient_id,
        'name' => 'Jane Doe',
    ]);
});

it('saves a draft for a picked client when the dentist has no assigned client', function () {
    $user = User::factory()->create(['client_id' => null]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);
    $client = DentalClient::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $client->id,
            'patient_name' => 'Picked Client Patient',
        ])
        ->assertRedirect();

    $case = DentalCase::query()->first();

    expect($case)->not->toBeNull()
        ->and($case->client_id)->toBe($client->id)
        ->and($case->created_by)->toBe($user->id);
});

it('saves a draft against a different client than the dentist assigned client', function () {
    $user = createCaseDentist();
    $otherClient = DentalClient::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $otherClient->id,
            'patient_name' => 'Other Practice Patient',
        ])
        ->assertRedirect();

    expect(DentalCase::query()->first()?->client_id)->toBe($otherClient->id);
});

it('allows multiple drafts for the same client', function () {
    $user = createCaseDentist();

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'First Case',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Second Case',
        ])
        ->assertRedirect();

    expect(DentalCase::query()->where('client_id', $user->client_id)->count())->toBe(2);
});

it('saves prescription items and teeth on a draft', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Alex Patient',
            'due_date' => now()->addDays(10)->toDateString(),
            'items' => json_encode([
                [
                    'product_key' => 'crown',
                    'teeth' => [11, 12],
                    'arch' => 'upper',
                    'quantity' => 2,
                    'material' => 'Zirconia',
                    'material_id' => $catalog['material']->id,
                    'shade' => 'A2',
                    'config' => [],
                    'kind' => 'tooth',
                ],
            ]),
        ])
        ->assertRedirect();

    $case = DentalCase::query()->with(['items.teeth'])->first();

    expect($case?->items)->toHaveCount(1)
        ->and($case->items->first()->product_id)->toBe($catalog['product']->id)
        ->and($case->items->first()->material_id)->toBe($catalog['material']->id)
        ->and($case->items->first()->teeth->pluck('tooth_number')->all())->toEqual([11, 12]);
});

it('saves bridge span and connector breaks on a draft', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Bridge Patient',
            'items' => json_encode([
                [
                    'product_key' => 'crown',
                    'teeth' => [18],
                    'arch' => 'upper',
                    'quantity' => 1,
                    'material' => 'Zirconia',
                    'material_id' => $catalog['material']->id,
                    'shade' => 'A2',
                    'config' => [],
                    'kind' => 'tooth',
                ],
                [
                    'product_key' => 'crown',
                    'teeth' => [15],
                    'arch' => 'upper',
                    'quantity' => 1,
                    'material' => 'Zirconia',
                    'material_id' => $catalog['material']->id,
                    'shade' => 'A2',
                    'config' => [],
                    'kind' => 'tooth',
                ],
                [
                    'product_key' => 'crown',
                    'teeth' => [18, 17, 16, 15],
                    'arch' => 'upper',
                    'quantity' => 1,
                    'material' => 'Zirconia',
                    'material_id' => $catalog['material']->id,
                    'shade' => 'A2',
                    'config' => [],
                    'kind' => 'bridge',
                    'bridge_from' => 18,
                    'bridge_to' => 15,
                    'broken_edges' => ['16-15'],
                ],
            ]),
        ])
        ->assertRedirect();

    $case = DentalCase::query()->with(['items.teeth'])->first();
    $toothItems = $case?->items->filter(
        fn ($item) => ($item->configuration_json['kind'] ?? 'tooth') === 'tooth',
    );
    $bridge = $case?->items->first(
        fn ($item) => ($item->configuration_json['kind'] ?? '') === 'bridge',
    );

    expect($case?->items)->toHaveCount(3)
        ->and($toothItems)->toHaveCount(2)
        ->and($toothItems->flatMap->teeth->pluck('tooth_number')->sort()->values()->all())->toEqual([15, 18])
        ->and($bridge)->not->toBeNull()
        ->and($bridge->quantity)->toBe(4)
        ->and($bridge->configuration_json['bridgeFrom'])->toBe(18)
        ->and($bridge->configuration_json['bridgeTo'])->toBe(15)
        ->and($bridge->configuration_json['brokenEdges'])->toBe(['16-15'])
        ->and($bridge->teeth->pluck('tooth_number')->all())->toEqual([18, 17, 16, 15]);
});

it('submits a case with files and marks it submitted', function () {
    Storage::fake('local');

    $user = createCaseDentist();
    $catalog = createCrownCatalog();

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'submit',
            'client_id' => $user->client_id,
            'patient_name' => 'Sam Scan',
            'due_date' => now()->addDays(5)->toDateString(),
            'impression_type' => 'Intra Oral Scan',
            'items' => json_encode([
                [
                    'product_key' => 'crown',
                    'teeth' => [21],
                    'arch' => 'upper',
                    'quantity' => 1,
                    'material_id' => $catalog['material']->id,
                    'material' => 'Zirconia',
                    'shade' => 'A3',
                    'config' => [],
                    'kind' => 'tooth',
                ],
            ]),
            'files' => [
                'upperArch' => [UploadedFile::fake()->create('upper.stl', 20)],
                'lowerArch' => [UploadedFile::fake()->create('lower.stl', 20)],
                'biteScan' => [UploadedFile::fake()->create('bite.stl', 20)],
            ],
        ])
        ->assertRedirect(route('cases.active'));

    $case = DentalCase::query()->with('files')->first();

    expect($case?->status)->toBe(DentalCaseStatus::Submitted)
        ->and($case->submitted_at)->not->toBeNull()
        ->and($case->files)->toHaveCount(3);

    Storage::disk('local')->assertExists($case->files->first()->storage_path);
});

it('allows submit without required protocol files', function () {
    $user = createCaseDentist();
    createCrownCatalog();

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'submit',
            'client_id' => $user->client_id,
            'patient_name' => 'No Files',
            'due_date' => now()->addDays(5)->toDateString(),
            'impression_type' => 'Intra Oral Scan',
            'items' => json_encode([
                [
                    'product_key' => 'crown',
                    'teeth' => [11],
                    'arch' => 'upper',
                    'quantity' => 1,
                    'material' => 'Zirconia',
                    'kind' => 'tooth',
                ],
            ]),
        ])
        ->assertRedirect(route('cases.active'));

    expect(DentalCase::query()->first()?->status)->toBe(DentalCaseStatus::Submitted);
});

it('accepts custom-labeled upload files without a size limit rule', function () {
    Storage::fake('local');

    $user = createCaseDentist();
    $catalog = createCrownCatalog();

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'submit',
            'client_id' => $user->client_id,
            'patient_name' => 'Custom Upload',
            'due_date' => now()->addDays(5)->toDateString(),
            'impression_type' => 'Intra Oral Scan',
            'items' => json_encode([
                [
                    'product_key' => 'crown',
                    'teeth' => [21],
                    'arch' => 'upper',
                    'quantity' => 1,
                    'material_id' => $catalog['material']->id,
                    'material' => 'Zirconia',
                    'shade' => 'A3',
                    'config' => [],
                    'kind' => 'tooth',
                ],
            ]),
            'files' => [
                'upper-arch-custom' => [UploadedFile::fake()->create('big-scan.stl', 100)],
            ],
        ])
        ->assertRedirect(route('cases.active'));

    $case = DentalCase::query()->with('files')->first();

    expect($case?->files)->toHaveCount(1)
        ->and($case->files->first()?->requirement_code_snapshot)->toBe('upper-arch-custom');
});

it('hydrates a draft on the edit page', function () {
    $user = createCaseDentist();
    $case = DentalCase::factory()->configureFor($user)->create([
        'patient_name_snapshot' => 'Hydrated Patient',
        'status' => DentalCaseStatus::Draft,
    ]);

    $this->actingAs($user)
        ->get(route('cases.edit', $case))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/CreateCase')
                ->where('draftCase.patientName', 'Hydrated Patient')
                ->where('draftCase.databaseId', $case->id)
                ->where('draftCase.clientId', $case->client_id)
                ->has('clients')
                ->where('caseReference', $case->case_number)
        );
});

it('returns 404 when another dentist edits a case', function () {
    $owner = createCaseDentist();
    $case = DentalCase::factory()->configureFor($owner)->create();

    $other = createCaseDentist();

    $this->actingAs($other)
        ->get(route('cases.edit', $case))
        ->assertNotFound();
});

it('allows editing a submitted case for the owning dentist', function () {
    $user = createCaseDentist();
    $case = DentalCase::factory()->configureFor($user)->submitted()->create([
        'patient_name_snapshot' => 'Submitted Patient',
    ]);

    $this->actingAs($user)
        ->get(route('cases.edit', $case))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/CreateCase')
                ->where('draftCase.patientName', 'Submitted Patient')
                ->where('draftCase.databaseId', $case->id)
                ->where('adminMode', false)
        );
});

it('updates a submitted case without changing status on draft save', function () {
    $user = createCaseDentist();
    $case = DentalCase::factory()->configureFor($user)->submitted()->create([
        'patient_name_snapshot' => 'Old Submitted',
        'lock_version' => 1,
    ]);

    $this->actingAs($user)
        ->put(route('cases.update', $case), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Updated Submitted',
            'lock_version' => 1,
        ])
        ->assertRedirect(route('cases.edit', $case));

    $case->refresh();

    expect($case->patient_name_snapshot)->toBe('Updated Submitted')
        ->and($case->status)->toBe(DentalCaseStatus::Submitted)
        ->and($case->lock_version)->toBe(2);
});

it('includes database_id on the case show page for Load', function () {
    $user = createCaseDentist();
    $case = DentalCase::factory()->configureFor($user)->submitted()->create();

    $this->actingAs($user)
        ->get(route('cases.show', $case->case_number))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->where('caseDetail.database_id', $case->id)
                ->where('caseDetail.id', $case->case_number)
        );
});

it('updates an existing draft', function () {
    $user = createCaseDentist();
    $case = DentalCase::factory()->configureFor($user)->create([
        'patient_name_snapshot' => 'Old Name',
        'lock_version' => 1,
    ]);

    $this->actingAs($user)
        ->put(route('cases.update', $case), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'New Name',
            'lock_version' => 1,
        ])
        ->assertRedirect(route('cases.edit', $case));

    $case->refresh();

    expect($case->patient_name_snapshot)->toBe('New Name')
        ->and($case->lock_version)->toBe(2)
        ->and($case->patient?->name)->toBe('New Name');
});

it('lists this dentist draft cases only', function () {
    $user = createCaseDentist();
    $mine = DentalCase::factory()->configureFor($user)->create([
        'patient_name_snapshot' => 'Draft Patient',
    ]);
    $other = createCaseDentist();
    DentalCase::factory()->configureFor($other)->create();

    $this->actingAs($user)
        ->get(route('cases.drafts'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/DraftCases')
                ->has('cases', 1)
                ->where('cases.0.databaseId', $mine->id)
                ->where('cases.0.patient', 'Draft Patient')
        );
});

it('lists submitted cases on the active page', function () {
    $user = createCaseDentist();
    $case = DentalCase::factory()->configureFor($user)->submitted()->create([
        'patient_name_snapshot' => 'Active Patient',
    ]);
    DentalCase::factory()->configureFor($user)->create();

    $this->actingAs($user)
        ->get(route('cases.active'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->component('backend/User/ActiveCases')
                ->has('cases', 1)
                ->where('cases.0.id', $case->case_number)
                ->where('cases.0.patient', 'Active Patient')
                ->where('cases.0.actions', ['view', 'edit'])
                ->where('cases.0.databaseId', $case->id)
        );
});

it('exposes package prices on the create case catalog', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();

    DentalPackagePrice::factory()->create([
        'dental_product_id' => $catalog['product']->id,
        'dental_material_id' => $catalog['material']->id,
        'service' => CaseService::Design,
        'price_minor' => 2500,
    ]);

    $this->actingAs($user)
        ->get(route('cases.create'))
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->has('catalog.packagePrices', 1)
                ->where('catalog.packagePrices.0.price', 25)
        );
});

it('persists resolved package unit price and dentist override', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $productKey = CaseCreateCatalog::productKey($catalog['product']);

    DentalPackagePrice::factory()->create([
        'dental_product_id' => $catalog['product']->id,
        'dental_material_id' => $catalog['material']->id,
        'service' => CaseService::Design,
        'price_minor' => 1000,
    ]);

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Price Patient',
            'due_date' => now()->addWeek()->toDateString(),
            'service' => 'design',
            'items' => json_encode([
                [
                    'id' => 'item-1',
                    'product_key' => $productKey,
                    'teeth' => [11],
                    'quantity' => 1,
                    'material' => 'Zirconia',
                    'material_id' => $catalog['material']->id,
                    'shade' => 'A2',
                    'config' => [],
                    'kind' => 'tooth',
                    'price_overridden' => false,
                ],
                [
                    'id' => 'item-2',
                    'product_key' => $productKey,
                    'teeth' => [21],
                    'quantity' => 1,
                    'material' => 'Zirconia',
                    'material_id' => $catalog['material']->id,
                    'shade' => 'B1',
                    'config' => [],
                    'kind' => 'tooth',
                    'unit_price' => 55.5,
                    'price_overridden' => true,
                ],
            ]),
        ])
        ->assertRedirect();

    $case = DentalCase::query()->with(['items.teeth'])->first();

    expect($case?->items)->toHaveCount(2);

    $defaultItem = $case->items->first(
        fn ($item) => $item->teeth->contains('tooth_number', 11),
    );
    $overrideItem = $case->items->first(
        fn ($item) => $item->teeth->contains('tooth_number', 21),
    );

    expect($defaultItem)->not->toBeNull()
        ->and($defaultItem->unit_price_minor)->toBe(1000)
        ->and($overrideItem)->not->toBeNull()
        ->and($overrideItem->unit_price_minor)->toBe(5550)
        ->and($overrideItem->configuration_json['priceOverridden'] ?? false)->toBeTrue();
});

it('persists distinct per-item tooth shades', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $productKey = CaseCreateCatalog::productKey($catalog['product']);

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Shade Patient',
            'shade' => 'A2',
            'service' => 'design',
            'items' => json_encode([
                [
                    'id' => 'shade-a2',
                    'product_key' => $productKey,
                    'teeth' => [11],
                    'quantity' => 1,
                    'material_id' => $catalog['material']->id,
                    'shade' => 'A2',
                    'shade_overridden' => false,
                    'config' => [],
                    'kind' => 'tooth',
                ],
                [
                    'id' => 'shade-b1',
                    'product_key' => $productKey,
                    'teeth' => [21],
                    'quantity' => 1,
                    'material_id' => $catalog['material']->id,
                    'shade' => 'B1',
                    'shade_overridden' => true,
                    'config' => [],
                    'kind' => 'tooth',
                ],
            ]),
        ])
        ->assertRedirect();

    $case = DentalCase::query()->with(['items.teeth'])->first();
    $shadeA2 = $case?->items->first(
        fn ($item) => $item->teeth->contains('tooth_number', 11),
    );
    $shadeB1 = $case?->items->first(
        fn ($item) => $item->teeth->contains('tooth_number', 21),
    );

    expect($shadeA2?->shade)->toBe('A2')
        ->and($shadeA2?->configuration_json['shadeOverridden'] ?? false)->toBeFalse()
        ->and($shadeB1?->shade)->toBe('B1')
        ->and($shadeB1?->configuration_json['shadeOverridden'] ?? false)->toBeTrue();
});

it('persists bridge group shade from the first abutment shade', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $productKey = CaseCreateCatalog::productKey($catalog['product']);

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Bridge Shade',
            'shade' => 'A2',
            'service' => 'design',
            'items' => json_encode([
                [
                    'product_key' => $productKey,
                    'teeth' => [11],
                    'quantity' => 1,
                    'material_id' => $catalog['material']->id,
                    'shade' => 'A3',
                    'shade_overridden' => false,
                    'kind' => 'tooth',
                    'config' => [],
                ],
                [
                    'product_key' => $productKey,
                    'teeth' => [13],
                    'quantity' => 1,
                    'material_id' => $catalog['material']->id,
                    'shade' => 'A3',
                    'shade_overridden' => false,
                    'kind' => 'tooth',
                    'config' => [],
                ],
                [
                    'product_key' => $productKey,
                    'teeth' => [11, 12, 13],
                    'quantity' => 3,
                    'material_id' => $catalog['material']->id,
                    'shade' => 'A3',
                    'shade_overridden' => false,
                    'kind' => 'bridge',
                    'bridge_from' => 11,
                    'bridge_to' => 13,
                    'broken_edges' => [],
                    'config' => [],
                ],
            ]),
        ])
        ->assertRedirect();

    $case = DentalCase::query()->with('items')->first();
    $bridge = $case?->items->first(
        fn ($item) => ($item->configuration_json['kind'] ?? '') === 'bridge',
    );

    expect($bridge?->shade)->toBe('A3')
        ->and($case?->items->every(fn ($item) => $item->shade === 'A3'))->toBeTrue();
});

it('stores bridge quantity as span tooth count with package price', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $productKey = CaseCreateCatalog::productKey($catalog['product']);

    DentalPackagePrice::factory()->create([
        'dental_product_id' => $catalog['product']->id,
        'service' => CaseService::Design,
        'price_minor' => 2000,
    ]);

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Bridge Patient',
            'service' => 'design',
            'items' => json_encode([
                [
                    'id' => 'bridge-1',
                    'product_key' => $productKey,
                    'teeth' => [11, 12, 13],
                    'quantity' => 3,
                    'material_id' => null,
                    'kind' => 'bridge',
                    'bridge_from' => 11,
                    'bridge_to' => 13,
                    'broken_edges' => [],
                    'config' => [],
                    'price_overridden' => false,
                ],
            ]),
        ])
        ->assertRedirect();

    $bridge = DentalCase::query()->with('items')->first()?->items->first();

    expect($bridge?->quantity)->toBe(3)
        ->and($bridge?->unit_price_minor)->toBe(2000)
        ->and($bridge?->configuration_json['kind'] ?? null)->toBe('bridge');
});

it('forces bridge quantity to the span tooth count when client under-reports', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $productKey = CaseCreateCatalog::productKey($catalog['product']);

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Bridge Qty',
            'service' => 'design',
            'items' => json_encode([
                [
                    'product_key' => $productKey,
                    'teeth' => [11, 12, 13],
                    'quantity' => 1,
                    'kind' => 'bridge',
                    'bridge_from' => 11,
                    'bridge_to' => 13,
                    'broken_edges' => [],
                    'config' => [],
                ],
            ]),
        ])
        ->assertRedirect();

    expect(DentalCase::query()->with('items')->first()?->items->first()?->quantity)->toBe(3);
});

it('persists partial toothFeatures clasp and rests on a draft item', function () {
    $user = createCaseDentist();
    $group = DentalProductGroup::factory()->create([
        'code' => 'partial-dentures',
        'name' => 'Partial Dentures',
        'is_active' => true,
    ]);
    $product = DentalProduct::factory()->create([
        'code' => 'castPartial',
        'name' => 'Cast Partial Denture',
        'is_active' => true,
        'dental_product_group_id' => $group->id,
    ]);
    $material = DentalMaterial::factory()->create([
        'name' => 'CrCo Frame',
        'is_active' => true,
    ]);
    $product->materials()->attach($material->id, [
        'sort_order' => 1,
        'is_default' => true,
    ]);

    $toothFeatures = [
        '14' => [
            'clasp' => 'Akers Clasp',
            'rests' => 'Mesial Occlusal Rest',
        ],
        '15' => [
            'clasp' => 'RPI Clasp',
        ],
    ];

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Partial Features Patient',
            'due_date' => now()->addDays(8)->toDateString(),
            'items' => json_encode([
                [
                    'product_key' => 'castPartial',
                    'teeth' => [14, 15],
                    'arch' => '',
                    'quantity' => 1,
                    'material' => 'CrCo Frame',
                    'material_id' => $material->id,
                    'shade' => 'A2',
                    'config' => [
                        'framework' => 'Horseshoe',
                        'clasp' => 'Akers Clasp',
                        'rests' => 'Mesial Occlusal Rest',
                        'toothFeatures' => json_encode($toothFeatures),
                        'information' => '',
                    ],
                    'kind' => 'tooth',
                ],
            ]),
        ])
        ->assertRedirect();

    $item = DentalCase::query()->with('items')->first()?->items->first();
    $storedFeatures = json_decode(
        (string) ($item?->configuration_json['config']['toothFeatures'] ?? ''),
        true,
    );

    expect($item)->not->toBeNull()
        ->and($item->product_id)->toBe($product->id)
        ->and($storedFeatures)->toBe($toothFeatures)
        ->and($item->configuration_json['config']['clasp'] ?? null)->toBe('Akers Clasp')
        ->and($item->configuration_json['config']['rests'] ?? null)->toBe('Mesial Occlusal Rest');
});

it('stores a prescription pdf when uploaded with case items', function () {
    Storage::fake('local');

    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $productKey = CaseCreateCatalog::productKey($catalog['product']);

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'PDF Patient',
            'service' => 'design',
            'items' => json_encode([
                [
                    'product_key' => $productKey,
                    'teeth' => [11],
                    'quantity' => 1,
                    'material_id' => $catalog['material']->id,
                    'kind' => 'tooth',
                    'config' => [],
                ],
            ]),
            'files' => [
                'prescription' => [
                    UploadedFile::fake()->create('Prescription.pdf', 12, 'application/pdf'),
                ],
            ],
        ])
        ->assertRedirect();

    $case = DentalCase::query()->with('files')->first();
    $prescription = $case?->files->first(
        fn ($file) => $file->requirement_code_snapshot === 'prescription',
    );

    expect($prescription)->not->toBeNull()
        ->and($prescription->original_name)->toBe('Prescription.pdf');

    Storage::disk('local')->assertExists($prescription->storage_path);
});

it('prices manufacture items by output without method or model service', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $productKey = CaseCreateCatalog::productKey($catalog['product']);

    foreach ([['appliance', 7000], ['applianceModels', 9500]] as [$output, $price]) {
        DentalPackagePrice::factory()->manufacture()->create([
            'dental_product_id' => $catalog['product']->id,
            'dental_material_id' => $catalog['material']->id,
            'output' => $output,
            'price_minor' => $price,
        ]);
    }

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Manufacture Patient',
            'service' => 'manufacture',
            'output' => 'applianceModels',
            // Stale clients may still send these; they must have no effect.
            'manufacture_method' => 'print',
            'model_service' => 'designPrint',
            'items' => json_encode([
                [
                    'product_key' => $productKey,
                    'teeth' => [11],
                    'quantity' => 1,
                    'material_id' => $catalog['material']->id,
                    'kind' => 'tooth',
                    'config' => [],
                ],
            ]),
        ])
        ->assertRedirect();

    $case = DentalCase::query()->with('items')->firstOrFail();

    expect($case->items->first()->unit_price_minor)->toBe(9500)
        ->and($case->configuration_json['service'])->toBe('manufacture')
        ->and($case->configuration_json['output'])->toBe('applianceModels')
        ->and($case->configuration_json)->not->toHaveKeys(['manufactureMethod', 'modelService']);
});

it('rejects an unknown service or output with a validation error', function () {
    $user = createCaseDentist();

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Bad Service',
            'service' => 'teleport',
        ])
        ->assertSessionHasErrors('service');

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Bad Output',
            'service' => 'manufacture',
            'output' => 'everything',
        ])
        ->assertSessionHasErrors('output');

    expect(DentalCase::query()->count())->toBe(0);
});

it('derives the manufacturing type from the material instead of a stored method', function () {
    $user = createCaseDentist();
    $group = DentalProductGroup::factory()->create(['is_active' => true]);
    $product = DentalProduct::factory()->create([
        'code' => 'fullDenture',
        'name' => 'Full Denture',
        'is_active' => true,
        'dental_product_group_id' => $group->id,
    ]);
    $material = DentalMaterial::factory()->create([
        'name' => 'High Impact Printed',
        'is_active' => true,
    ]);
    $product->materials()->attach($material->id, ['sort_order' => 1, 'is_default' => true]);

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Printed Denture',
            'service' => 'manufacture',
            'output' => 'appliance',
            'items' => json_encode([
                [
                    'product_key' => 'fullDenture',
                    'teeth' => [],
                    'arch' => 'upper',
                    'quantity' => 1,
                    'material' => 'High Impact Printed',
                    'material_id' => $material->id,
                    'kind' => 'tooth',
                    'config' => [],
                ],
            ]),
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->get(route('cases.drafts'))
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->where('cases.0.manufacturing_type', 'print'),
        );
});

/**
 * @param  list<array<string, mixed>>  $items
 * @return array<string, mixed>
 */
function bridgeSubmitPayload(User $user, array $items): array
{
    return [
        'intent' => 'submit',
        'client_id' => $user->client_id,
        'patient_name' => 'Bridge Rule Patient',
        'due_date' => now()->addDays(5)->toDateString(),
        'service' => 'design',
        'items' => json_encode($items),
    ];
}

/**
 * @return array{crown: array<string, mixed>, pontic: array<string, mixed>, bridge: array<string, mixed>}
 */
function bridgeRuleItems(array $catalog, int $ponticTooth = 12): array
{
    DentalProduct::factory()->create([
        'code' => 'pontic',
        'name' => 'Pontic',
        'is_active' => true,
        'dental_product_group_id' => $catalog['product']->dental_product_group_id,
    ]);

    $crown = [
        'product_key' => 'crown',
        'teeth' => [11],
        'quantity' => 1,
        'material_id' => $catalog['material']->id,
        'material' => 'Zirconia',
        'kind' => 'tooth',
        'config' => [],
    ];
    $pontic = [
        'product_key' => 'pontic',
        'teeth' => [$ponticTooth],
        'quantity' => 1,
        'kind' => 'tooth',
        'config' => [],
    ];
    $bridge = [
        'product_key' => 'crown',
        'teeth' => [11, 12],
        'quantity' => 2,
        'material_id' => $catalog['material']->id,
        'material' => 'Zirconia',
        'kind' => 'bridge',
        'bridge_from' => 11,
        'bridge_to' => 12,
        'broken_edges' => [],
        'config' => [],
    ];

    return ['crown' => $crown, 'pontic' => $pontic, 'bridge' => $bridge];
}

it('submits a bridge made of a crown and an explicit pontic', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $items = bridgeRuleItems($catalog);

    $this->actingAs($user)
        ->post(route('cases.store'), bridgeSubmitPayload($user, [$items['crown'], $items['pontic'], $items['bridge']]))
        ->assertRedirect(route('cases.active'));

    expect(DentalCase::query()->first()?->status)->toBe(DentalCaseStatus::Submitted);
});

it('rejects submitting a bridge without a pontic', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $items = bridgeRuleItems($catalog);
    $secondCrown = [...$items['crown'], 'teeth' => [12]];

    $this->actingAs($user)
        ->post(route('cases.store'), bridgeSubmitPayload($user, [$items['crown'], $secondCrown, $items['bridge']]))
        ->assertSessionHasErrors('items.2.kind');

    expect(DentalCase::query()->count())->toBe(0);
});

it('rejects submitting a bridge without a retainer', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $items = bridgeRuleItems($catalog);
    $secondPontic = [...$items['pontic'], 'teeth' => [11]];

    $this->actingAs($user)
        ->post(route('cases.store'), bridgeSubmitPayload($user, [$secondPontic, $items['pontic'], $items['bridge']]))
        ->assertSessionHasErrors('items.2.kind');
});

it('does not count a pontic that is outside the bridge span', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $items = bridgeRuleItems($catalog, 21);

    $this->actingAs($user)
        ->post(route('cases.store'), bridgeSubmitPayload($user, [$items['crown'], $items['pontic'], $items['bridge']]))
        ->assertSessionHasErrors('items.2.kind');
});

it('still allows saving an incomplete bridge as a draft', function () {
    $user = createCaseDentist();
    $catalog = createCrownCatalog();
    $items = bridgeRuleItems($catalog);
    $payload = [...bridgeSubmitPayload($user, [$items['crown'], $items['bridge']]), 'intent' => 'draft'];

    $this->actingAs($user)
        ->post(route('cases.store'), $payload)
        ->assertRedirect();

    expect(DentalCase::query()->first()?->status)->toBe(DentalCaseStatus::Draft);
});
