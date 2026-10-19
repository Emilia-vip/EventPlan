import Fastify from "fastify";
import { ZodError } from "zod";
import { pool } from "./db.js";
import { AppError } from "./errors.js";
import { eventsRoutes } from "./routes/events.js";

const app = Fastify();

// Health-check
app.get("/health", async (request, reply) => {
  try {
    await pool.query("SELECT 1");
    return { status: "ok", database: "ok" };
  } catch {
    reply.code(503);
    return { status: "error", database: "unreachable" };
  }
});

// 404 för okända routes
app.setNotFoundHandler((_request, reply) => {
  reply.code(404).send({ error: "NOT_FOUND", message: "Route hittades inte" });
});

// Felhantering
app.setErrorHandler((error, request, reply) => {
  if (error instanceof ZodError) {
    reply.code(400).send({ error: "VALIDATION_ERROR", message: error.issues[0]?.message });
    return;
  }
  if (error instanceof AppError) {
    reply.code(error.status).send({ error: error.code, message: error.message });
    return;
  }
  if ((error as { code?: string }).code === "FST_ERR_CTP_INVALID_JSON_BODY") {
    reply.code(400).send({ error: "INVALID_JSON", message: "Ogiltig JSON" });
    return;
  }
  request.log.error(error);
  reply.code(500).send({ error: "INTERNAL_ERROR", message: "Något gick fel" });
});

// Events-routes (registreras efter felhanteraren så att den ärvs)
await app.register(eventsRoutes);

try {
  await app.listen({ port: 3000 });
  console.log("Lyssnar på http://localhost:3000");
} catch (err) {
  app.log.error(err);
  process.exit(1);
}