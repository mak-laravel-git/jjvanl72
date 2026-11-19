<?php

namespace App\Http\Requests\Backend\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreDentalCaseRequest extends FormRequest
{
    use ValidatesDentalCasePayload;

    public function authorize(): bool
    {
        return $this->user()?->can('cases.create') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->prepareCasePayload();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->caseRules();
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return $this->caseMessages();
    }

    /**
     * @return list<\Closure>
     */
    public function after(): array
    {
        return $this->caseAfterValidation();
    }
}
