<?php

use App\Enums\DentalCaseStatus;
use App\Models\DentalCase;
use App\Models\DentalCaseAssignment;
use App\Models\DentalCaseFileSlot;
use App\Models\DentalClient;
use App\Models\DentalMaterial;
use App\Models\DentalProduct;
use App\Models\DentalProductGroup;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function caseFileSlotCatalog(): array
{
    $group = DentalProductGroup::factory()->create([
        'is_active' => true,
        'sort_order' => 1,
    ]);
    $product = DentalProduct::factory()->create([
        'code' => 'crown',
        'name' => 'Crown / Retainer',
        'is_active' => true,
        'dental_product_group_id' => $group->id,
    ]);
    $material = DentalMaterial::factory()->create([
        'name' => 'Zirconia',
        'is_active' => true,
    ]);

    return compact('product', 'material');
}

function caseFileSlotDentist(): User
{
    $client = DentalClient::factory()->create();
    $user = User::factory()->create(['client_id' => $client->id]);
    $user->assignRole(AppPermissions::DENTIST_ROLE);

    return $user;
}

it('persists the three default file slots when saving a case without uploads', function () {
    $user = caseFileSlotDentist();
    $catalog = caseFileSlotCatalog();

    $this->actingAs($user)
        ->post(route('cases.store'), [
            'intent' => 'draft',
            'client_id' => $user->client_id,
            'patient_name' => 'Slot Patient',
            'due_date' => now()->addDays(5)->toDateString(),
            'impression_type' => 'Intra Oral Scan',
            'items' => json_encode([
                [
                    'product_key' => 'crown',
                    'teeth' => [11],
                    'arch' => 'upper',
                    'quantity' => 1,
                    'material_id' => $catalog['material']->id,
                    'material' => 'Zirconia',
                    'shade' => 'A2',
                    'config' => [],
                    'kind' => 'tooth',
                ],
            ]),
            'file_slots' => json_encode([
                ['code' => 'upperArch', 'label' => 'Upper Arch', 'sort_order' => 0],
                ['code' => 'lowerArch', 'label' => 'Lower Arch', 'sort_order' => 1],
                ['code' => 'biteScan', 'label' => 'Bite Scan', 'sort_order' => 2],
            ]),
        ])
        ->assertRedirect();

    $case = DentalCase::query()->with('fileSlots')->first();

    expect($case)->not->toBeNull()
        ->and($case->fileSlots)->toHaveCount(3)
        ->and($case->fileSlots->pluck('code')->all())->toBe([
            'upperArch',
            'lowerArch',
            'biteScan',
        ])
        ->and($case->files)->toHaveCount(0);
});

it('lets an assigned designer upload into an empty dentist slot and add a new slot', function () {
    Storage::fake('local');

    $dentist = caseFileSlotDentist();
    $case = DentalCase::factory()->configureFor($dentist)->create([
        'status' => DentalCaseStatus::Submitted,
        'submitted_at' => now(),
    ]);

    DentalCaseFileSlot::factory()->create([
        'case_id' => $case->id,
        'code' => 'upperArch',
        'label' => 'Upper Arch',
        'sort_order' => 0,
        'created_by_user_id' => $dentist->id,
    ]);

    $designer = User::factory()->create();
    $designer->assignRole(AppPermissions::DESIGNER_ROLE);
    DentalCaseAssignment::factory()->forDesigner($designer)->create([
        'dental_case_id' => $case->id,
    ]);

    $this->actingAs($designer)
        ->post(route('cases.file-slots.files.store', [
            'dentalCase' => $case->id,
            'slot' => $case->fileSlots()->first()->id,
        ]), [
            'files' => [UploadedFile::fake()->create('upper.stl', 50)],
        ])
        ->assertRedirect();

    expect($case->fresh()->files)->toHaveCount(1)
        ->and($case->fresh()->files->first()?->requirement_code_snapshot)->toBe('upperArch');

    $this->actingAs($designer)
        ->post(route('cases.file-slots.store', $case), [
            'label' => 'Design STL',
        ])
        ->assertRedirect();

    expect($case->fresh()->fileSlots()->where('code', 'design-stl')->exists())->toBeTrue();
});

it('lets a lab user manage file slots on a non-draft case they do not own', function () {
    Storage::fake('local');

    $dentist = caseFileSlotDentist();
    $case = DentalCase::factory()->configureFor($dentist)->create([
        'status' => DentalCaseStatus::Submitted,
        'submitted_at' => now(),
    ]);
    $slot = DentalCaseFileSlot::factory()->create([
        'case_id' => $case->id,
        'code' => 'biteScan',
        'label' => 'Bite Scan',
        'created_by_user_id' => $dentist->id,
    ]);

    $lab = User::factory()->create();
    $lab->assignRole(AppPermissions::LAB_ROLE);

    $this->actingAs($lab)
        ->post(route('cases.file-slots.files.store', [
            'dentalCase' => $case->id,
            'slot' => $slot->id,
        ]), [
            'files' => [UploadedFile::fake()->create('bite.stl', 40)],
        ])
        ->assertRedirect();

    expect($case->fresh()->files)->toHaveCount(1);

    $this->actingAs($lab)
        ->get(route('cases.show', $case->case_number))
        ->assertOk();
});

it('forbids a non-assigned designer from uploading to another case', function () {
    $dentist = caseFileSlotDentist();
    $case = DentalCase::factory()->configureFor($dentist)->create([
        'status' => DentalCaseStatus::Submitted,
        'submitted_at' => now(),
    ]);
    $slot = DentalCaseFileSlot::factory()->create([
        'case_id' => $case->id,
        'code' => 'lowerArch',
        'label' => 'Lower Arch',
        'created_by_user_id' => $dentist->id,
    ]);

    $designer = User::factory()->create();
    $designer->assignRole(AppPermissions::DESIGNER_ROLE);

    $this->actingAs($designer)
        ->post(route('cases.file-slots.files.store', [
            'dentalCase' => $case->id,
            'slot' => $slot->id,
        ]), [
            'files' => [UploadedFile::fake()->create('lower.stl', 20)],
        ])
        ->assertNotFound();
});
