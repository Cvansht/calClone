import type { AvailabilitySlot, EventType, User } from "@prisma/client";
import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { prisma } from "../config/database";
import type { DbClient } from "../types/db";
import { findPublicEventType } from "./eventType.service";

export type AvailableSlot = {
  startTime: string;
  endTime: string;
};

export type PublicEventWithUser = EventType & { user: User };

type SlotTemplate = Pick<AvailabilitySlot, "dayOfWeek" | "startTime" | "endTime">;

function dayOfWeekForDate(date: string, timezone: string) {
  const localNoonUtc = fromZonedTime(`${date}T12:00:00`, timezone);
  const isoDay = Number(formatInTimeZone(localNoonUtc, timezone, "i"));
  return isoDay % 7;
}

function overlaps(
  candidateStart: Date,
  candidateEnd: Date,
  existingStart: Date,
  existingEnd: Date
) {
  return candidateStart < existingEnd && candidateEnd > existingStart;
}

export function generateCandidateSlots(
  date: string,
  availabilitySlots: SlotTemplate[],
  duration: number,
  bufferTime: number,
  timezone: string
): AvailableSlot[] {
  const stepMinutes = duration + bufferTime;
  const candidates: AvailableSlot[] = [];

  for (const slot of availabilitySlots) {
    let cursor = fromZonedTime(`${date}T${slot.startTime}:00`, timezone);
    const rangeEnd = fromZonedTime(`${date}T${slot.endTime}:00`, timezone);

    while (addMinutes(cursor, duration).getTime() <= rangeEnd.getTime()) {
      const endTime = addMinutes(cursor, duration);
      candidates.push({
        startTime: cursor.toISOString(),
        endTime: endTime.toISOString()
      });
      cursor = addMinutes(cursor, stepMinutes);
    }
  }

  return candidates.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export async function getAvailableSlotsForEvent(
  eventType: PublicEventWithUser,
  date: string,
  bookerTimezone: string,
  client: DbClient = prisma,
  now = new Date()
) {
  const availability = await client.availability.findFirst({
    where: { userId: eventType.userId, isDefault: true },
    include: { slots: { orderBy: [{ startTime: "asc" }] } }
  });

  if (!availability) {
    return [];
  }

  const scheduleTimezone = availability.timezone || eventType.user.timezone;
  const bookerDayStart = fromZonedTime(`${date}T00:00:00`, bookerTimezone);
  const bookerDayEnd = addMinutes(bookerDayStart, 24 * 60);
  const ownerDates = new Set([
    formatInTimeZone(bookerDayStart, scheduleTimezone, "yyyy-MM-dd"),
    formatInTimeZone(addMinutes(bookerDayEnd, -1), scheduleTimezone, "yyyy-MM-dd")
  ]);

  const candidates = [...ownerDates].flatMap((ownerDate) => {
    const dayOfWeek = dayOfWeekForDate(ownerDate, scheduleTimezone);
    const slotsForDay = availability.slots.filter((slot) => slot.dayOfWeek === dayOfWeek);

    return generateCandidateSlots(
      ownerDate,
      slotsForDay,
      eventType.duration,
      eventType.bufferTime,
      scheduleTimezone
    );
  });

  if (candidates.length === 0) {
    return [];
  }

  const candidatesInBookerDay = candidates.filter((slot) => {
    const startTime = new Date(slot.startTime);
    return startTime >= bookerDayStart && startTime < bookerDayEnd;
  });

  if (candidatesInBookerDay.length === 0) {
    return [];
  }

  const rangeStart = new Date(Math.min(...candidatesInBookerDay.map((slot) => new Date(slot.startTime).getTime())));
  const rangeEnd = new Date(Math.max(...candidatesInBookerDay.map((slot) => new Date(slot.endTime).getTime())));

  const existingBookings = await client.booking.findMany({
    where: {
      eventTypeId: eventType.id,
      status: "ACCEPTED",
      startTime: { lt: rangeEnd },
      endTime: { gt: rangeStart }
    },
    select: { startTime: true, endTime: true }
  });

  const earliestStart = addMinutes(now, 10).getTime();

  return candidatesInBookerDay.filter((candidate) => {
    const candidateStart = new Date(candidate.startTime);
    const candidateEnd = new Date(candidate.endTime);

    if (candidateStart.getTime() < earliestStart) {
      return false;
    }

    return !existingBookings.some((booking) =>
      overlaps(candidateStart, candidateEnd, booking.startTime, booking.endTime)
    );
  });
}

export async function getPublicAvailableSlots(
  username: string,
  slug: string,
  date: string,
  bookerTimezone: string
) {
  const eventType = await findPublicEventType(username, slug);
  return getAvailableSlotsForEvent(eventType, date, bookerTimezone);
}
