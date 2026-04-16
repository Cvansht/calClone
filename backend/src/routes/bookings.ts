import { Router } from "express";
import {
  cancelBookingController,
  getBookingController,
  listBookingsController
} from "../controllers/bookings.controller";
import {
  bookingIdSchema,
  cancelBookingSchema,
  listBookingsSchema
} from "../schemas/booking.schema";
import { validate } from "../middleware/validate";

export const bookingsRouter = Router();

bookingsRouter.get("/", validate(listBookingsSchema), listBookingsController);
bookingsRouter.get("/:id", validate(bookingIdSchema), getBookingController);
bookingsRouter.delete("/:id", validate(cancelBookingSchema), cancelBookingController);
