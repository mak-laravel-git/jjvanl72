<?php

namespace App\Http\Requests\Backend\Admin;

use App\Models\DentalMaterial;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDentalMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('dental-materials.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var DentalMaterial $dentalMaterial */
        $dentalMaterial = $this->route('dentalMaterial');

        return [
            'code' => [
                'required',
                'string',
                'regex:/^#[0-9A-F]{6}$/',
                Rule::unique('dental_materials', 'code')->ignore($dentalMaterial->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'image', 'mimes:jpeg,jpg,png'],
            'remove_icon' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'products' => ['sometimes', 'array'],
            'products.*.id' => [
                'required',
                'integer',
                Rule::exists('dental_products', 'id'),
                'distinct',
            ],
            'products.*.is_default' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.unique' => 'A material with this color already exists.',
            'code.regex' => 'Choose a valid hex color (e.g. #AA00B8).',
            'icon.image' => 'The icon must be an image.',
            'icon.mimes' => 'The icon must be a JPG or PNG file.',
            'products.*.id.exists' => 'Select a valid product.',
            'products.*.id.distinct' => 'Each product can only be linked once.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $products = $this->input('products');

        if (is_array($products)) {
            $products = collect($products)
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
            'remove_icon' => $this->boolean('remove_icon'),
            'code' => $this->normalizeColorCode($this->input('code')),
            'products' => $products ?? [],
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
