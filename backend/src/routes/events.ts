import { requireAdmin, requireUser } from "../auth/middleware.js";
import { createEvent, getEvent, listEvents, listTicketsForUser, register } from "../services/events.js";
import { createEventSchema, idSchema } from "../validation.js";
import type { FastifyInstance } from "fastify";

export async function eventsRoutes(app: FastifyInstance) {
  app.get("/events", async () => {
    return await listEvents();
  });

  app.post("/events", { preHandler: requireAdmin }, async (request, reply) => {
    const input = createEventSchema.parse(request.body);
    const event = await createEvent(input);
    reply.code(201);
    return event;
  });

  app.get("/events/:id", async (request) => {
    const {id} = request.params as {id: string}
    return await getEvent(idSchema.parse(id));
  });

  // Biljetten bokas på det inloggade kontot. Namn och e-post tas från kontot.
  app.post("/events/:id/registrations", { preHandler: requireUser }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const eventId = idSchema.parse(id);
    const user = request.user!;
    const registration = await register(eventId, { name: user.name, email: user.email, userId: user.id });
    reply.code(201);
    return registration;
  });

  app.get("/me/tickets", { preHandler: requireUser }, async (request) => {
    return await listTicketsForUser(request.user!.id);
  });
}
