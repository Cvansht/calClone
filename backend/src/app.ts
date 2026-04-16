import "express-async-errors";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.nodeEnv === "development" ? true : env.frontendUrl,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(express.json());

  if (env.nodeEnv !== "test") {
    app.use(morgan("dev"));
  }

  app.use("/api", apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
