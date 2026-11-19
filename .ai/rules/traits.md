---
paths:
  - 'app/Models/Notification.php,app/Models/UserNotification.php,app/Services/NotificationService.php,app/Traits/HasAppNotifications.php'
---

# Traits

## Custom in-app notifications only
Use notifications + user_notifications with NotificationService / notify_user helpers. Do not use Laravel Notifiable::notify() or the default database notifications morph table for this domain. Per-user soft deletes live on user_notifications.deleted_at; read state on read_at. UserNotificationCreated is Reverb-ready (ShouldBroadcast).

## Admin notifications UI (shipped)
Admin inbox lives under `/admin/notifications` (Index filters All/Unread/Read + pagination, Show auto-marks read, Broadcast compose for roles/users). Header bell uses `admin-notifications-dialog` + shared `unreadNotificationsCount`. Permissions: `notifications.view`, `notifications.broadcast`. Reverb/Echo client wiring is a follow-up — keep events broadcast-ready, do not require Reverb to be running for inbox CRUD to work.

## Sending notifications
Prefer `NotificationService` / `notify_user()` / `notify_users()` with `NotificationPayload`. Soft-delete is per recipient on `user_notifications` only; never hard-delete the master `notifications` row just because one user dismissed it.
