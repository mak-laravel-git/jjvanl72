---
paths:
  - app/Models/User.php
---

# Models

## User is Scout searchable via Meilisearch
User uses Searchable with index users. toSearchableArray only exposes id/name/email/phone/location/status/role_names/created_at. Admin Users/Staff list search goes through App\Support\UserSearch (Scout keys then Eloquent filters). After syncRoles call searchable(). SCOUT_QUEUE uses Redis queue name scout.

## Portal notification channels are push / system / email only
Portal users store only `push_notifications`, `system_notifications`, and `email_notifications` in `notification_preferences` JSON (defaults true). Access via `$user->wants_push_notifications`, `$user->wants_system_notifications`, `$user->wants_email_notifications` (or `UserProfilePreferences`). Admin self-profile has no channel prefs UI.
