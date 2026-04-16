import { z } from "zod";

const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only.");

const eventTypeBody = z.object({
  title: z.string().trim().min(2).max(120),
  slug: slugSchema,
  description: z.string().trim().max(500).optional().nullable(),
  duration: z.coerce.number().int().min(5).max(480),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  bufferTime: z.coerce.number().int().min(0).max(120).optional(),
  isActive: z.boolean().optional()
});

export const listEventTypesSchema = z.object({
  query: z.object({
    includeInactive: z.enum(["true", "false"]).optional()
  }),
  params: z.object({}),
  body: z.object({}).optional()
});

export const createEventTypeSchema = z.object({
  body: eventTypeBody,
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const eventTypeIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional(),
  body: z.object({}).optional()
});

export const updateEventTypeSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}).optional(),
  body: eventTypeBody.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required."
  })
});

export type CreateEventTypeInput = z.infer<typeof createEventTypeSchema>["body"];
export type UpdateEventTypeInput = z.infer<typeof updateEventTypeSchema>["body"];
