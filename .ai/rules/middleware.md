---
paths:
  - app/Http/Middleware/HandleInertiaRequests.php
---

# Middleware

## Share Fortify reset and 2FA feature flags
Inertia shared features.canResetPassword and features.canUseTwoFactorAuthentication must follow Fortify Features::enabled(resetPasswords()) and Features::canManageTwoFactorAuthentication(). Do not hard-code them false or the login Forgot password link and 2FA settings UI stay hidden.
