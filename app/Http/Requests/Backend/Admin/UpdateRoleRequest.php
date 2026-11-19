<?php

namespace App\Http\Requests\Backend\Admin;

use App\Support\AppPermissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->route('role');

        if ($role instanceof Role && AppPermissions::isPortalType($role->name)) {
            return false;
        }

        return $this->user()?->can('roles.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Role $role */
        $role = $this->route('role');
        $nameRules = [
            'required',
            'string',
            'max:125',
            Rule::unique('roles', 'name')
                ->ignore($role->id)
                ->where(fn ($query) => $query->where('guard_name', AppPermissions::GUARD)),
        ];

        if ($role->name !== AppPermissions::SUPER_ADMIN_ROLE) {
            $reserved = array_values(array_filter(
                AppPermissions::roles(),
                fn (string $name): bool => $name !== $role->name,
            ));
            $nameRules[] = Rule::notIn($reserved);
        }

        return [
            'name' => $nameRules,
            'permissions' => ['nullable', 'array'],
            'permissions.*' => [
                'string',
                Rule::in(AppPermissions::adminPermissions()),
                Rule::exists('permissions', 'name')->where(fn ($query) => $query->where('guard_name', AppPermissions::GUARD)),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.not_in' => 'That role name is reserved.',
            'permissions.*.exists' => 'One of the selected permissions is invalid.',
            'permissions.*.in' => 'Portal permissions cannot be assigned to admin roles.',
        ];
    }
}
