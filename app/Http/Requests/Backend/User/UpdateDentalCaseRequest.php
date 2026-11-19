<?php

namespace App\Http\Requests\Backend\User;

use App\Models\DentalCase;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDentalCaseRequest extends FormRequest
{
    use ValidatesDentalCasePayload;

    public function authorize(): bool
    {
        $user = $this->user();
        $case = $this->route('dentalCase');

        if ($user === null || ! $case instanceof DentalCase) {
            return false;
        }

        if ($user->cannot('view', $case)) {
            abort(404);
        }

        return $user->can('update', $case);
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
        return [
            ...$this->caseRules(),
            'lock_version' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            ...$this->caseMessages(),
            'lock_version.required' => 'This case was updated elsewhere. Reload and try again.',
        ];
    }

    /**
     * @return list<\Closure>
     */
    public function after(): array
    {
        return [
            ...$this->caseAfterValidation(),
            function ($validator): void {
                $case = $this->route('dentalCase');

                if (! $case instanceof DentalCase || $validator->errors()->isNotEmpty()) {
                    return;
                }

                if ((int) $this->input('lock_version') !== (int) $case->lock_version) {
                    $validator->errors()->add(
                        'lock_version',
                        'This case was updated elsewhere. Reload and try again.',
                    );
                }
            },
        ];
    }
}
