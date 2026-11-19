---
paths:
  - 'app/Enums/**'
---

# Enums

## User status is UserStatus enum
User account status lives in App\Enums\UserStatus (Active/Inactive). Cast User::$status to the enum, default Active in migration + model $attributes, and validate with Rule::enum(UserStatus::class). Prefer UserStatus::values() / ->label() over string constants on User.
