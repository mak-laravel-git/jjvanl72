<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\UserStatus;
use App\Models\User;
use App\Support\AppPermissions;
use App\Support\SuperAdmin;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User $target */
        $target = $this->route('adminStaff');
        $actor = $this->user();

        return ($actor?->can('admins.update') ?? false)
            && (! $target->isSuperAdmin() || $actor?->isSuperAdmin());
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
        /** @var User $target */
        $target = $this->route('adminStaff');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($target->id),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', Rule::enum(UserStatus::class)],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
            'remove_avatar' => ['sometimes', 'boolean'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
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
                /** @var User $target */
                $target = $this->route('adminStaff');
                $roles = $this->input('roles', []);

                if (! is_array($roles)) {
                    return;
                }

                if (
                    SuperAdmin::isGrantedBy($roles)
                    && ! $this->user()?->isSuperAdmin()
                ) {
                    $validator->errors()->add('roles', 'Only a Super Admin may assign the Super Admin role.');
                }

                if (SuperAdmin::isLast($target) && ! SuperAdmin::isGrantedBy($roles)) {
                    $validator->errors()->add(
                        'roles',
                        'The system must keep at least one Super Admin. Assign the Super Admin role to another admin, then remove or change it on this account.',
                    );
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
