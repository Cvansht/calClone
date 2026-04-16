import type { z } from "zod";

declare global {
  namespace Express {
    interface Request {
      validated?: z.infer<z.ZodTypeAny>;
    }
  }
}
