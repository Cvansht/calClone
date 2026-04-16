import { Router } from "express";
import {
  createPublicBookingController,
  getPublicBookingConfirmationController,
  getPublicEventController,
  getPublicSlotsController
} from "../controllers/public.controller";
import {
  createPublicBookingSchema,
  publicBookingConfirmSchema,
  publicEventSchema,
  publicSlotsSchema
} from "../schemas/public.schema";
import { validate } from "../middleware/validate";

export const publicRouter = Router();

publicRouter.get("/booking/:id/confirm", validate(publicBookingConfirmSchema), getPublicBookingConfirmationController);
publicRouter.get("/:username/:slug", validate(publicEventSchema), getPublicEventController);
publicRouter.get("/:username/:slug/slots", validate(publicSlotsSchema), getPublicSlotsController);
publicRouter.post("/:username/:slug/book", validate(createPublicBookingSchema), createPublicBookingController);
