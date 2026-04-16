"use client";

import { useCallback, useEffect, useState } from "react";
import { bookingsApi } from "@/lib/api";
import type { Booking, PaginatedBookings } from "@/types";

export type BookingTab = "upcoming" | "past" | "cancelled";

const defaultMeta: PaginatedBookings["meta"] = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

export function useBookings(status: BookingTab, page = 1, limit = 10) {
  const [data, setData] = useState<Booking[]>([]);
  const [meta, setMeta] = useState<PaginatedBookings["meta"]>(defaultMeta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookingsApi.list(status, page, limit);
      setData(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load bookings.");
    } finally {
      setLoading(false);
    }
  }, [limit, page, status]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, meta, loading, error, refetch };
}
