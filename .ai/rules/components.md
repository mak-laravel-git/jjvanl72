---
paths:
  - resources/js/components/file-upload.tsx
  - resources/js/components/portal-user-form.tsx
---

# Components

## FileUpload preview alive flag and controlled sync
Mount effect must set alive.current = true (not cleanup-only). Cleanup-only leaves alive false after Strict Mode/HMR so processFiles drops the first selection. Always call onChange even if unmounted; rebuild previews from controlled value when keys drift (init state from value).

## Precognition for portal user email
Portal user create/update forms use Inertia Form Precognition for live email uniqueness. Routes admin.users.store and admin.users.update must keep HandlePrecognitiveRequests. Validate email on change/blur via Form validate('email'); do not reimplement unique checks in JS.
