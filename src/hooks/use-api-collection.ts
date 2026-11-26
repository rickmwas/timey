"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api-client";

type ApiCollectionPage<T> = {
  items: T[];
  nextCursor?: string | null;
};

export function useApiCollection<T>(endpoint: string) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allItems: T[] = [];
      let cursor: string | null | undefined;

      do {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set("limit", "100");
        if (cursor) url.searchParams.set("cursor", cursor);
        const page = await apiRequest<ApiCollectionPage<T>>(`${url.pathname}${url.search}`);
        allItems.push(...page.items);
        cursor = page.nextCursor;
      } while (cursor);

      setItems(allItems);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not load this information",
      );
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, setItems, isLoading, error, refresh };
}
