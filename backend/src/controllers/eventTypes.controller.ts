import type { Request, Response } from "express";
import {
  createEventType,
  deleteEventType,
  getEventTypeById,
  listEventTypes,
  updateEventType
} from "../services/eventType.service";
import type { CreateEventTypeInput, UpdateEventTypeInput } from "../schemas/eventType.schema";

export async function listEventTypesController(req: Request, res: Response) {
  const includeInactive = (req.validated as { query?: { includeInactive?: string } })?.query?.includeInactive === "true";
  const data = await listEventTypes(includeInactive);
  res.json({ data });
}

export async function createEventTypeController(req: Request, res: Response) {
  const { body } = req.validated as { body: CreateEventTypeInput };
  const data = await createEventType(body);
  res.status(201).json({ data });
}

export async function getEventTypeController(req: Request, res: Response) {
  const { params } = req.validated as { params: { id: string } };
  const data = await getEventTypeById(params.id);
  res.json({ data });
}

export async function updateEventTypeController(req: Request, res: Response) {
  const { params, body } = req.validated as { params: { id: string }; body: UpdateEventTypeInput };
  const data = await updateEventType(params.id, body);
  res.json({ data });
}

export async function deleteEventTypeController(req: Request, res: Response) {
  const { params } = req.validated as { params: { id: string } };
  const data = await deleteEventType(params.id);
  res.json({ data });
}
