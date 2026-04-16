import { Router } from "express";
import {
  getAvailabilityController,
  replaceAvailabilityController
} from "../controllers/availability.controller";
import {
  getAvailabilitySchema,
  replaceAvailabilitySchema
} from "../schemas/availability.schema";
import { validate } from "../middleware/validate";

export const availabilityRouter = Router();

availabilityRouter.get("/", validate(getAvailabilitySchema), getAvailabilityController);
availabilityRouter.put("/", validate(replaceAvailabilitySchema), replaceAvailabilityController);
