<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Foundation\Http\FormRequest;

class DeleteDentalPackagePriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('dental-package-prices.delete') ?? false;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [];
    }
}
