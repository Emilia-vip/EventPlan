import type { FastifyInstance } from "fastify";
import * as events from "../services/events.js";
import { idSchema, createEventSchema, registrationSchema } from "../validation.js";

export async function eventsRoutes(app: FastifyInstance) {
  app.get("/events", async () => events.listEvents());

  app.get("/events/:id", async (request) => {
    const id = idSchema.parse((request.params as { id: string }).id);
    return events.getEvent(id);
  });

  app.post("/events", async (request, reply) => {
    const input = createEventSchema.parse(request.body);
    reply.code(201);
    return events.createEvent(input);
  });

  app.post("/events/:id/registrations", async (request, reply) => {
    const id = idSchema.parse((request.params as { id: string }).id);
    const input = registrationSchema.parse(request.body);
    reply.code(201);
    return events.register(id, input);
  });
}
