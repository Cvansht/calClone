import { Router } from "express";
import {
  createEventTypeController,
  deleteEventTypeController,
  getEventTypeController,
  listEventTypesController,
  updateEventTypeController
} from "../controllers/eventTypes.controller";
import {
  createEventTypeSchema,
  eventTypeIdSchema,
  listEventTypesSchema,
  updateEventTypeSchema
} from "../schemas/eventType.schema";
import { validate } from "../middleware/validate";

export const eventTypesRouter = Router();

eventTypesRouter.get("/", validate(listEventTypesSchema), listEventTypesController);
eventTypesRouter.post("/", validate(createEventTypeSchema), createEventTypeController);
eventTypesRouter.get("/:id", validate(eventTypeIdSchema), getEventTypeController);
eventTypesRouter.patch("/:id", validate(updateEventTypeSchema), updateEventTypeController);
eventTypesRouter.delete("/:id", validate(eventTypeIdSchema), deleteEventTypeController);
