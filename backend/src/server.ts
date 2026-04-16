import { createApp } from "./app";
import { prisma } from "./config/database";
import { env } from "./config/env";
import { ensureDefaultAvailability } from "./services/defaultData.service";

async function start() {
  await ensureDefaultAvailability();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`API ready on http://localhost:${env.port}/api`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
