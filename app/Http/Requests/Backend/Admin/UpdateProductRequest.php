<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\ProductCategory;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('products.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Product $product */
        $product = $this->route('product');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'name')->ignore($product->id),
            ],
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
