<?php

namespace App\Http\Controllers\Backend\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backend\Admin\UpdateUserRoleRequest;
use App\Models\User;
use App\Support\AppPermissions;
use Illuminate\Http\RedirectResponse;

class UserRoleAssignmentController extends Controller
{
    public function update(UpdateUserRoleRequest $request, User $user): RedirectResponse
    {
        $role = $request->string('role')->toString();

        $user->syncRoles([$role]);
        $user->searchable();

        $tab = AppPermissions::tabFromRole($role) ?? AppPermissions::ALL_USERS_TAB;

        return redirect()
            ->route('admin.users.index', ['tab' => $tab])
            ->with('success', "{$user->name} is now assigned the {$role} role.");
    }
}
