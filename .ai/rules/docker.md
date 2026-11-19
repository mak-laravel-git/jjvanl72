---
paths:
  - 'Dockerfile'
  - 'docker/**'
---

# Docker / Coolify

## Separate Coolify services
Redis, Meilisearch, and the database run as separate Coolify containers. Do not add `docker-compose.yml` (or similar) that bundles Redis/Meilisearch into the app stack. The app image may include `phpredis`, entrypoint waits for external hosts, and a Supervisord queue worker on Redis queues `scout,default,emails`. Connect via `REDIS_*` and `MEILISEARCH_HOST` / `MEILISEARCH_KEY` env vars only.

## FCM service worker config from storage
Firebase SW loads `/firebase-messaging-config.js`, which Laravel renders from `storage/app/firebase-web-config.json` (`FirebaseWebConfig` + `firebase:sync-web-config`). Entrypoint runs that sync from `VITE_FIREBASE_*`. Nginx static `.js` location must `try_files $uri /index.php?$query_string` or Coolify returns 404 before PHP.
