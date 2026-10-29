import { buildApp } from "./app.js";
import { pool } from "./db.js";

const app = await buildApp();

// k3s skickar SIGTERM vid deploy. Vi låter pågående requests bli klara
// innan vi stänger databasen och avslutar.
let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  app.log.info(`${signal} mottagen, stänger ner`);
  try {
    await app.close();
    await pool.end();
    process.exit(0);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

try {
  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ port, host: process.env.HOST ?? "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}