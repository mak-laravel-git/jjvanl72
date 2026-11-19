<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\UserStatus;
use App\Support\AppPermissions;
use App\Support\SuperAdmin;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('admins.create') ?? false;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('status')) {
            $this->merge(['status' => UserStatus::Active->value]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', Rule::enum(UserStatus::class)],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => [
                'string',
                Rule::in(AppPermissions::adminStaffRoleNames()),
                Rule::exists('roles', 'name')
                    ->where(fn ($query) => $query->where('guard_name', AppPermissions::GUARD)),
            ],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $roles = $this->input('roles', []);

                if (
                    is_array($roles)
                    && SuperAdmin::isGrantedBy($roles)
                    && ! $this->user()?->isSuperAdmin()
                ) {
                    $validator->errors()->add('roles', 'Only a Super Admin may assign the Super Admin role.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'roles.required' => 'Assign at least one role.',
            'roles.min' => 'Assign at least one role.',
        ];
    }
}
