---
paths:
  - 'resources/js/**/*.{ts,tsx}'
---

# Js

## Use Wayfinder, not Ziggy
Frontend route URLs must come from Wayfinder (`@/routes` / `@/actions`) with `.url()` / `.form()`. Do not use Ziggy, a global `route()` helper, or `@routes` in Blade. For nav/config data, store resolved `href` strings instead of Laravel route-name strings. Always generate with `php artisan wayfinder:generate --with-form --no-interaction` (Vite already uses `formVariants: true`). Generating without `--with-form` makes `store.form()` throw at runtime on admin Index pages.

## Portal light mode
PortalLayout forces light appearance (same pattern as AdminLayout): remove `html.dark` and set `colorScheme: light` while mounted, and wrap content in dark text (`text-[#050315]`). Portal screens use light panels; dark-mode `text-foreground` made form controls and unlabeled text invisible. Keep create-case/show controls with explicit `text-[#334155]` / `controlClass` as defense in depth.
