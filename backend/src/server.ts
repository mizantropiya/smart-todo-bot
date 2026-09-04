import { createApp } from "./app";
import { createBot, startBot } from "./bot/createBot";
import { loadConfig } from "./config/env";

async function main() {
  const config = loadConfig();
  const bot = createBot(config);
  const app = createApp({ config, bot });

  const server = app.listen(config.PORT, config.HOST, () => {
    console.log(`API started on ${config.HOST}:${config.PORT}`);
    console.log(`Bot mode: ${config.BOT_MODE}`);
  });

  await startBot(bot, config);

  const stop = (signal: NodeJS.Signals) => {
    console.log(`Received ${signal}; shutting down`);
    bot?.stop(signal);
    server.close(() => process.exit(0));
  };

  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
