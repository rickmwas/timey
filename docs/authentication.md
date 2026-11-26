# Authentication

Users sign in with email or institutional ID and a bcrypt password hash (cost 12). Login sets HTTP-only `timy_access` and `timy_refresh` cookies. The access token expires after 15 minutes; the refresh token is random, stored hashed in `AuthSession`, and rotated with a seven-day expiry.

Every protected request verifies the token and its persisted session, including revocation, expiry, active user status, and forced password change. Logout and password changes revoke sessions. Cookies use `SameSite=Lax`, `Secure` in production, and `HttpOnly`.

Roles are `STUDENT`, `LECTURER`, `TIMETABLE_OFFICER`, and `ADMIN`. Students read their cohort schedule and notifications. Lecturers act on assigned teaching slots and announcements in their teaching scope. Timetable officers manage schedules, imports, venues, and announcements. Administrators additionally manage users and audit history.