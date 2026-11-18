# Architecture

The canonical architecture diagrams and system boundaries are maintained in the repository root at [architecture.md](../architecture.md). This file keeps the architecture discoverable from the documentation index without duplicating that source.

The runtime uses Next.js App Router route handlers, TypeScript, Zod request schemas, Prisma services, PostgreSQL, local staged-file storage, and in-app database notifications. Route handlers are thin; business rules and transaction boundaries live under `src/server/`.