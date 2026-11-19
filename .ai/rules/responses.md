---
paths:
  - 'app/Http/Responses/**'
---

# Responses

## Fortify owns login redirects
Login is Fortify AuthenticatedSessionController. Bind App\Http\Responses\LoginResponse so admins go to admin.dashboard and portal users to dashboard. Do not restore UnifiedLoginController. Keep Fortify::ignoreRoutes() and register login/logout in routes/frontend.php next to fortify-extra.php password-reset routes.

Bind App\Http\Responses\TwoFactorLoginResponse the same way. After a TOTP or recovery-code challenge, admins go to admin.dashboard and everyone else to dashboard. Do not leave Fortify's default (fortify.home / /dashboard) or admins land in the portal.
