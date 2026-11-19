<?php

namespace App\Http\Requests\Backend\Admin;

use App\Models\DentalProductGroup;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDentalProductGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('dental-product-groups.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var DentalProductGroup $dentalProductGroup */
        $dentalProductGroup = $this->route('dentalProductGroup');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('dental_product_groups', 'name')->ignore($dentalProductGroup->id),
            ],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'A group with this name already exists.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active'),
        ]);
    }
}
