<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDentalProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('dental-products.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'regex:/^#[0-9A-F]{6}$/',
                Rule::unique('dental_products', 'code'),
            ],
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'image', 'mimes:jpeg,jpg,png'],
            'is_active' => ['sometimes', 'boolean'],
            'dental_product_group_id' => [
                'required',
                'integer',
                Rule::exists('dental_product_groups', 'id'),
            ],
            'materials' => ['sometimes', 'array'],
            'materials.*.id' => [
                'required',
                'integer',
                Rule::exists('dental_materials', 'id'),
                'distinct',
            ],
            'materials.*.is_default' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.unique' => 'A product with this color already exists.',
            'code.regex' => 'Choose a valid hex color (e.g. #AA00B8).',
            'icon.image' => 'The icon must be an image.',
            'icon.mimes' => 'The icon must be a JPG or PNG file.',
            'dental_product_group_id.required' => 'Select a product group.',
            'dental_product_group_id.exists' => 'Select a valid product group.',
            'materials.*.id.exists' => 'Select a valid material.',
            'materials.*.id.distinct' => 'Each material can only be linked once.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $materials = $this->input('materials');

        if (is_array($materials)) {
            $materials = collect($materials)
                ->map(function (mixed $row): mixed {
                    if (! is_array($row)) {
                        return $row;
                    }

                    $row['is_default'] = filter_var($row['is_default'] ?? false, FILTER_VALIDATE_BOOLEAN);

                    return $row;
                })
                ->all();
        }

        $this->merge([
            'is_active' => $this->boolean('is_active'),
            'code' => $this->normalizeColorCode($this->input('code')),
            'materials' => $materials ?? [],
        ]);
    }

    private function normalizeColorCode(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        $trimmed = strtoupper(trim($value));

        if ($trimmed === '') {
            return $trimmed;
        }

        if (! str_starts_with($trimmed, '#')) {
            $trimmed = '#'.$trimmed;
        }

        return $trimmed;
    }
}
