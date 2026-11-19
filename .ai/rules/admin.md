---
paths:
  - app/Http/Controllers/Backend/Admin/PortalUserController.php
  - app/Http/Controllers/Backend/Admin/AdminStaffController.php
  - app/Http/Controllers/Backend/Admin/AdminProfileController.php
---

# Admin

## Users CRUD excludes admins; default tab is all
Admin Users pages list stakeholders only (never Super Admin). Default tab is all. Show/edit/update live under /admin/users/{user}; create supports role select when tab is all.

## Staff manages all admin roles
Admin Staff lists/CRUD users with any non-portal Spatie role (AppPermissions::adminStaffRoleNames()). Never assign stakeholder roles here. Super Admin grant/strip/delete guards stay. Portal Users stay stakeholder-only.

## Super Admin staff guards
Only Super Admins may edit/delete Super Admin staff or assign the Super Admin role. The system must always retain at least one Super Admin: block deleting or stripping Super Admin from the last holder with a clear warning to assign another Super Admin first.

## Admin self-profile is under /admin/profile
Authenticated admin-panel users manage their own profile at admin.profile (AdminLayout). Fields: name, email, phone, location, avatar, optional password (requires current_password). Role and status are read-only. Header dropdown links here; organization label is role_label, not a portal studio name.

## Admin email changes use pending + two-step OTP
Do not write a new address to `users.email` on profile submit. Store it on `pending_email`, keep the live email/`email_verified_at`, and verify via OTP: current email first, then new email (`EmailChangeService` + `SendEmailJob` templates `emails.profile-verify-current` / `emails.profile-verify-new`). Apply the new email only after both codes succeed. Portal `/profile` reuses the same service and flow.
