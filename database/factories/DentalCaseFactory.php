<?php

namespace Database\Factories;

use App\Enums\DentalCaseStatus;
use App\Models\DentalCase;
use App\Models\DentalClient;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalCase>
 */
class DentalCaseFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $patientName = fake()->name();

        return [
            'case_number' => 'ADX-'.fake()->unique()->numerify('#####'),
            'client_id' => DentalClient::factory(),
            'created_by' => User::factory(),
            'patient_id' => Patient::factory()->state(fn (): array => [
                'name' => $patientName,
            ]),
            'reference' => null,
            'patient_name_snapshot' => $patientName,
            'due_date' => fake()->dateTimeBetween('+1 week', '+3 months')->format('Y-m-d'),
            'notes' => fake()->optional()->sentence(),
            'status' => DentalCaseStatus::Draft,
            'lock_version' => 1,
            'configuration_json' => [
                'shade' => 'A2',
                'impressionType' => 'Intra Oral Scan',
                'service' => 'design',
                'output' => 'appliance',
            ],
        ];
    }

    public function submitted(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => DentalCaseStatus::Submitted,
            'submitted_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $configuration
     */
    public function configureFor(User $user, ?DentalClient $client = null): static
    {
        $assignedClient = $client ?? ($user->client ?? DentalClient::factory()->create());

        return $this->state(fn (array $attributes): array => [
            'client_id' => $assignedClient->id,
            'created_by' => $user->id,
        ]);
    }
}
