import type { Request, Response } from "express";
import type { CreatePublicBookingInput } from "../schemas/public.schema";
import {
  createPublicBooking,
  getPublicBookingConfirmation
} from "../services/booking.service";
import { getPublicEventDetails } from "../services/eventType.service";
import { getPublicAvailableSlots } from "../services/slots.service";

export async function getPublicEventController(req: Request, res: Response) {
  const { params } = req.validated as { params: { username: string; slug: string } };
  const data = await getPublicEventDetails(params.username, params.slug);
  res.json({ data });
}

export async function getPublicSlotsController(req: Request, res: Response) {
  const { params, query } = req.validated as {
    params: { username: string; slug: string };
    query: { date: string; timezone: string };
  };
  const data = await getPublicAvailableSlots(params.username, params.slug, query.date, query.timezone);
  res.json({ data });
}

export async function createPublicBookingController(req: Request, res: Response) {
  const { params, body } = req.validated as {
    params: { username: string; slug: string };
    body: CreatePublicBookingInput;
  };
  const data = await createPublicBooking(params.username, params.slug, body);
  res.status(201).json({ data });
}

export async function getPublicBookingConfirmationController(req: Request, res: Response) {
  const { params } = req.validated as { params: { id: string } };
  const data = await getPublicBookingConfirmation(params.id);
  res.json({ data });
}
