<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\ProductCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:products,name'],
            'category' => ['required', 'string', Rule::enum(ProductCategory::class)],
            'material' => ['required', 'string', 'max:255'],
            'design_price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'mfg_price' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'rush_fee' => ['required', 'numeric', 'min:0', 'max:999999.99'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'A product with this name already exists.',
            'category.Illuminate\Validation\Rules\Enum' => 'Select a valid category.',
            'design_price.required' => 'Enter a design price.',
            'mfg_price.required' => 'Enter a manufacturing price.',
            'rush_fee.required' => 'Enter a rush fee.',
        ];
    }
}
