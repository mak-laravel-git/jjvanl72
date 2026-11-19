<?php

namespace App\Policies;

use App\Enums\DentalCaseAssignmentRole;
use App\Models\DentalCase;
use App\Models\User;
use App\Support\AppPermissions;

class DentalCasePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('cases.view') || $user->can('cases.create');
    }

    public function view(User $user, DentalCase $dentalCase): bool
    {
        if ($this->isAdminCaseManager($user)) {
            return true;
        }

        if ($this->owns($user, $dentalCase) && $user->can('cases.view')) {
            return true;
        }

        return $this->canCollaborateOnFiles($user, $dentalCase);
    }

    public function create(User $user): bool
    {
        return $user->can('cases.create');
    }

    public function update(User $user, DentalCase $dentalCase): bool
    {
        if ($this->isAdminCaseManager($user)) {
            return true;
        }

        return $this->owns($user, $dentalCase) && $user->can('cases.create');
    }

    public function delete(User $user, DentalCase $dentalCase): bool
    {
        return $this->owns($user, $dentalCase)
            && $user->can('cases.create')
            && $dentalCase->isDraft();
    }

    /**
     * Owner, assigned designer, or Lab on a non-draft case may manage file slots.
     */
    public function manageFiles(User $user, DentalCase $dentalCase): bool
    {
        if ($this->isAdminCaseManager($user)) {
            return true;
        }

        if ($this->owns($user, $dentalCase) && $user->can('cases.create')) {
            return true;
        }

        return $this->canCollaborateOnFiles($user, $dentalCase);
    }

    private function canCollaborateOnFiles(User $user, DentalCase $dentalCase): bool
    {
        if ($dentalCase->isDraft()) {
            return false;
        }

        if ($user->platformRole() === AppPermissions::LAB_ROLE && $user->can('cases.view')) {
            return true;
        }

        if ($user->platformRole() !== AppPermissions::DESIGNER_ROLE) {
            return false;
        }

        if (! $user->can('cases.view') && ! $user->can('assignments.view')) {
            return false;
        }

        return $dentalCase->assignments()
            ->where('user_id', $user->id)
            ->where('role', DentalCaseAssignmentRole::Designer->value)
            ->exists();
    }

    private function owns(User $user, DentalCase $dentalCase): bool
    {
        return (int) $dentalCase->created_by === (int) $user->id;
    }

    private function isAdminCaseManager(User $user): bool
    {
        return $user->canAccessAdminPanel() && $user->can('cases.view');
    }
}
