<?php

namespace App\Http\Requests\Backend\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterNotificationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('notifications.view') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'filter' => ['sometimes', 'nullable', 'string', Rule::in(['all', 'unread', 'read'])],
        ];
    }

    public function filter(): string
    {
        return $this->validated('filter') ?? 'all';
    }
}
