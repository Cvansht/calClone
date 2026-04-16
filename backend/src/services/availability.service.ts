import { prisma } from "../config/database";
import { env } from "../config/env";
import type { ReplaceAvailabilityInput } from "../schemas/availability.schema";
import { ensureDefaultAvailability, ensureDefaultUser } from "./defaultData.service";

export async function getAvailability() {
  return ensureDefaultAvailability();
}

export async function replaceAvailability(input: ReplaceAvailabilityInput) {
  await ensureDefaultUser();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.availability.findFirst({
      where: { userId: env.defaultUserId, isDefault: true }
    });

    if (!existing) {
      return tx.availability.create({
        data: {
          name: "Working Hours",
          timezone: input.timezone,
          isDefault: true,
          userId: env.defaultUserId,
          slots: { create: input.slots }
        },
        include: { slots: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] } }
      });
    }

    await tx.availabilitySlot.deleteMany({
      where: { availabilityId: existing.id }
    });

    return tx.availability.update({
      where: { id: existing.id },
      data: {
        timezone: input.timezone,
        slots: { create: input.slots }
      },
      include: { slots: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] } }
    });
  });
}
