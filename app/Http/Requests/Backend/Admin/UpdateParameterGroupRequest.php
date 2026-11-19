<?php

namespace App\Http\Requests\Backend\Admin;

use App\Models\ParameterGroup;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateParameterGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('parameter-groups.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var ParameterGroup $parameterGroup */
        $parameterGroup = $this->route('parameterGroup');

        return [
            'title' => [
                'required',
                'string',
                'max:120',
                Rule::unique('parameter_groups', 'name')->ignore($parameterGroup->id),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.unique' => 'A group with this title already exists.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('title'))) {
            $this->merge([
                'title' => trim($this->input('title')),
            ]);
        }
    }
}
