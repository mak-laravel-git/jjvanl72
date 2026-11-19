<?php

namespace App\Http\Requests\Backend\Admin;

use App\Support\AppPermissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('roles.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:125',
                Rule::notIn(AppPermissions::roles()),
                Rule::unique('roles', 'name')->where(fn ($query) => $query->where('guard_name', AppPermissions::GUARD)),
            ],
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
