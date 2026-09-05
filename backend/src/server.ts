import { createApp } from "./app";
import { createBot, startBot } from "./bot/createBot";
import { loadConfig } from "./config/env";
import { prisma } from "./lib/prisma";

async function main() {
  const config = loadConfig();
  const bot = createBot(config);
  const app = createApp({ config, bot });
  let isShuttingDown = false;

  const server = app.listen(config.PORT, config.HOST, () => {
    console.log(`API started on ${config.HOST}:${config.PORT}`);
    console.log(`Bot mode: ${config.BOT_MODE}`);
  });

  await startBot(bot, config);

  const stop = async (signal: NodeJS.Signals) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`Received ${signal}; shutting down`);
    bot?.stop(signal);

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      await prisma.$disconnect();
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    }
  };

  process.once("SIGINT", (signal) => {
    void stop(signal);
  });
  process.once("SIGTERM", (signal) => {
    void stop(signal);
  });
}

main().catch((error) => {
  console.error(error);
  void prisma.$disconnect().finally(() => {
    process.exit(1);
  });
});
