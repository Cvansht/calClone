"use client";

import { useCallback, useEffect, useState } from "react";
import { publicApi } from "@/lib/api";
import type { AvailableSlot } from "@/types";

export function useSlots(username: string, slug: string, date: string | null, timezone: string) {
  const [data, setData] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!date) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setData(await publicApi.slots(username, slug, date, timezone));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load slots.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [date, slug, timezone, username]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
