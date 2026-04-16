"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock3, Globe2, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { DayPicker } from "react-day-picker";
import { z } from "zod";
import { publicApi } from "@/lib/api";
import { formatDateKey, formatTime, getTimezone } from "@/lib/dateUtils";
import { cn } from "@/lib/cn";
import { useSlots } from "@/hooks/useSlots";
import type { AvailableSlot, PublicEvent } from "@/types";

const avatarUrl =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80";

const bookingFormSchema = z.object({
  guestName: z.string().trim().min(2, "Enter your name.").max(120),
  guestEmail: z.string().trim().email("Enter a valid email."),
  notes: z.string().trim().max(1000, "Keep notes under 1000 characters.").optional()
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

function messageFrom(error: unknown) {
  if (typeof error === "object" && error && "error" in error) {
    return String((error as { error: string }).error);
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function PublicBookingFlow({ username, slug }: { username: string; slug: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [eventError, setEventError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dateKey = selectedDate ? formatDateKey(selectedDate) : null;
  const { data: slots, loading: slotsLoading, error: slotsError, refetch } = useSlots(username, slug, dateKey, timezone);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: "onChange",
    defaultValues: { guestName: "", guestEmail: "", notes: "" }
  });

  useEffect(() => {
    setTimezone(getTimezone());
  }, []);

  useEffect(() => {
    let active = true;
    publicApi
      .event(username, slug)
      .then((data) => {
        if (active) setEvent(data);
      })
      .catch((err) => setEventError(messageFrom(err)));

    return () => {
      active = false;
    };
  }, [slug, username]);

  const today = useMemo(() => {
    const value = new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, []);

  const isDisabled = (date: Date) => {
    const candidate = new Date(date);
    candidate.setHours(0, 0, 0, 0);

    if (candidate < today) {
      return true;
    }

    if (!event) {
      return false;
    }

    return !event.availability.availableDays.includes(date.getDay());
  };

  const submit = async (values: BookingFormValues) => {
    if (!selectedSlot || !dateKey) {
      setBookingError("Pick a date and time first.");
      return;
    }

    setSubmitting(true);
    setBookingError(null);

    try {
      const result = await publicApi.book(username, slug, {
        date: dateKey,
        startTime: selectedSlot.startTime,
        guestName: values.guestName,
        guestEmail: values.guestEmail,
        notes: values.notes
      });
      router.push(`/${username}/${slug}/success?bookingId=${result.id}`);
    } catch (err) {
      setBookingError(messageFrom(err));
      await refetch();
    } finally {
      setSubmitting(false);
    }
  };

  if (eventError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{eventError}</p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Loading booking page...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-soft lg:grid-cols-[320px_minmax(0,1fr)_320px]">
        <aside className="border-b border-zinc-200 p-6 lg:border-b-0 lg:border-r">
          <img src={avatarUrl} alt={event.host.name} className="h-16 w-16 rounded-lg object-cover" />
          <div className="mt-5">
            <p className="text-sm font-medium text-zinc-500">{event.host.name}</p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-950">{event.title}</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{event.description || "Book a time that works for you."}</p>
          </div>
          <div className="mt-6 space-y-3 text-sm text-zinc-700">
            <p className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-zinc-500" />
              {event.duration} minutes
            </p>
            <p className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-zinc-500" />
              {timezone}
            </p>
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-zinc-500" />
              {event.host.username}
            </p>
          </div>
        </aside>

        <section className="border-b border-zinc-200 p-6 lg:border-b-0 lg:border-r">
          <div className="mb-5 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-700" />
            <h2 className="text-base font-semibold">Select a date</h2>
          </div>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedSlot(null);
              setBookingError(null);
            }}
            disabled={isDisabled}
            showOutsideDays
            fixedWeeks
          />
        </section>

        <section className="p-6">
          <h2 className="text-base font-semibold">Select a time</h2>
          <p className="mt-1 text-sm text-zinc-600">{selectedDate ? formatDateKey(selectedDate) : "Pick a date first."}</p>

          <div className="mt-5 min-h-48">
            {slotsLoading && <p className="text-sm text-zinc-600">Loading slots...</p>}
            {slotsError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{slotsError}</p>}
            {!slotsLoading && selectedDate && slots.length === 0 && (
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">No slots available for this date.</p>
            )}

            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => (
                  <motion.button
                    key={slot.startTime}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition",
                      selectedSlot?.startTime === slot.startTime
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-zinc-200 text-zinc-700 hover:border-blue-500 hover:text-blue-700"
                    )}
                  >
                    {formatTime(slot.startTime, timezone)}
                  </motion.button>
                ))}
              </div>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {selectedSlot && (
              <motion.form
                onSubmit={handleSubmit(submit)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="mt-6 space-y-3 border-t border-zinc-200 pt-5"
              >
                <p className="text-sm font-medium text-zinc-900">Your details</p>
                {bookingError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{bookingError}</p>}
                <input
                  {...register("guestName")}
                  className="w-full rounded-lg border-zinc-300 text-sm"
                  placeholder="Name"
                />
                {errors.guestName && <p className="text-xs text-red-600">{errors.guestName.message}</p>}
                <input
                  type="email"
                  {...register("guestEmail")}
                  className="w-full rounded-lg border-zinc-300 text-sm"
                  placeholder="Email"
                />
                {errors.guestEmail && <p className="text-xs text-red-600">{errors.guestEmail.message}</p>}
                <textarea
                  {...register("notes")}
                  className="min-h-24 w-full rounded-lg border-zinc-300 text-sm"
                  placeholder="Notes"
                />
                {errors.notes && <p className="text-xs text-red-600">{errors.notes.message}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {submitting ? "Booking..." : "Confirm booking"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </section>
      </div>
    </main>
  );
}
