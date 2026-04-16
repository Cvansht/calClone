import { z } from "zod";
import { minutesFromTime } from "../utils/dateUtils";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM 24-hour time.");

const availabilitySlotSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: timeSchema,
    endTime: timeSchema
  })
  .refine((slot) => minutesFromTime(slot.startTime) < minutesFromTime(slot.endTime), {
    message: "startTime must be before endTime.",
    path: ["endTime"]
  });

export const getAvailabilitySchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({}).optional()
});

export const replaceAvailabilitySchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({
    timezone: z.string().min(2),
    slots: z.array(availabilitySlotSchema).max(42)
  })
});

export type ReplaceAvailabilityInput = z.infer<typeof replaceAvailabilitySchema>["body"];
