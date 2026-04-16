import dotenv from "dotenv";

dotenv.config();

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  defaultUserId: process.env.DEFAULT_USER_ID ?? "default-user"
};
