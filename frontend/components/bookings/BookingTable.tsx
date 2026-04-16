"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarX, X } from "lucide-react";
import { bookingsApi } from "@/lib/api";
import { formatDateTime } from "@/lib/dateUtils";
import { cn } from "@/lib/cn";
import { type BookingTab, useBookings } from "@/hooks/useBookings";
import type { Booking } from "@/types";

const tabs: Array<{ value: BookingTab; label: string }> = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" }
];

export function BookingTable() {
  const [tab, setTab] = useState<BookingTab>("upcoming");
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, refetch } = useBookings(tab, page, 10);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const changeTab = (value: BookingTab) => {
    setTab(value);
    setPage(1);
  };

  const cancel = async () => {
    if (!cancelTarget) {
      return;
    }

    setBusyId(cancelTarget.id);
    try {
      await bookingsApi.cancel(cancelTarget.id, cancelReason || undefined);
      setCancelTarget(null);
      setCancelReason("");
      await refetch();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-700">Bookings</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Guest reservations</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Review scheduled calls, past meetings, and cancelled reservations.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => changeTab(item.value)}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-medium",
              tab === item.value
                ? "border-zinc-950 bg-zinc-950 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Loading bookings...</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {!loading && data.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center">
          <CalendarX className="mx-auto h-8 w-8 text-zinc-400" />
          <p className="mt-3 text-sm font-medium text-zinc-950">No {tab} bookings</p>
          <p className="mt-1 text-sm text-zinc-600">Reservations will appear here as guests book time.</p>
        </div>
      )}

      {data.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Guest</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {data.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium text-zinc-950">{booking.guestName}</p>
                      <p className="text-zinc-500">{booking.guestEmail}</p>
                    </td>
                    <td className="px-4 py-4 text-zinc-700">{booking.eventType.title}</td>
                    <td className="px-4 py-4 text-zinc-700">{formatDateTime(booking.startTime, "Asia/Kolkata")}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700">
                        {booking.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {booking.status === "ACCEPTED" && tab === "upcoming" ? (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(booking)}
                          disabled={busyId === booking.id}
                          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 text-sm">
              <p className="text-zinc-600">
                Page {meta.page} of {meta.totalPages} · {meta.total} bookings
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={meta.page <= 1}
                  className="rounded-lg border border-zinc-200 px-3 py-2 font-medium text-zinc-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                  disabled={meta.page >= meta.totalPages}
                  className="rounded-lg border border-zinc-200 px-3 py-2 font-medium text-zinc-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog.Root
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-zinc-950/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-base font-semibold text-zinc-950">Cancel booking</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-zinc-600">
                  {cancelTarget ? `Cancel ${cancelTarget.guestName}'s ${cancelTarget.eventType.title}?` : "Cancel this booking?"}
                </Dialog.Description>
              </div>
              <Dialog.Close className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:text-zinc-950">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-medium text-zinc-800">Reason</span>
              <textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                className="mt-2 min-h-24 w-full rounded-lg border-zinc-300 text-sm"
                placeholder="Optional"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700">
                Keep booking
              </Dialog.Close>
              <button
                type="button"
                onClick={cancel}
                disabled={Boolean(cancelTarget && busyId === cancelTarget.id)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {cancelTarget && busyId === cancelTarget.id ? "Cancelling..." : "Cancel booking"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
