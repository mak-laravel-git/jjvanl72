<?php

namespace App\Http\Requests;

use App\Enums\UserAvailability;
use App\Models\User;
use App\Support\UserProfilePreferences;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $preferences = $this->input('notification_preferences');

        if (is_array($preferences)) {
            $normalized = [];

            foreach (UserProfilePreferences::channelKeys() as $key) {
                if (array_key_exists($key, $preferences)) {
                    $normalized[$key] = filter_var($preferences[$key], FILTER_VALIDATE_BOOLEAN);
                }
            }

            $this->merge([
                'notification_preferences' => $normalized,
            ]);
        }

        foreach (['company_name', 'business_registration', 'production_capacity'] as $field) {
            if ($this->input($field) === '') {
                $this->merge([$field => null]);
            }
        }

        if ($this->has('business_name') && is_string($this->input('business_name'))) {
            $this->merge([
                'business_name' => trim($this->input('business_name')),
            ]);
        }
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'business_name.required' => 'Enter your business name.',
        ];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->user();

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
                Rule::unique('users', 'pending_email')->ignore($user->id),
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:255'],
            'business_name' => [
                Rule::excludeIf($user->client_id === null),
                'required',
                'string',
                'max:160',
            ],
            'company_name' => ['nullable', 'string', 'max:255'],
            'business_registration' => ['nullable', 'string', 'max:255'],
            'production_capacity' => ['nullable', 'integer', 'min:0', 'max:65535'],
            'availability' => ['required', Rule::enum(UserAvailability::class)],
            'notification_preferences' => ['nullable', 'array'],
            'notification_preferences.'.UserProfilePreferences::PUSH_NOTIFICATIONS => ['sometimes', 'boolean'],
            'notification_preferences.'.UserProfilePreferences::SYSTEM_NOTIFICATIONS => ['sometimes', 'boolean'],
            'notification_preferences.'.UserProfilePreferences::EMAIL_NOTIFICATIONS => ['sometimes', 'boolean'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:2048'],
            'remove_avatar' => ['sometimes', 'boolean'],
            'current_password' => [
                'nullable',
                'required_with:password',
                'string',
                'current_password',
            ],
            'password' => ['nullable', 'string', Password::default(), 'confirmed'],
        ];
    }
}
