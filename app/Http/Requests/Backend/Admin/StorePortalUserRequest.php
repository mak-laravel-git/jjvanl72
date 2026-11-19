<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\UserStatus;
use App\Support\AppPermissions;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePortalUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.create') ?? false;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('status')) {
            $this->merge(['status' => UserStatus::Active->value]);
        }

        $role = (string) $this->input('role');

        if (! in_array($role, AppPermissions::submitterTypes(), true)) {
            $this->merge(['client_id' => null]);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $role = (string) $this->input('role');
        $requiresClient = in_array($role, AppPermissions::submitterTypes(), true);

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', Rule::enum(UserStatus::class)],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => [
                'required',
                'string',
                Rule::in(AppPermissions::stakeholderRoles()),
                Rule::exists('roles', 'name')->where(
                    fn ($query) => $query->where('guard_name', AppPermissions::GUARD),
                ),
            ],
            'client_id' => [
                Rule::requiredIf($requiresClient),
                'nullable',
                'integer',
                Rule::exists('dental_clients', 'id')->where(fn ($query) => $query->where('is_active', true)->whereNull('deleted_at')),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role.required' => 'Select a user type.',
            'role.in' => 'The selected user type is invalid.',
            'client_id.required' => 'Select a dental client.',
        ];
    }
}
