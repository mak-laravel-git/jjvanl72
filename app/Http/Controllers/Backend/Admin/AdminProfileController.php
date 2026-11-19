<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UpdateAdminProfileRequest;
use App\Http\Requests\Backend\Admin\VerifyAdminEmailChangeRequest;
use App\Models\User;
use App\Services\EmailChangeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class AdminProfileController extends Controller
{
    public function __construct(
        private EmailChangeService $emailChange,
    ) {}

    public function edit(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('backend/Admin/Profile/Edit', [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'location' => $user->location,
                'status' => ($user->status ?? null)?->value ?? 'active',
                'status_label' => $user->statusLabel(),
                'role_label' => $user->role_label,
                'roles' => $user->getRoleNames()->values()->all(),
                'avatar_url' => $user->avatar_url,
                'created_at' => $user->created_at?->toIso8601String(),
            ],
            'emailChange' => $this->emailChange->status($user),
            'canUseTwoFactor' => Features::canManageTwoFactorAuthentication(),
        ]);
    }

    public function update(UpdateAdminProfileRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $data = $request->validated();

        $payload = collect($data)
            ->except(['password', 'password_confirmation', 'current_password', 'avatar', 'remove_avatar', 'email'])
            ->all();

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
                ->route('admin.profile.edit')
                ->with('success', 'Profile updated. Please verify your email change.')
                ->with('email_change_started', true);
        }

        return redirect()
            ->route('admin.profile.edit')
            ->with('success', 'Profile updated successfully.');
    }

    public function verifyCurrentEmail(VerifyAdminEmailChangeRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->emailChange->verifyCurrent($user, $request->validated('code'));

        return redirect()
            ->route('admin.profile.edit')
            ->with('success', 'Current email verified. Enter the code sent to your new email.');
    }

    public function verifyNewEmail(VerifyAdminEmailChangeRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->emailChange->verifyNew($user, $request->validated('code'));

        return redirect()
            ->route('admin.profile.edit')
            ->with('success', 'Email address updated successfully.');
    }

    public function resendEmailChangeCode(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless($user->canAccessAdminPanel(), 403);

        $this->emailChange->resend($user);

        return redirect()
            ->route('admin.profile.edit')
            ->with('success', 'A new verification code has been sent.');
    }

    public function cancelEmailChange(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless($user->canAccessAdminPanel(), 403);

        $this->emailChange->cancel($user);

        return redirect()
            ->route('admin.profile.edit')
            ->with('success', 'Email change cancelled.');
    }
}
