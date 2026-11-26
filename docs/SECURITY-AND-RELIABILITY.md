# TIMEY — Platform Reliability, Security & Notification Infrastructure

## 1. Audit & Remediation of Security Findings

### 1.1 Web Push Payload Mismatch (P0 - Resolved)
- **Problem**: Client sent flat `{ endpoint, keys }`, server required nested `{ subscription: { endpoint, keys } }`, returning 400 errors for all push registrations.
- **Remediation**: `src/lib/push-client.ts` now supplies both root and nested payloads. `src/app/api/v1/push/subscribe/route.ts` accepts both schema variants and returns standard typed responses.

### 1.2 Unauthenticated SSE Stream & IDOR Vulnerability (P0 - Resolved)
- **Problem**: `GET /api/v1/notifications/stream` accepted arbitrary `cohortId` and `userId` from query parameters without verifying session cookies, exposing university-wide timetable modifications.
- **Remediation**: Enforced `requireUser(request)` authentication guard. Students and lecturers are strictly scoped to their own identity and enrolled cohort. Privileged roles (Admin, Officer, Dean) can monitor broader scopes.

### 1.3 Hardcoded Fallback VAPID Secrets (P0 - Resolved)
- **Problem**: Fallback private keys were hardcoded in source control (`src/server/push/web-push.ts` and `src/lib/push-client.ts`).
- **Remediation**: Removed all hardcoded fallback private keys. Mandated runtime environment configuration (`VAPID_PRIVATE_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY`). In production, missing credentials fail fast; in development, Web Push safely disables without throwing or exposing fake keys.

### 1.4 Cron Authorization Bypass (P0 - Resolved)
- **Problem**: `CRON_SECRET` check allowed unauthenticated access if the environment variable was empty or missing.
- **Remediation**: Replaced with fail-closed authentication. Enforced minimum secret length (16+ chars) and constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks.

### 1.5 Class Reminders & Schedule Override Blindness (P0 - Resolved)
- **Problem**: Cron ran once daily (`0 5 * * *`) despite checking narrow 30m/10m windows, completely ignored cancellations and reschedules, suffered timezone rollover bugs, and lacked deduplication.
- **Remediation**:
  - `vercel.json` updated to run every 5 minutes (`*/5 * * * *`).
  - East Africa Time (`Africa/Nairobi`, UTC+3) calculated with proper calendar day resolution.
  - Queries active entries AND inspects `ScheduleOverride`: cancelled/postponed classes are suppressed; rescheduled classes alert with new time and room.
  - Deduplication ledger (`ClassReminderLog`) prevents duplicate notifications.

### 1.6 Side-Effects Inside Serializable Transactions (P0 - Resolved)
- **Problem**: `src/server/services/schedule-writes.ts` dispatched Web Push and SSE events inside a `db.$transaction(..., { isolationLevel: Serializable })`. If the transaction failed, notifications had already been dispatched.
- **Remediation**: Implemented the Transactional Outbox pattern. `OutboxEvent` records are inserted atomically inside the transaction. Network side effects are executed strictly after the transaction commits.

### 1.7 Ephemeral Storage Inconsistency (P0 - Resolved)
- **Problem**: `imports.ts` directly imported `localFileStorage`, bypassing cloud blob storage on serverless runtimes.
- **Remediation**: Unified under `fileStorage` provider (`@/server/storage/file-storage-provider`), ensuring uniform persistence across local disk and Vercel Blob.
