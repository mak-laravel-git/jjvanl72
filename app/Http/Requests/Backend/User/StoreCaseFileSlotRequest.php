<?php

namespace App\Http\Requests\Backend\User;

use App\Models\DentalCase;
use Illuminate\Foundation\Http\FormRequest;

class StoreCaseFileSlotRequest extends FormRequest
{
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

        return $user->can('manageFiles', $case);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:160'],
        ];
    }
}
