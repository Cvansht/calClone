"use client";

import { useCallback, useEffect, useState } from "react";
import { availabilityApi } from "@/lib/api";
import type { Availability, AvailabilitySlot } from "@/types";

export function useAvailability() {
  const [data, setData] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await availabilityApi.get());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load availability.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const save = async (timezone: string, slots: AvailabilitySlot[]) => {
    const updated = await availabilityApi.replace({ timezone, slots });
    setData(updated);
    return updated;
  };

  return { data, loading, error, refetch, save };
}
