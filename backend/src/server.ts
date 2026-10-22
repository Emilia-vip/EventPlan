import { buildApp } from "./app.js";
import { pool } from "./db.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "localhost";

const app = await buildApp();

try {
  await app.listen({ port, host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Vid rullande uppdatering skickar Kubernetes SIGTERM. Vi slutför pågående
// requests och stänger databaspoolen innan processen avslutas.
let shuttingDown = false;
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, "Stänger ned servern");
    try {
      await app.close();
      await pool.end();
      process.exit(0);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  });
}
