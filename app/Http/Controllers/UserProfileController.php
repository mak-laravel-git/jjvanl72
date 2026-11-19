<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserProfileRequest;
use App\Http\Requests\VerifyEmailChangeRequest;
use App\Models\User;
use App\Services\EmailChangeService;
use App\Support\UserProfilePreferences;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class UserProfileController extends Controller
{
    public function __construct(
        private EmailChangeService $emailChange,
    ) {}

    public function edit(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('backend/User/ProfileSettings', [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'location' => $user->location,
                'company_name' => $user->company_name,
                'business_registration' => $user->business_registration,
                'production_capacity' => $user->production_capacity,
                'status' => ($user->status ?? null)?->value ?? 'active',
                'status_label' => $user->statusLabel(),
                'role_label' => $user->role_label,
                'avatar_url' => $user->avatar_url,
                'availability' => ($user->availability ?? null)?->value
                    ?? 'available',
                'notification_preferences' => UserProfilePreferences::mergeFor($user),
                'notification_preference_labels' => UserProfilePreferences::labelsFor($user),
            ],
            'emailChange' => $this->emailChange->status($user),
            'canUseTwoFactor' => Features::canManageTwoFactorAuthentication(),
        ]);
    }

    public function update(UpdateUserProfileRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        $payload = collect($data)
            ->except(['password', 'password_confirmation', 'current_password', 'avatar', 'remove_avatar', 'email'])
            ->all();

        if (array_key_exists('notification_preferences', $payload)) {
            $payload['notification_preferences'] = UserProfilePreferences::mergeFor(
                $user,
                is_array($payload['notification_preferences'])
                    ? $payload['notification_preferences']
                    : null,
            );
        }

        if ($request->boolean('remove_avatar') && $user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $payload['avatar'] = null;
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $payload['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        if (! empty($data['password'])) {
            $payload['password'] = $data['password'];
        }

        $requestedEmail = $data['email'];
        $emailChanged = $requestedEmail !== $user->email;

        if (! $emailChanged) {
            $payload['email'] = $requestedEmail;
        }

        $user->fill($payload);
        $user->save();
        $user->searchable();

        if ($emailChanged) {
            $this->emailChange->start($user, $requestedEmail);

            return redirect()
                ->route('user-profile.edit')
                ->with('success', 'Profile updated. Please verify your email change.')
                ->with('email_change_started', true);
        }

        return redirect()
            ->route('user-profile.edit')
            ->with('success', 'Profile updated successfully.');
    }

    public function verifyCurrentEmail(VerifyEmailChangeRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->emailChange->verifyCurrent($user, $request->validated('code'));

        return redirect()
            ->route('user-profile.edit')
            ->with('success', 'Current email verified. Enter the code sent to your new email.');
    }

    public function verifyNewEmail(VerifyEmailChangeRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->emailChange->verifyNew($user, $request->validated('code'));

        return redirect()
            ->route('user-profile.edit')
            ->with('success', 'Email address updated successfully.');
    }

    public function resendEmailChangeCode(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->emailChange->resend($user);

        return redirect()
            ->route('user-profile.edit')
            ->with('success', 'A new verification code has been sent.');
    }

    public function cancelEmailChange(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->emailChange->cancel($user);

        return redirect()
            ->route('user-profile.edit')
            ->with('success', 'Email change cancelled.');
    }
}
