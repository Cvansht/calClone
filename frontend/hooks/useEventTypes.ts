"use client";

import { useCallback, useEffect, useState } from "react";
import { eventTypesApi } from "@/lib/api";
import type { EventType } from "@/types";

export function useEventTypes() {
  const [data, setData] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await eventTypesApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load event types.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const remove = async (id: string) => {
    const previous = data;
    setData((items) => items.filter((item) => item.id !== id));
    try {
      await eventTypesApi.delete(id);
    } catch (err) {
      setData(previous);
      throw err;
    }
  };

  return { data, loading, error, refetch, remove };
}
