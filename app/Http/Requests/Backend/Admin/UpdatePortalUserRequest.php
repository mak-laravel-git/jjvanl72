<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\UserStatus;
use App\Models\User;
use App\Support\AppPermissions;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePortalUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $actor = $this->user();
        $target = $this->route('user');

        if (! $actor?->can('users.update') || ! $target instanceof User) {
            return false;
        }

        if ($target->isSuperAdmin() || $target->platformRole() === null) {
            return false;
        }

        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->route('user');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', Rule::enum(UserStatus::class)],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
            'remove_avatar' => ['sometimes', 'boolean'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'role' => [
                Rule::requiredIf(fn (): bool => $this->user()?->isSuperAdmin() ?? false),
                'nullable',
                'string',
                Rule::in(AppPermissions::stakeholderRoles()),
                Rule::exists('roles', 'name')->where(
                    fn ($query) => $query->where('guard_name', AppPermissions::GUARD),
                ),
            ],
            'client_id' => [
                Rule::requiredIf(function (): bool {
                    $role = (string) ($this->input('role') ?: $this->route('user')?->platformRole());

                    return in_array($role, AppPermissions::submitterTypes(), true);
                }),
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

    protected function prepareForValidation(): void
    {
        $role = (string) ($this->input('role') ?: $this->route('user')?->platformRole());

        if (! in_array($role, AppPermissions::submitterTypes(), true)) {
            $this->merge(['client_id' => null]);
        }
    }
}
