<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\DeleteUserRequest;
use App\Models\User;
use App\Support\AppPermissions;
use Illuminate\Http\RedirectResponse;

class UserDeleteController extends Controller
{
    public function __invoke(DeleteUserRequest $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user)) {
            return back()->with('error', 'You cannot permanently delete your own account.');
        }

        if ($user->isSuperAdmin()) {
            return back()->with('error', 'Super Admin accounts must be managed from Admin Staff.');
        }

        $tab = AppPermissions::tabFromRole($user->platformRole() ?? '') ?? AppPermissions::ALL_USERS_TAB;
        $name = $user->name;

        $user->delete();

        return redirect()
            ->route('admin.users.index', ['tab' => $tab])
            ->with('success', "{$name} was permanently deleted.");
    }
}
