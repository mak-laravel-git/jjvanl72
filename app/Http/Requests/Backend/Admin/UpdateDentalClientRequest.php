<?php

namespace App\Http\Requests\Backend\Admin;

use App\Models\DentalClient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDentalClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('dental-clients.update') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var DentalClient $dentalClient */
        $dentalClient = $this->route('dentalClient');

        return [
            'code' => [
                'required',
                'string',
                'max:40',
                Rule::unique('dental_clients', 'code')->ignore($dentalClient->id),
            ],
            'name' => ['required', 'string', 'max:160'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.unique' => 'A client with this code already exists.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => $this->boolean('is_active'),
            'code' => strtoupper(trim((string) $this->input('code'))),
        ]);
    }
}
