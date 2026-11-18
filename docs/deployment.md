# Vercel deployment preparation

This project is configured for Vercel Preview deployments. You can connect the `deploy-ready` branch to Vercel and deploy it yourself. This guide does not deploy the project or change your Vercel settings.

## Vercel project settings

Import the repository as a Next.js project and keep the repository root as the project root. Vercel can detect Next.js without a `vercel.json` file.

Use the default npm install command, `npm ci`, and the project build command, `npm run build`. The build script generates Prisma Client before building Next.js. It does not run database migrations.

Select `deploy-ready` as the Preview branch. Do not select it as the Production branch unless you intentionally want it to serve the production domain.

Enable Vercel system environment variables so the application can identify its Preview and Production URLs and use the correct storage mode.

## Environment variables

Set these variables in Vercel Project Settings. Add Preview values separately from Production values, and do not commit credentials.

| Variable | Preview | Production |
| --- | --- | --- |
| `DATABASE_URL` | Connection pool URL for the separate Preview Supabase project | Connection pool URL for the existing Production Supabase project |
| `DIRECT_URL` | Direct database URL for the Preview Supabase project | Direct database URL for the Production Supabase project |
| `AUTH_SECRET` | A unique secret of at least 32 characters | A different unique secret of at least 32 characters |
| `APP_URL` | The stable Preview branch URL, such as `https://<branch-domain>` | Your Production application URL |
| `BLOB_READ_WRITE_TOKEN` | Token for a private Preview Blob store | Token for a private Production Blob store |

Use separate Supabase projects and separate Blob stores for Preview and Production. This keeps Preview imports and test data isolated from live data.

Vercel supplies deployment URL variables at runtime. The application accepts the current Preview URL and stable branch URL for Preview requests, and the current deployment and Production URL for Production requests. Set `APP_URL` to the canonical URL for the matching environment. For Preview, you can get the stable branch URL from Vercel after its first Preview build.

Create `BLOB_READ_WRITE_TOKEN` from the corresponding private Vercel Blob store. The app uses direct browser uploads on Vercel so timetable files up to the existing 10 MB limit do not pass through the Vercel Function request body limit. Temporary uploads expire after one day. The application copies a successfully processed import into persistent private storage. Local development continues to use `STORAGE_LOCAL_DIR`.

If Blob storage is not configured in a Vercel environment, uploads fail with a clear configuration error. The application does not fall back to Vercel's temporary filesystem.

## Database migrations

Run migrations as a separate step before deploying a change that includes a migration. Do not add migrations to the Vercel build command.

For a Preview migration, configure the local shell with the Preview `DATABASE_URL` and `DIRECT_URL`, then run:

```powershell
npm run prisma:migrate:deploy
```

Use the Production connection values only when you intentionally prepare a Production release. Do not use the Preview project for Production migrations.

`DATABASE_URL` is the pooled connection used by the running app. `DIRECT_URL` is the direct connection Prisma uses for migrations. Keep both values scoped to the same Supabase project and environment.

If the Production database already has import records whose files exist only on a previous server's local disk, copy those files into the Production Blob store using their existing storage keys before promoting a Production deployment. This project does not automate that one time data transfer.

## Before you deploy

1. Confirm the Vercel project is linked to this repository and `deploy-ready` is configured as a Preview branch.
2. Add the Preview environment variables, including the separate Preview database and private Blob token.
3. Apply any pending migrations to the Preview database with `npm run prisma:migrate:deploy`.
4. Deploy the branch as a Preview and verify sign in, timetable reads, and timetable import and discard behavior.
5. Keep Production variables and the Production branch unchanged until you choose to release.
