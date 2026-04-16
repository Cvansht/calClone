import type { Request, Response } from "express";
import type { ReplaceAvailabilityInput } from "../schemas/availability.schema";
import { getAvailability, replaceAvailability } from "../services/availability.service";

export async function getAvailabilityController(_req: Request, res: Response) {
  const data = await getAvailability();
  res.json({ data });
}

export async function replaceAvailabilityController(req: Request, res: Response) {
  const { body } = req.validated as { body: ReplaceAvailabilityInput };
  const data = await replaceAvailability(body);
  res.json({ data });
}
