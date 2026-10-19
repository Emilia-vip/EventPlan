import Fastify from "fastify";
import { pool } from "./db.js";

const app = Fastify();

app.get("/health", async (request, reply) => {
  try {
    await pool.query("SELECT 1");
    return { status: "ok", database: "ok" };
  } catch {
    reply.code(503);
    return { status: "error", database: "unreachable" };
  }
});

try {
  await app.listen({ port: 3000 });
  console.log("Lyssnar på http://localhost:3000/health");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}