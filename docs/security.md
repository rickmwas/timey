# Security

- API input is validated with Zod at route boundaries.
- Access cookies are HTTP-only, same-site, and secure in production; refresh tokens are stored as hashes and rotated.
- `requireUser`, role checks, and permission checks protect routes. Resource services enforce lecturer assignment, announcement authorship, and notification recipient scope.
- Cookie-authenticated mutations use same-origin validation. Login attempts are rate limited in process memory.
- Schedule writes use serializable transactions, expected entry versions, idempotency keys, and database uniqueness constraints.
- Import uploads are limited to 10 MB, checked for CSV/XLSX format, SHA-256 deduplicated per period, and stored outside the web root.
- Do not log passwords, cookies, authorization headers, tokens, or uploaded file contents.

The current rate limiter is process-local and is not shared across multiple application instances. Replace it with shared storage before horizontal scaling. Review the installed Next.js security advisory before public deployment.