<?php

namespace App\Services;

use App\Enums\DentalCaseAssignmentRole;
use App\Enums\DentalCaseStatus;
use App\Enums\DesignerAssignmentStatus;
use App\Enums\ManufacturerAssignmentStatus;
use App\Models\DentalCase;
use App\Models\DentalCaseAssignment;
use App\Models\User;
use App\Support\AppPermissions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CaseAssignmentService
{
    /**
     * @return array{
     *     pendingCount: int,
     *     roles: list<array<string, mixed>>,
     *     unassignedQueue: list<array<string, mixed>>,
     *     assignableUsers: list<array<string, mixed>>,
     *     designerQueue: list<array<string, mixed>>,
     *     manufacturerQueue: list<array<string, mixed>>,
     *     designers: list<array<string, mixed>>,
     *     assignableDesigners: list<array<string, mixed>>,
     *     manufacturers: list<array<string, mixed>>
     * }
     */
    public function assignmentCenterPayload(): array
    {
        $stakeholderRoles = collect(AppPermissions::stakeholderRoles())
            ->reject(fn (string $role): bool => $role === AppPermissions::DENTIST_ROLE)
            ->values()
            ->all();
        $assignableRoleValues = DentalCaseAssignmentRole::values();

        $usersByRole = User::query()
            ->with(['roles', 'createdCases.items', 'caseAssignments.dentalCase.items'])
            ->whereHas('roles', fn (Builder $query) => $query->whereIn('name', $stakeholderRoles))
            ->orderBy('name')
            ->get()
            ->groupBy(fn (User $user): string => $user->platformRole() ?? 'Unassigned');

        $roles = collect($stakeholderRoles)
            ->map(function (string $roleName) use ($usersByRole, $assignableRoleValues): array {
                $assignable = in_array($roleName, $assignableRoleValues, true);
                $users = ($usersByRole->get($roleName) ?? collect())
                    ->map(fn (User $user): array => $this->userRoleCard($user, $roleName, $assignable))
                    ->values()
                    ->all();

                return [
                    'name' => $roleName,
                    'assignable' => $assignable,
                    'users' => $users,
                ];
            })
            ->values()
            ->all();

        $unassignedQueue = $this->unassignedQueue();
        $assignableUsers = $this->assignableUsers();

        $designerQueue = collect($unassignedQueue)
            ->filter(fn (array $item): bool => $item['needs_designer'])
            ->map(fn (array $item): array => [
                'id' => $item['case_number'],
                'database_id' => $item['id'],
                'customer' => $item['customer'],
                'product' => $item['product'],
                'priority' => 'Normal',
                'detail' => $item['product'].' · '.$item['case_status'],
                'needs_designer' => true,
                'needs_manufacturer' => $item['needs_manufacturer'],
            ])
            ->values()
            ->all();

        $manufacturerQueue = collect($unassignedQueue)
            ->filter(fn (array $item): bool => $item['needs_manufacturer'])
            ->map(fn (array $item): array => [
                'id' => $item['case_number'],
                'database_id' => $item['id'],
                'customer' => $item['customer'],
                'product' => $item['product'],
                'status' => $item['case_status'],
                'detail' => $item['product'].' · '.$item['case_status'],
                'needs_designer' => $item['needs_designer'],
                'needs_manufacturer' => true,
            ])
            ->values()
            ->all();

        $designers = collect($assignableUsers)
            ->filter(fn (array $user): bool => $user['role'] === DentalCaseAssignmentRole::Designer->value)
            ->map(function (array $user): array {
                $active = (int) $user['active'];
                $load = min(100, $active * 10);

                return [
                    'name' => $user['name'],
                    'initials' => $user['initials'],
                    'active' => $active,
                    'load' => $load,
                    'status' => $load >= 90 ? 'Full' : 'Open',
                ];
            })
            ->values()
            ->all();

        $assignableDesigners = collect($assignableUsers)
            ->filter(fn (array $user): bool => $user['role'] === DentalCaseAssignmentRole::Designer->value)
            ->map(fn (array $user): array => [
                'id' => $user['id'],
                'name' => $user['name'],
                'initials' => $user['initials'],
                'rating' => '—',
                'specialties' => ['Design'],
                'active' => $user['active'],
            ])
            ->values()
            ->all();

        $manufacturers = collect($assignableUsers)
            ->filter(fn (array $user): bool => $user['role'] === DentalCaseAssignmentRole::Manufacturer->value)
            ->map(function (array $user): array {
                $active = (int) $user['active'];

                return [
                    'name' => $user['name'],
                    'capacity' => min(100, max(10, $active * 10)),
                ];
            })
            ->values()
            ->all();

        return [
            'pendingCount' => count($unassignedQueue),
            'roles' => $roles,
            'unassignedQueue' => $unassignedQueue,
            'assignableUsers' => $assignableUsers,
            'designerQueue' => $designerQueue,
            'manufacturerQueue' => $manufacturerQueue,
            'designers' => $designers,
            'assignableDesigners' => $assignableDesigners,
            'manufacturers' => $manufacturers,
        ];
    }

    /**
     * @param  list<int>  $userIds
     * @return list<DentalCaseAssignment>
     */
    public function assign(
        DentalCase $case,
        DentalCaseAssignmentRole $role,
        array $userIds,
        User $assignedBy,
    ): array {
        $userIds = array_values(array_unique(array_map('intval', $userIds)));

        if ($userIds === []) {
            throw ValidationException::withMessages([
                'user_ids' => 'Select at least one user to assign.',
            ]);
        }

        $users = User::query()
            ->whereIn('id', $userIds)
            ->role($role->permissionRole())
            ->get();

        if ($users->count() !== count($userIds)) {
            throw ValidationException::withMessages([
                'user_ids' => 'Each assignee must have the '.$role->label().' role.',
            ]);
        }

        $defaultStatus = match ($role) {
            DentalCaseAssignmentRole::Designer => DesignerAssignmentStatus::Assigned->value,
            DentalCaseAssignmentRole::Manufacturer => ManufacturerAssignmentStatus::Assigned->value,
        };

        return DB::transaction(function () use ($case, $role, $users, $assignedBy, $defaultStatus): array {
            $created = [];

            foreach ($users as $user) {
                $assignment = DentalCaseAssignment::query()->firstOrCreate(
                    [
                        'dental_case_id' => $case->id,
                        'user_id' => $user->id,
                        'role' => $role->value,
                    ],
                    [
                        'status' => $defaultStatus,
                        'assigned_by' => $assignedBy->id,
                    ],
                );

                if ($assignment->wasRecentlyCreated) {
                    $created[] = $assignment;
                }
            }

            $this->bumpCaseStatusOnAssign($case->fresh(), $role);

            return $created;
        });
    }

    public function unassign(DentalCaseAssignment $assignment): void
    {
        $assignment->delete();
    }

    /**
     * @return Builder<DentalCase>
     */
    public function casesAssignedTo(User $user, DentalCaseAssignmentRole $role, ?string $status = null): Builder
    {
        return DentalCase::query()
            ->with(['client', 'creator', 'items', 'assignments' => function ($query) use ($user, $role): void {
                $query->where('user_id', $user->id)->where('role', $role->value);
            }])
            ->whereHas('assignments', function (Builder $query) use ($user, $role, $status): void {
                $query->where('user_id', $user->id)
                    ->where('role', $role->value);

                if ($status !== null) {
                    $query->where('status', $status);
                }
            })
            ->orderByDesc('updated_at');
    }

    /**
     * @param  list<string>  $statuses
     * @return Builder<DentalCase>
     */
    public function casesAssignedToWithStatuses(
        User $user,
        DentalCaseAssignmentRole $role,
        array $statuses,
    ): Builder {
        return DentalCase::query()
            ->with(['client', 'creator', 'items', 'assignments' => function ($query) use ($user, $role): void {
                $query->where('user_id', $user->id)->where('role', $role->value);
            }])
            ->whereHas('assignments', function (Builder $query) use ($user, $role, $statuses): void {
                $query->where('user_id', $user->id)
                    ->where('role', $role->value)
                    ->whereIn('status', $statuses);
            })
            ->orderByDesc('updated_at');
    }

    /**
     * @return array<string, mixed>
     */
    public function toDesignerListRow(DentalCase $case, DentalCaseAssignment $assignment): array
    {
        $dueDate = $case->due_date;
        $today = now(config('app.timezone'))->startOfDay();

        return [
            'id' => $case->case_number,
            'database_id' => $case->id,
            'customer' => $case->creator?->platformRole() ?? $case->creator?->role_label ?? '—',
            'product' => $case->items->first()?->product_name_snapshot ?? '—',
            'client' => $case->client?->name ?? $case->creator?->name ?? '—',
            'assigned_date' => $assignment->created_at?->timezone(config('app.timezone'))->format('Y-m-d') ?? '—',
            'due_date' => $dueDate?->format('Y-m-d') ?? '—',
            'due_urgent' => $dueDate !== null && $dueDate->lt($today),
            'priority' => 'Medium',
            'status' => $assignment->statusLabel(),
            'status_tone' => $assignment->statusTone(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function toManufacturerJobRow(DentalCase $case, DentalCaseAssignment $assignment): array
    {
        $config = $case->configuration_json ?? [];

        return [
            'id' => $case->case_number,
            'database_id' => $case->id,
            'customer' => $case->client?->name ?? $case->creator?->name ?? '—',
            'type' => $case->creator?->platformRole() ?? '—',
            'product' => $case->items->first()?->product_name_snapshot ?? '—',
            'material' => $case->items->first()?->material_name_snapshot ?? '—',
            'due_date' => $case->due_date?->format('M j, Y') ?? '—',
            'priority' => 'Medium',
            'status' => $assignment->statusLabel(),
            'status_tone' => $assignment->statusTone() === 'accepted'
                ? 'accepted'
                : ($assignment->statusTone() === 'assigned' ? 'assigned' : 'assigned'),
            'shipping_address' => '—',
            'courier' => '—',
            'tracking_number' => '—',
            'shade' => (string) ($config['shade'] ?? '—'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function userRoleCard(User $user, string $roleName, bool $assignable): array
    {
        if ($assignable) {
            $projects = $user->caseAssignments
                ->filter(fn (DentalCaseAssignment $assignment): bool => $assignment->roleValue() === $roleName)
                ->map(function (DentalCaseAssignment $assignment): ?array {
                    $case = $assignment->dentalCase;

                    if ($case === null) {
                        return null;
                    }

                    return $this->projectCard($case, $assignment->statusLabel(), $assignment->id);
                })
                ->filter()
                ->values()
                ->all();
        } else {
            $projects = $user->createdCases
                ->map(fn (DentalCase $case): array => $this->projectCard($case, null))
                ->values()
                ->all();
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'initials' => $user->initials(),
            'projects' => $projects,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function projectCard(DentalCase $case, ?string $assignmentStatus, ?int $assignmentId = null): array
    {
        $status = $case->status instanceof DentalCaseStatus
            ? $case->status
            : DentalCaseStatus::tryFrom((string) $case->status);

        return [
            'id' => $case->id,
            'assignment_id' => $assignmentId,
            'case_number' => $case->case_number,
            'patient' => $case->patient_name_snapshot,
            'product' => $case->items->first()?->product_name_snapshot ?? '—',
            'case_status' => $status?->label() ?? 'Draft',
            'assignment_status' => $assignmentStatus,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function unassignedQueue(): array
    {
        $activeStatuses = array_map(
            fn (DentalCaseStatus $status): string => $status->value,
            DentalCaseStatus::activeCases(),
        );

        return DentalCase::query()
            ->with(['client', 'items', 'assignments'])
            ->whereIn('status', $activeStatuses)
            ->where(function (Builder $query): void {
                $query->whereDoesntHave('assignments', fn (Builder $inner) => $inner
                    ->where('role', DentalCaseAssignmentRole::Designer->value))
                    ->orWhereDoesntHave('assignments', fn (Builder $inner) => $inner
                        ->where('role', DentalCaseAssignmentRole::Manufacturer->value));
            })
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(function (DentalCase $case): array {
                $status = $case->status instanceof DentalCaseStatus
                    ? $case->status
                    : DentalCaseStatus::tryFrom((string) $case->status);
                $hasDesigner = $case->assignments->contains(
                    fn (DentalCaseAssignment $assignment): bool => $assignment->roleValue() === DentalCaseAssignmentRole::Designer->value,
                );
                $hasManufacturer = $case->assignments->contains(
                    fn (DentalCaseAssignment $assignment): bool => $assignment->roleValue() === DentalCaseAssignmentRole::Manufacturer->value,
                );

                return [
                    'id' => $case->id,
                    'case_number' => $case->case_number,
                    'customer' => $case->client?->name ?? '—',
                    'product' => $case->items->first()?->product_name_snapshot ?? '—',
                    'case_status' => $status?->label() ?? 'Submitted',
                    'needs_designer' => ! $hasDesigner,
                    'needs_manufacturer' => ! $hasManufacturer,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function assignableUsers(): array
    {
        return User::query()
            ->with('roles')
            ->whereHas('roles', fn (Builder $query) => $query->whereIn('name', DentalCaseAssignmentRole::values()))
            ->withCount([
                'caseAssignments as active_assignments_count' => fn (Builder $query) => $query
                    ->whereNotIn('status', [
                        DesignerAssignmentStatus::Completed->value,
                        ManufacturerAssignmentStatus::Completed->value,
                        ManufacturerAssignmentStatus::Shipped->value,
                    ]),
            ])
            ->orderBy('name')
            ->get()
            ->map(function (User $user): array {
                $role = $user->platformRole();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'initials' => $user->initials(),
                    'role' => $role,
                    'active' => (int) $user->active_assignments_count,
                ];
            })
            ->values()
            ->all();
    }

    private function bumpCaseStatusOnAssign(DentalCase $case, DentalCaseAssignmentRole $role): void
    {
        if ($role === DentalCaseAssignmentRole::Designer
            && $case->status === DentalCaseStatus::Submitted) {
            $case->forceFill(['status' => DentalCaseStatus::Designing])->save();

            return;
        }

        if ($role === DentalCaseAssignmentRole::Manufacturer
            && in_array($case->status, [
                DentalCaseStatus::Approved,
                DentalCaseStatus::AwaitingApproval,
            ], true)) {
            $case->forceFill(['status' => DentalCaseStatus::Manufacturing])->save();
        }
    }
}
