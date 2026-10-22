import { createEvent, getEvent, listEvents, register } from "../services/events.js";
import { createEventSchema, idSchema, registrationSchema } from "../validation.js";
import type { FastifyInstance } from "fastify";

export async function eventsRoutes(app: FastifyInstance) {
  app.get("/events", async () => {
    return await listEvents();
  });

  app.post("/events", async (request, reply) => {
    const input = createEventSchema.parse(request.body);
    const event = await createEvent(input);
    reply.code(201);
    return event;
  });

  app.get("/events/:id", async (request) => {
    const {id} = request.params as {id: string}
    return await getEvent(idSchema.parse(id));
  });

  app.post("/events/:id/registrations", async (request, reply) => {
    const { id } = request.params as { id: string };
    const eventId = idSchema.parse(id);
    const input = registrationSchema.parse(request.body);
    const registration = await register(eventId, input);
    reply.code(201);
    return registration;
  });
}