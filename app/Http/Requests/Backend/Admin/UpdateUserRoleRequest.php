<?php

namespace App\Http\Requests\Backend\Admin;

use App\Support\AppPermissions;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'role' => [
                'required',
                'string',
                Rule::in(AppPermissions::stakeholderRoles()),
                Rule::exists('roles', 'name')->where(
                    fn ($query) => $query->where('guard_name', AppPermissions::GUARD),
                ),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role.required' => 'Select a stakeholder role.',
            'role.in' => 'The selected role is invalid.',
        ];
    }
}
