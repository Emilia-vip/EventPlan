import Fastify from "fastify";
import { ZodError } from "zod";
import { AppError } from "./errors.js";
import { eventsRoutes } from "./routes/events.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

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

  await app.register(eventsRoutes);
  return app;
}
