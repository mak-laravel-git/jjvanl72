<?php

namespace Database\Seeders;

use App\Enums\UserStatus;
use App\Models\DentalClient;
use App\Models\User;
use App\Support\AppPermissions;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $client = DentalClient::query()->updateOrCreate(
            ['code' => 'BRIGHT01'],
            [
                'name' => 'Bright Dental',
                'is_active' => true,
            ],
        );

        $accounts = [
            [
                'name' => 'Admin User',
                'email' => 'admin@dev.com',
                'password' => 'admin@dev.com',
                'role' => AppPermissions::SUPER_ADMIN_ROLE,
            ],
            [
                'name' => 'Dr. Sarah Mitchell',
                'email' => 'dentist@dev.com',
                'password' => 'dentist@dev.com',
                'phone' => '+1 512-555-0142',
                'location' => 'Austin, TX',
                'role' => AppPermissions::DENTIST_ROLE,
            ],
            [
                'name' => 'Dr. Alex Smith',
                'email' => 'denturist@dev.com',
                'password' => 'denturist@dev.com',
                'phone' => '+1 214-555-0198',
                'location' => 'Dallas, TX',
                'role' => AppPermissions::DENTURIST_ROLE,
            ],
            [
                'name' => 'Valley Dental Lab',
                'email' => 'lab@dev.com',
                'password' => 'lab@dev.com',
                'phone' => '+1 713-555-0166',
                'location' => 'Houston, TX',
                'role' => AppPermissions::LAB_ROLE,
            ],
            [
                'name' => 'Dr. Nick Smith',
                'email' => 'designer@dev.com',
                'password' => 'designer@dev.com',
                'phone' => '+1 206-555-0133',
                'location' => 'Seattle, WA',
                'role' => AppPermissions::DESIGNER_ROLE,
            ],
            [
                'name' => 'Max Smith',
                'email' => 'manufacturer@dev.com',
                'password' => 'manufacturer@dev.com',
                'phone' => '+1 303-555-0177',
                'location' => 'Denver, CO',
                'company_name' => 'Texure Factory',
                'business_registration' => 'BN123456789',
                'production_capacity' => 15,
                'role' => AppPermissions::MANUFACTURER_ROLE,
            ],
        ];

        foreach ($accounts as $account) {
            $payload = [
                'name' => $account['name'],
                'phone' => $account['phone'] ?? null,
                'location' => $account['location'] ?? null,
                'company_name' => $account['company_name'] ?? null,
                'business_registration' => $account['business_registration'] ?? null,
                'production_capacity' => $account['production_capacity'] ?? null,
                'status' => UserStatus::Active,
                'password' => Hash::make($account['password']),
                'email_verified_at' => now(),
            ];

            if (in_array($account['role'], AppPermissions::submitterTypes(), true)) {
                $payload['client_id'] = $client->id;
            }

            $user = User::query()->updateOrCreate(
                ['email' => $account['email']],
                $payload,
            );

            $user->syncRoles([$account['role']]);
        }
    }
}
