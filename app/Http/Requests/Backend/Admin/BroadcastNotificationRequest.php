<?php

namespace App\Http\Requests\Backend\Admin;

use App\Enums\NotificationType;
use App\Support\AppPermissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class BroadcastNotificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('notifications.broadcast') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $roleNames = Role::query()
            ->where('guard_name', AppPermissions::GUARD)
            ->pluck('name')
            ->all();

        return [
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'type' => ['required', 'string', Rule::enum(NotificationType::class)],
            'reference' => ['nullable', 'string', 'max:100'],
            'roles' => ['nullable', 'array'],
            'roles.*' => ['string', Rule::in($roleNames)],
            'user_ids' => ['nullable', 'array'],
            'user_ids.*' => ['integer', 'exists:users,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $roles = $this->input('roles', []);
            $userIds = $this->input('user_ids', []);

            if ((! is_array($roles) || $roles === []) && (! is_array($userIds) || $userIds === [])) {
                $validator->errors()->add('roles', 'Select at least one role or user.');
            }
        });
    }
}
