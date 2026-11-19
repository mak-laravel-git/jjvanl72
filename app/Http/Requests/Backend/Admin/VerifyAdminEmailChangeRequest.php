<?php

namespace App\Http\Requests\Backend\Admin;

use App\Http\Requests\VerifyEmailChangeRequest;

class VerifyAdminEmailChangeRequest extends VerifyEmailChangeRequest
{
    public function authorize(): bool
    {
        return $this->user()?->canAccessAdminPanel() ?? false;
    }
}
