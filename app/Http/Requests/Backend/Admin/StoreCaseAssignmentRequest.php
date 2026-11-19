<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\DentalCaseAssignmentRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCaseAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('assignments.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'dental_case_id' => ['required', 'integer', 'exists:dental_cases,id'],
            'role' => ['required', 'string', Rule::enum(DentalCaseAssignmentRole::class)],
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'distinct', 'exists:users,id'],
        ];
    }
}
