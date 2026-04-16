import { z } from "zod";

const usernameSlugParams = z.object({
  username: z.string().min(1).max(80),
  slug: z.string().min(1).max(80)
});

export const publicEventSchema = z.object({
  params: usernameSlugParams,
  query: z.object({}).optional(),
  body: z.object({}).optional()
});

export const publicSlotsSchema = z.object({
  params: usernameSlugParams,
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    timezone: z.string().min(2)
  }),
  body: z.object({}).optional()
});

export const createPublicBookingSchema = z.object({
  params: usernameSlugParams,
  query: z.object({}).optional(),
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    startTime: z.string().datetime(),
    guestName: z.string().trim().min(2).max(120),
    guestEmail: z.string().trim().email(),
    notes: z.string().trim().max(1000).optional()
  })
});

export const publicBookingConfirmSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional(),
  body: z.object({}).optional()
});

export type CreatePublicBookingInput = z.infer<typeof createPublicBookingSchema>["body"];
