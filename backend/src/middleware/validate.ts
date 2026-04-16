import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!result.success) {
      return res.status(422).json({
        error: "Validation failed",
        details: result.error.flatten()
      });
    }

    req.validated = result.data;
    next();
  };
}
