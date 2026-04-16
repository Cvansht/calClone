import type { Request, Response } from "express";
import { cancelBooking, getBookingById, listBookings } from "../services/booking.service";

export async function listBookingsController(req: Request, res: Response) {
  const { query } = req.validated as {
    query: { status: "upcoming" | "past" | "cancelled" | "all"; page: number; limit: number };
  };
  const result = await listBookings(query.status, query.page, query.limit);
  res.json(result);
}

export async function getBookingController(req: Request, res: Response) {
  const { params } = req.validated as { params: { id: string } };
  const data = await getBookingById(params.id);
  res.json({ data });
}

export async function cancelBookingController(req: Request, res: Response) {
  const { params, body } = req.validated as { params: { id: string }; body?: { reason?: string } };
  const data = await cancelBooking(params.id, body?.reason);
  res.json({ data });
}
