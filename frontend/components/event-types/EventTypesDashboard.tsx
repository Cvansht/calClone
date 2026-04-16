"use client";

import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { useEventTypes } from "@/hooks/useEventTypes";
import { EventTypeCard } from "./EventTypeCard";

export function EventTypesDashboard() {
  const { data, loading, error, remove } = useEventTypes();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Event types</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Bookable meetings</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Create public scheduling links with durations, buffers, descriptions, and dashboard actions.
          </p>
        </div>
        <Link
          href="/dashboard/event-types/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <CalendarPlus className="h-4 w-4" />
          New event type
        </Link>
      </div>

      {loading && <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Loading event types...</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {!loading && data.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-zinc-950">No event types yet</p>
          <p className="mt-2 text-sm text-zinc-600">Add your first meeting link and share it with guests.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {data.map((eventType) => (
          <EventTypeCard key={eventType.id} eventType={eventType} onDelete={() => remove(eventType.id)} />
        ))}
      </div>
    </section>
  );
}
