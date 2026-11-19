---
paths:
  - app/Support/AppPermissions.php
---

# Support

## Portal types are not admin roles
Dentist, Denturist, Lab, Designer, and Manufacturer are immutable portal types. Admin Roles UI lists and edits only admin staff roles and adminPermissions(). Portal access is gated by EnsurePortalType (portal.type middleware), not by editing portal Spatie roles. Super Admin Gate::before grants adminPermissions() only — never portal abilities.

## adminStaffRoleNames helper
Use adminStaffRoleNames() for Staff assignable roles and Roles UI filters (guard web, exclude stakeholderRoles()). Do not hardcode Super Admin as the only staff role.
