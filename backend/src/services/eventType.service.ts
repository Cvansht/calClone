import { prisma } from "../config/database";
import { env } from "../config/env";
import type { DbClient } from "../types/db";
import { ConflictError, NotFoundError } from "../utils/errors";
import { slugify } from "../utils/slugify";
import type { CreateEventTypeInput, UpdateEventTypeInput } from "../schemas/eventType.schema";

export async function listEventTypes(includeInactive = false) {
  return prisma.eventType.findMany({
    where: {
      userId: env.defaultUserId,
      ...(includeInactive ? {} : { isActive: true })
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true } } }
  });
}

export async function getEventTypeById(id: string) {
  const eventType = await prisma.eventType.findFirst({
    where: { id, userId: env.defaultUserId },
    include: { _count: { select: { bookings: true } } }
  });

  if (!eventType) {
    throw new NotFoundError("Event type not found.");
  }

  return eventType;
}

async function assertSlugAvailable(slug: string, exceptId?: string) {
  const existing = await prisma.eventType.findFirst({
    where: {
      slug,
      ...(exceptId ? { id: { not: exceptId } } : {})
    }
  });

  if (existing) {
    throw new ConflictError("That booking URL is already in use.");
  }
}

export async function createEventType(input: CreateEventTypeInput) {
  const slug = input.slug || slugify(input.title);
  await assertSlugAvailable(slug);

  return prisma.eventType.create({
    data: {
      title: input.title,
      slug,
      description: input.description,
      duration: input.duration,
      color: input.color,
      bufferTime: input.bufferTime,
      isActive: input.isActive ?? true,
      userId: env.defaultUserId
    }
  });
}

export async function updateEventType(id: string, input: UpdateEventTypeInput) {
  await getEventTypeById(id);

  if (input.slug) {
    await assertSlugAvailable(input.slug, id);
  }

  return prisma.eventType.update({
    where: { id },
    data: input
  });
}

export async function deleteEventType(id: string) {
  await getEventTypeById(id);

  return prisma.eventType.update({
    where: { id },
    data: { isActive: false }
  });
}

export async function findPublicEventType(username: string, slug: string, client: DbClient = prisma) {
  const eventType = await client.eventType.findFirst({
    where: {
      slug,
      isActive: true,
      user: { username }
    },
    include: { user: true }
  });

  if (!eventType) {
    throw new NotFoundError("Event type not found.");
  }

  return eventType;
}

export async function getPublicEventDetails(username: string, slug: string) {
  const eventType = await findPublicEventType(username, slug);
  const availability = await prisma.availability.findFirst({
    where: { userId: eventType.userId, isDefault: true },
    include: { slots: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] } }
  });

  const availableDays = availability ? [...new Set(availability.slots.map((slot) => slot.dayOfWeek))] : [];

  return {
    id: eventType.id,
    title: eventType.title,
    slug: eventType.slug,
    description: eventType.description,
    duration: eventType.duration,
    color: eventType.color,
    bufferTime: eventType.bufferTime,
    host: {
      name: eventType.user.name,
      username: eventType.user.username,
      email: eventType.user.email,
      bio: eventType.user.bio,
      timezone: eventType.user.timezone
    },
    availability: {
      timezone: availability?.timezone ?? eventType.user.timezone,
      availableDays
    }
  };
}
