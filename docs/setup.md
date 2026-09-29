# Local Setup

## Requirements

- Node.js 20 or later and npm
- PostgreSQL 15 or later
- A local `.env` based on `.env.example`

## Start

1. Install dependencies with `npm install`.
2. Set `DATABASE_URL`, `AUTH_SECRET` (at least 32 characters in production), and `APP_URL` in `.env`.
3. Set `STORAGE_LOCAL_DIR` to a writable directory outside the repository web root. The default is `../timy-local-storage`.
4. Generate Prisma Client with `npm run prisma:generate`.
5. Apply committed migrations with `npx prisma migrate deploy`.
6. For development seed data only, set the `SEED_*` values listed in `.env.example`, then run `npm run prisma:seed`.
7. Start the app with `npm run dev`.

Never use development seed credentials in production. The seed refuses to run when `NODE_ENV=production`.