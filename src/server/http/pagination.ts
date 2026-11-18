import { z } from "zod";

export const PaginationQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export function cursorPage<T extends { id: string }>(items: T[], limit: number) {
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  return {
    items: pageItems,
    nextCursor: hasMore ? pageItems.at(-1)?.id ?? null : null,
  };
}