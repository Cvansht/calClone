import { env } from "../config/env";
import { prisma } from "../config/database";
import type { DbClient } from "../types/db";

const defaultAvailabilitySlots = [1, 2, 3, 4, 5].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: "09:00",
  endTime: "17:00"
}));

export async function ensureDefaultUser(client: DbClient = prisma) {
  return client.user.upsert({
    where: { id: env.defaultUserId },
    update: {},
    create: {
      id: env.defaultUserId,
      name: "Default User",
      username: "admin",
      email: "admin@calclone.dev",
      bio: "Scheduling focused conversations from India.",
      timezone: "Asia/Kolkata"
    }
  });
}

export async function ensureDefaultAvailability(client: DbClient = prisma) {
  const user = await ensureDefaultUser(client);
  const existing = await client.availability.findFirst({
    where: { userId: user.id, isDefault: true },
    include: { slots: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] } }
  });

  if (existing) {
    return existing;
  }

  return client.availability.create({
    data: {
      name: "Working Hours",
      timezone: user.timezone,
      isDefault: true,
      userId: user.id,
      slots: { create: defaultAvailabilitySlots }
    },
    include: { slots: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] } }
  });
}
