import { BookingStatus, Prisma } from "@prisma/client";
import { addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "../config/database";
import { env } from "../config/env";
import type { CreatePublicBookingInput } from "../schemas/public.schema";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";
import { isValidDate } from "../utils/dateUtils";
import { findPublicEventType } from "./eventType.service";
import { getAvailableSlotsForEvent } from "./slots.service";

type BookingListStatus = "upcoming" | "past" | "cancelled" | "all";

export async function listBookings(status: BookingListStatus, page: number, limit: number) {
  const now = new Date();
  const where: Prisma.BookingWhereInput = { userId: env.defaultUserId };

  if (status === "upcoming") {
    where.status = BookingStatus.ACCEPTED;
    where.startTime = { gte: now };
  }

  if (status === "past") {
    where.status = BookingStatus.ACCEPTED;
    where.endTime = { lt: now };
  }

  if (status === "cancelled") {
    where.status = BookingStatus.CANCELLED;
  }

  const [data, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: { eventType: true },
      orderBy: { startTime: status === "past" ? "desc" : "asc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.booking.count({ where })
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
}

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findFirst({
    where: { id, userId: env.defaultUserId },
    include: { eventType: true, user: true }
  });

  if (!booking) {
    throw new NotFoundError("Booking not found.");
  }

  return booking;
}

export async function cancelBooking(id: string, reason?: string) {
  await getBookingById(id);

  return prisma.booking.update({
    where: { id },
    data: {
      status: BookingStatus.CANCELLED,
      cancelReason: reason
    },
    include: { eventType: true }
  });
}

export async function createPublicBooking(username: string, slug: string, input: CreatePublicBookingInput) {
  const requestedStart = new Date(input.startTime);

  if (!isValidDate(requestedStart)) {
    throw new BadRequestError("Invalid booking start time.");
  }

  return prisma.$transaction(async (tx) => {
    const eventType = await findPublicEventType(username, slug, tx);
    const ownerDate = formatInTimeZone(requestedStart, eventType.user.timezone, "yyyy-MM-dd");
    const availableSlots = await getAvailableSlotsForEvent(
      eventType,
      ownerDate,
      eventType.user.timezone,
      tx
    );

    const requestedStartMs = requestedStart.getTime();
    const selectedSlot = availableSlots.find((slot) => new Date(slot.startTime).getTime() === requestedStartMs);

    if (!selectedSlot) {
      throw new ConflictError("That slot is no longer available.");
    }

    const requestedEnd = addMinutes(requestedStart, eventType.duration);
    const conflict = await tx.booking.findFirst({
      where: {
        eventTypeId: eventType.id,
        status: BookingStatus.ACCEPTED,
        startTime: { lt: requestedEnd },
        endTime: { gt: requestedStart }
      }
    });

    if (conflict) {
      throw new ConflictError("That slot is already booked.");
    }

    const created = await tx.booking.create({
      data: {
        title: `${input.guestName} + ${eventType.title}`,
        startTime: requestedStart,
        endTime: requestedEnd,
        status: BookingStatus.ACCEPTED,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestNotes: input.notes,
        eventTypeId: eventType.id,
        userId: eventType.userId
      }
    });

    return tx.booking.update({
      where: { id: created.id },
      data: { meetingUrl: `https://meet.calclone.local/${created.id}` },
      include: { eventType: true, user: true }
    });
  });
}

export async function getPublicBookingConfirmation(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { eventType: true, user: true }
  });

  if (!booking) {
    throw new NotFoundError("Booking not found.");
  }

  return booking;
}
