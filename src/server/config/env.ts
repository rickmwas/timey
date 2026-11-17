import { z } from "zod";

const EnvironmentSchema = z.object({
  DATABASE_URL: z.string().url().or(z.string().min(1)),
  AUTH_SECRET: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  STORAGE_LOCAL_DIR: z.string().min(1).default("../timy-local-storage"),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(10).optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

export function parseEnvironment(source: NodeJS.ProcessEnv): Environment {
  // If running in a build/CI environment without database secrets yet, provide dummy values so Next.js static collection succeeds
  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build" ||
    process.env.CI === "true" ||
    Boolean(process.env.VERCEL && !source.DATABASE_URL);

  const fallbackDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/timy";
  const fallbackAuthSecret = "temporary-build-auth-secret-min-32-chars-long";

  const resolvedSource = {
    ...source,
    DATABASE_URL: source.DATABASE_URL || (isBuildPhase ? fallbackDatabaseUrl : undefined),
    AUTH_SECRET: source.AUTH_SECRET || (isBuildPhase ? fallbackAuthSecret : undefined),
  };

  const environment = EnvironmentSchema.parse(resolvedSource);
  if (environment.NODE_ENV === "production" && environment.AUTH_SECRET.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters in production");
  }
  return environment;
}

export const env = parseEnvironment(process.env);