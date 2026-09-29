# Testing

Run unit tests with `npm run test:unit`. Run PostgreSQL integration tests with `npm run test:integration` after setting `DATABASE_URL` to a migrated test database. Run all Vitest suites with `npm test`.

The integration suite uses real PostgreSQL and creates uniquely identified fixtures that it removes after each test. It covers schedule mutation concurrency and persistence, effective timetable reads, venue lifecycle, notification isolation, imports, announcements, and route authorization.

Run browser tests with `npm run test:e2e`. Playwright uses installed Microsoft Edge (`channel: msedge`) and starts the Next.js dev server on port 3100. Run `npm run typecheck` and `npm run lint` as additional gates.