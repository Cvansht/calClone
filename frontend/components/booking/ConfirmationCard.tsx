"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Video } from "lucide-react";
import { publicApi } from "@/lib/api";
import { formatDateTime } from "@/lib/dateUtils";
import type { Booking } from "@/types";

const avatarUrl =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80";

function googleDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function googleCalendarUrl(booking: Booking) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: booking.eventType.title,
    dates: `${googleDate(booking.startTime)}/${googleDate(booking.endTime)}`,
    details: booking.meetingUrl ?? "",
    location: booking.meetingUrl ?? ""
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function ConfirmationCard() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError("Missing booking id.");
      return;
    }

    publicApi
      .confirmation(bookingId)
      .then(setBooking)
      .catch(() => setError("Could not load booking confirmation."));
  }, [bookingId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-8">
      <section className="w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-soft">
        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {!error && !booking && <p className="text-sm text-zinc-600">Loading confirmation...</p>}
        {booking && (
          <>
            <img src={avatarUrl} alt={booking.user?.name ?? "Host"} className="mx-auto h-16 w-16 rounded-lg object-cover" />
            <CheckCircle2 className="mx-auto mt-5 h-10 w-10 text-emerald-600" />
            <h1 className="mt-4 text-2xl font-semibold text-zinc-950">Booking confirmed</h1>
            <p className="mt-2 text-sm text-zinc-600">
              {booking.guestName}, your {booking.eventType.title} is scheduled with {booking.user?.name ?? "the host"}.
            </p>

            <div className="mt-6 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-left text-sm text-zinc-700">
              <p className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-zinc-500" />
                {formatDateTime(booking.startTime, booking.user?.timezone ?? "Asia/Kolkata")}
              </p>
              <p className="flex items-center gap-2">
                <Video className="h-4 w-4 text-zinc-500" />
                {booking.meetingUrl ?? "Meeting link pending"}
              </p>
            </div>

            <Link
              href={`/${booking.user?.username ?? "admin"}/${booking.eventType.slug}`}
              className="mt-6 inline-flex rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Book another time
            </Link>
            <a
              href={googleCalendarUrl(booking)}
              target="_blank"
              rel="noreferrer"
              className="ml-2 mt-6 inline-flex rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-blue-500 hover:text-blue-700"
            >
              Add to calendar
            </a>
          </>
        )}
      </section>
    </main>
  );
}
