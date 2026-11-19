<?php

use App\Enums\DentalCaseAssignmentRole;
use App\Enums\DentalCaseStatus;
use App\Enums\DesignerAssignmentStatus;
use App\Models\DentalCase;
use App\Models\DentalCaseAssignment;
use App\Models\User;
use App\Support\AppPermissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function assignmentAdmin(string $email = 'assign-admin@dev.com'): User
{
    $admin = User::factory()->create([
        'name' => 'Assignment Admin',
        'email' => $email,
    ]);
    $admin->assignRole(AppPermissions::SUPER_ADMIN_ROLE);

    return $admin;
}

function assignmentDesigner(string $email = 'assign-designer@dev.com'): User
{
    $user = User::factory()->create(['email' => $email, 'name' => 'Ada Designer']);
    $user->assignRole(AppPermissions::DESIGNER_ROLE);

    return $user;
}

function assignmentManufacturer(string $email = 'assign-mfg@dev.com'): User
{
    $user = User::factory()->create(['email' => $email, 'name' => 'Max Manufacturer']);
    $user->assignRole(AppPermissions::MANUFACTURER_ROLE);

    return $user;
}

test('assignment center lists roles except dentist and super admin', function () {
    $admin = assignmentAdmin();
    assignmentDesigner();
    User::factory()->create(['email' => 'other-admin@dev.com'])->assignRole(AppPermissions::SUPER_ADMIN_ROLE);
    User::factory()->create(['email' => 'dentist-skip@dev.com'])->assignRole(AppPermissions::DENTIST_ROLE);

    $expectedRoles = collect(AppPermissions::stakeholderRoles())
        ->reject(fn (string $role): bool => $role === AppPermissions::DENTIST_ROLE)
        ->values()
        ->all();

    $this->actingAs($admin)
        ->get(route('admin.assignments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('backend/Admin/AssignmentCenter')
            ->has('roles', count($expectedRoles))
            ->where('roles.0.name', AppPermissions::DENTURIST_ROLE)
            ->where('roles.0.assignable', false)
            ->where('roles.1.name', AppPermissions::LAB_ROLE)
            ->where('roles.2.name', AppPermissions::DESIGNER_ROLE)
            ->where('roles.2.assignable', true)
            ->where('roles.3.name', AppPermissions::MANUFACTURER_ROLE)
            ->where('roles.3.assignable', true)
            ->has('unassignedQueue')
            ->has('assignableUsers')
            ->has('designerQueue')
            ->has('manufacturerQueue')
        );
});

test('admin can assign a case to multiple designers', function () {
    $admin = assignmentAdmin('multi-assign@dev.com');
    $designerA = assignmentDesigner('designer-a@dev.com');
    $designerB = assignmentDesigner('designer-b@dev.com');
    $case = DentalCase::factory()->submitted()->create();

    $this->actingAs($admin)
        ->post(route('admin.assignments.store'), [
            'dental_case_id' => $case->id,
            'role' => DentalCaseAssignmentRole::Designer->value,
            'user_ids' => [$designerA->id, $designerB->id],
        ])
        ->assertRedirect(route('admin.assignments.index'));

    expect(DentalCaseAssignment::query()->where('dental_case_id', $case->id)->count())->toBe(2);
    expect($case->fresh()->status)->toBe(DentalCaseStatus::Designing);

    $this->actingAs($admin)
        ->post(route('admin.assignments.store'), [
            'dental_case_id' => $case->id,
            'role' => DentalCaseAssignmentRole::Designer->value,
            'user_ids' => [$designerA->id],
        ])
        ->assertRedirect(route('admin.assignments.index'));

    expect(DentalCaseAssignment::query()->where('dental_case_id', $case->id)->count())->toBe(2);
});

test('admin can unassign a case assignment', function () {
    $admin = assignmentAdmin('unassign@dev.com');
    $designer = assignmentDesigner('unassign-designer@dev.com');
    $case = DentalCase::factory()->submitted()->create();
    $assignment = DentalCaseAssignment::factory()->forDesigner($designer)->create([
        'dental_case_id' => $case->id,
        'assigned_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.assignments.destroy', $assignment))
        ->assertRedirect(route('admin.assignments.index'));

    expect(DentalCaseAssignment::query()->find($assignment->id))->toBeNull();
});

test('designer portal only returns their assigned cases', function () {
    $designerA = assignmentDesigner('scope-a@dev.com');
    $designerB = assignmentDesigner('scope-b@dev.com');
    $mine = DentalCase::factory()->submitted()->create([
        'case_number' => 'ADX-MINE1',
        'patient_name_snapshot' => 'My Patient',
    ]);
    $theirs = DentalCase::factory()->submitted()->create([
        'case_number' => 'ADX-THEIRS',
    ]);

    DentalCaseAssignment::factory()->forDesigner($designerA)->create(['dental_case_id' => $mine->id]);
    DentalCaseAssignment::factory()->forDesigner($designerB)->create(['dental_case_id' => $theirs->id]);

    $this->actingAs($designerA)
        ->get(route('designer.assigned'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('backend/User/DesignerAssignedCases')
            ->has('cases', 1)
            ->where('cases.0.id', 'ADX-MINE1')
        );
});

test('manufacturer portal only returns their assigned cases', function () {
    $mfgA = assignmentManufacturer('mfg-a@dev.com');
    $mfgB = assignmentManufacturer('mfg-b@dev.com');
    $mine = DentalCase::factory()->submitted()->create(['case_number' => 'ADX-MFG1']);
    $theirs = DentalCase::factory()->submitted()->create(['case_number' => 'ADX-MFG2']);

    DentalCaseAssignment::factory()->forManufacturer($mfgA)->create(['dental_case_id' => $mine->id]);
    DentalCaseAssignment::factory()->forManufacturer($mfgB)->create(['dental_case_id' => $theirs->id]);

    $this->actingAs($mfgA)
        ->get(route('manufacturer.assigned'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('backend/User/ManufacturerCaseList')
            ->has('assignedJobs', 1)
            ->where('assignedJobs.0.id', 'ADX-MFG1')
        );
});

test('dentist still only sees cases they created', function () {
    $dentist = User::factory()->create(['email' => 'own-dentist@dev.com']);
    $dentist->assignRole(AppPermissions::DENTIST_ROLE);
    $other = User::factory()->create(['email' => 'other-dentist@dev.com']);
    $other->assignRole(AppPermissions::DENTIST_ROLE);

    $mine = DentalCase::factory()->configureFor($dentist)->submitted()->create([
        'patient_name_snapshot' => 'Owned Patient',
    ]);
    DentalCase::factory()->configureFor($other)->submitted()->create([
        'patient_name_snapshot' => 'Foreign Patient',
    ]);

    $this->actingAs($dentist)
        ->get(route('cases.active'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('backend/User/ActiveCases')
            ->has('cases', 1)
            ->where('cases.0.id', $mine->case_number)
            ->where('cases.0.patient', 'Owned Patient')
        );
});

test('designer in-progress filters by designing assignment status', function () {
    $designer = assignmentDesigner('progress@dev.com');
    $designing = DentalCase::factory()->submitted()->create(['case_number' => 'ADX-DES1']);
    $assigned = DentalCase::factory()->submitted()->create(['case_number' => 'ADX-ASG1']);

    DentalCaseAssignment::factory()->forDesigner($designer)->withStatus(DesignerAssignmentStatus::Designing->value)
        ->create(['dental_case_id' => $designing->id]);
    DentalCaseAssignment::factory()->forDesigner($designer)->withStatus(DesignerAssignmentStatus::Assigned->value)
        ->create(['dental_case_id' => $assigned->id]);

    $this->actingAs($designer)
        ->get(route('designer.in-progress'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('cases', 1)
            ->where('cases.0.id', 'ADX-DES1')
            ->where('cases.0.status', 'In Design')
        );
});

test('users without assignments.manage cannot assign cases', function () {
    $viewer = User::factory()->create(['email' => 'viewer@dev.com']);
    $viewer->givePermissionTo('assignments.view');
    $designer = assignmentDesigner('blocked-designer@dev.com');
    $case = DentalCase::factory()->submitted()->create();

    $this->actingAs($viewer)
        ->post(route('admin.assignments.store'), [
            'dental_case_id' => $case->id,
            'role' => DentalCaseAssignmentRole::Designer->value,
            'user_ids' => [$designer->id],
        ])
        ->assertForbidden();
});
