# Database

PostgreSQL is managed through Prisma. The schema is in `prisma/schema.prisma`; ordered migration history is in `prisma/migrations/`.

For an empty database, set `DATABASE_URL`, run `npm run prisma:generate`, then `npx prisma migrate deploy`. Do not use `prisma db push` as a substitute for committed migration history. Seed data is development-only and configured through `SEED_*` variables.

Core scheduling records are `AcademicPeriod`, `CourseOffering`, and recurring `TimetableEntry` rows. One-date changes are represented by `ScheduleOverride`; each mutation adds a `ScheduleChange`. Import jobs own staged rows, and notifications reference their recipient and optionally a schedule change.