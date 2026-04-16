import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/errors";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(StatusCodes.CONFLICT).json({ error: "A record with those unique fields already exists." });
    }

    if (error.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "Record not found." });
    }
  }

  console.error(error);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: "Internal server error"
  });
}
