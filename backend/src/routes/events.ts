import { createEvent, getEvent, listEvents, register } from "../services/events.js";
import { createEventSchema, idSchema, registrationSchema } from "../validation.js";

export async function eventsRoutes(app) {
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
    return await getEvent(idSchema.parse(request.params.id));
  });

  app.post("/events/:id/registrations", async (request, reply) => {
    const eventId = idSchema.parse(request.params.id);
    const input = registrationSchema.parse(request.body);
    const registration = await register(eventId, input);
    reply.code(201);
    return registration;
  });
}