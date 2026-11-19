<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\CaseOutput;
use App\Enums\CaseService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDentalPackagePriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('dental-package-prices.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $requiresManufacture = $this->input('service') === CaseService::Manufacture->value;

        return [
            'dental_product_id' => ['required', 'integer', Rule::exists('dental_products', 'id')],
            'dental_material_id' => ['nullable', 'integer', Rule::exists('dental_materials', 'id')],
            'service' => ['required', Rule::enum(CaseService::class)],
            'output' => [
                Rule::requiredIf($requiresManufacture),
                'nullable',
                Rule::enum(CaseOutput::class),
            ],
            'price' => ['required', 'numeric', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $requiresManufacture = $this->input('service') === CaseService::Manufacture->value;
        $materialId = $this->input('dental_material_id');

        $this->merge([
            'dental_material_id' => $materialId === '' || $materialId === null
                ? null
                : $materialId,
            'output' => $requiresManufacture ? $this->input('output') : null,
        ]);
    }
}
