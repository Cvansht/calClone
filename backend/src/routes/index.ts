import { Router } from "express";
import { availabilityRouter } from "./availability";
import { bookingsRouter } from "./bookings";
import { eventTypesRouter } from "./eventTypes";
import { publicRouter } from "./public";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "calclone-api" });
});

apiRouter.use("/event-types", eventTypesRouter);
apiRouter.use("/availability", availabilityRouter);
apiRouter.use("/bookings", bookingsRouter);
apiRouter.use("/public", publicRouter);
