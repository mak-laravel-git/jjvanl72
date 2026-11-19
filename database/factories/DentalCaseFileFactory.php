<?php

namespace Database\Factories;

use App\Models\DentalCase;
use App\Models\DentalCaseFile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DentalCaseFile>
 */
class DentalCaseFileFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'case_id' => DentalCase::factory(),
            'case_item_id' => null,
            'upload_requirement_id' => null,
            'requirement_code_snapshot' => 'upperArch',
            'storage_disk' => 'local',
            'storage_path' => 'dental-cases/'.fake()->uuid().'.stl',
            'original_name' => 'scan.stl',
            'mime_type' => 'application/octet-stream',
            'size_bytes' => 1024,
            'sha256' => hash('sha256', fake()->uuid()),
            'status' => 'uploaded',
            'uploaded_by_user_id' => User::factory(),
        ];
    }
}
