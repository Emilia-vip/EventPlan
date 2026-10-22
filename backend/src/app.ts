import Fastify from "fastify";
import { collectDefaultMetrics, Counter, Histogram, Registry } from "prom-client";
import { ZodError } from "zod";
import { pool } from "./db.js";
import { authRoutes } from "./routes/auth.js";
import { AppError } from "./errors.js";
import { eventsRoutes } from "./routes/events.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  const registry = new Registry();
  collectDefaultMetrics({ register: registry });
  const requestDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "Varaktighet för HTTP-anrop",
    labelNames: ["method", "route", "status"],
    registers: [registry],
  });
  const requestCount = new Counter({
    name: "http_requests_total",
    help: "Antal HTTP-anrop",
    labelNames: ["method", "route", "status"],
    registers: [registry],
  });

  app.addHook("onResponse", async (request, reply) => {
    // Använd rutt-mönstret (/events/:id) så att label-kardinaliteten inte exploderar
    const labels = {
      method: request.method,
      route: request.routeOptions.url ?? "unmatched",
      status: String(reply.statusCode),
    };
    requestDuration.observe(labels, reply.elapsedTime / 1000);
    requestCount.inc(labels);
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: "VALIDATION_ERROR",
        message: error.issues[0]?.message ?? "Ogiltig data",
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.status).send({
        error: error.code,
        message: error.message,
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      error: "INTERNAL",
      message: "Något gick fel",
    });
  });

  app.get("/", async () => ({
    ok: true,
    message: "EventPlan API",
    routes: {
      events: "GET /events",
      event: "GET /events/:id",
      createEvent: "POST /events",
      register: "POST /events/:id/registrations",
    },
  }));

  // Liveness: processen svarar. Används av Kubernetes för att starta om en död pod
  app.get("/health", async () => ({ ok: true }));

  // Readiness: databasen går att nå. Används av load balancern för att bara skicka trafik till redo pods
  app.get("/ready", async (_request, reply) => {
    try {
      await pool.query("SELECT 1");
      return { ok: true };
    } catch {
      return reply.status(503).send({ ok: false, error: "DB_UNAVAILABLE" });
    }
  });

  app.get("/metrics", async (_request, reply) => {
    reply.header("Content-Type", registry.contentType);
    return registry.metrics();
  });

  await app.register(authRoutes);
  await app.register(eventsRoutes);
  return app;
}
