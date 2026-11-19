<?php

namespace Database\Factories;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $invoiceDate = fake()->dateTimeBetween('-60 days', 'now');

        return [
            'number' => 'INV-'.fake()->unique()->numberBetween(2000, 9999),
            'customer' => fake()->name(),
            'amount' => fake()->randomFloat(2, 200, 6000),
            'status' => fake()->randomElement(InvoiceStatus::cases()),
            'invoice_date' => $invoiceDate,
            'due_date' => (clone $invoiceDate)->modify('+14 days'),
            'notes' => null,
            'sent_at' => null,
            'created_by' => null,
        ];
    }
}
