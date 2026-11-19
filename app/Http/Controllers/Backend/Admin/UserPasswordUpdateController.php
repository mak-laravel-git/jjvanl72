<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UpdateUserPasswordRequest;
use App\Models\User;
use App\Support\AppPermissions;
use Illuminate\Http\RedirectResponse;

class UserPasswordUpdateController extends Controller
{
    public function __invoke(UpdateUserPasswordRequest $request, User $user): RedirectResponse
    {
        $user->update([
            'password' => $request->string('password')->toString(),
        ]);

        $tab = AppPermissions::tabFromRole($user->platformRole() ?? '') ?? 'dentists';

        return redirect()
            ->route('admin.users.index', ['tab' => $tab])
            ->with('success', "Password updated for {$user->name}.");
    }
}
