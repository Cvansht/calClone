import { z } from "zod";

export const listBookingsSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({
    status: z.enum(["upcoming", "past", "cancelled", "all"]).optional().default("upcoming"),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10)
  }),
  body: z.object({}).optional()
});

export const bookingIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional(),
  body: z.object({}).optional()
});

export const cancelBookingSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional(),
  body: z
    .object({
      reason: z.string().trim().max(300).optional()
    })
    .optional()
});
