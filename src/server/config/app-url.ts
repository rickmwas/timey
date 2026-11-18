import { z } from "zod";

export const AppUrlSchema = z
  .string()
  .url()
  .default("http://localhost:3000");

export function getAppUrl(
  source: Record<string, string | undefined> = process.env,
): string {
  return AppUrlSchema.parse(source.APP_URL);
}
