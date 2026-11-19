<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Foundation\Http\FormRequest;

class DeleteDentalClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('dental-clients.delete') ?? false;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [];
    }
}
