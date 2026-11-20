<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\UserStatus;
use App\Models\User;
use App\Services\DentalClientService;
use App\Support\AppPermissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules {
        PasswordValidationRules::passwordRules insteadof ProfileValidationRules;
        PasswordValidationRules::passwordRules as fortifyPasswordRules;
        ProfileValidationRules::passwordRules as profilePasswordRules;
        ProfileValidationRules::profileRules as baseProfileRules;
        ProfileValidationRules::passwordConfirmationRules as profilePasswordConfirmationRules;
    }

    public function __construct(
        protected DentalClientService $dentalClients,
    ) {}

    /**
     * Validate and create a self-registered client: one business (dental client)
     * plus one user linked to it with the chosen submitter role.
     *
     * Only the submitter roles (Dentist, Denturist, Lab) can be chosen here;
     * Designer / Manufacturer / admin roles are always created by an admin.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'role' => ['required', 'string', Rule::in(AppPermissions::submitterTypes())],
            'name' => $this->nameRules(),
            'business_name' => ['required', 'string', 'max:160'],
            'address' => ['required', 'string', 'max:255'],
            'cell_number' => ['required', 'string', 'max:50'],
            'office_number' => ['required', 'string', 'max:50'],
            'email' => $this->emailRules(),
            'password' => $this->passwordRules(),
        ], [
            'role.required' => 'Select whether you are a Dentist, Denturist or Lab.',
            'role.in' => 'Select whether you are a Dentist, Denturist or Lab.',
            'business_name.required' => 'Enter your business name.',
            'address.required' => 'Enter your address.',
            'cell_number.required' => 'Enter your cell number.',
            'office_number.required' => 'Enter your office number.',
        ])->validate();

        return DB::transaction(function () use ($input): User {
            $client = $this->dentalClients->create([
                'code' => $this->dentalClients->generateCode(),
                'name' => trim($input['business_name']),
                'address' => trim($input['address']),
                'office_number' => trim($input['office_number']),
                'is_active' => true,
            ]);

            $user = User::query()->create([
                'name' => trim($input['name']),
                'email' => $input['email'],
                'phone' => trim($input['cell_number']),
                'password' => $input['password'],
                'status' => UserStatus::Active,
                'client_id' => $client->id,
            ]);

            $user->syncRoles([$input['role']]);
            $user->searchable();

            return $user;
        });
    }

    /**
     * Use Fortify's stronger password defaults for registration.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return $this->fortifyPasswordRules();
    }
}
