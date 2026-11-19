---
paths:
  - app/Providers/TelescopeServiceProvider.php
---

# Providers

## Telescope is Super Admin only, even locally
Telescope is require-dev and registered only in local (dont-discover + AppServiceProvider). Override authorization() so the viewTelescope gate always runs — do not allow every local user. Gate: $user->isSuperAdmin(). Avatars use User::avatar_url.
