<?php

namespace Database\Factories;

use App\Enums\DentalCaseAssignmentRole;
use App\Enums\DesignerAssignmentStatus;
use App\Enums\ManufacturerAssignmentStatus;
use App\Models\DentalCase;
use App\Models\DentalCaseAssignment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalCaseAssignment>
 */
class DentalCaseAssignmentFactory extends Factory
{
    protected $model = DentalCaseAssignment::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'dental_case_id' => DentalCase::factory()->submitted(),
            'user_id' => User::factory(),
            'role' => DentalCaseAssignmentRole::Designer,
            'status' => DesignerAssignmentStatus::Assigned->value,
            'assigned_by' => null,
        ];
    }

    public function forDesigner(?User $user = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'user_id' => $user?->id ?? User::factory(),
            'role' => DentalCaseAssignmentRole::Designer,
            'status' => DesignerAssignmentStatus::Assigned->value,
        ]);
    }

    public function forManufacturer(?User $user = null): static
    {
        return $this->state(fn (array $attributes): array => [
            'user_id' => $user?->id ?? User::factory(),
            'role' => DentalCaseAssignmentRole::Manufacturer,
            'status' => ManufacturerAssignmentStatus::Assigned->value,
        ]);
    }

    public function withStatus(string $status): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => $status,
        ]);
    }
}
