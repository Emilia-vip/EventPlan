import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app.js";
import { pool } from "../../src/db.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

beforeEach(async () => {
  await pool.query("TRUNCATE events, registrations CASCADE");
});

const createEvent = (capacity: number) =>
  app.inject({
    method: "POST",
    url: "/events",
    payload: {
      title: "Fest",
      description: "Julfest",
      location: "Stockholm",
      startsAt: "2030-12-24T18:00:00.000Z",
      capacity,
    },
  });

const registerTo = (eventId: string, email: string) =>
  app.inject({
    method: "POST",
    url: `/events/${eventId}/registrations`,
    payload: { name: "Anna", email },
  });

describe("events API", () => {
  it("skapar och hämtar ett event", async () => {
    const created = await createEvent(10);
    expect(created.statusCode).toBe(201);

    const res = await app.inject({ method: "GET", url: `/events/${created.json().id}` });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ title: "Fest", capacity: 10, seatsLeft: 10 });
  });

  it("listar kommande events", async () => {
    await createEvent(5);
    const res = await app.inject({ method: "GET", url: "/events" });
    expect(res.json()).toHaveLength(1);
  });

  it("nekar dubbelanmälan med samma e-post", async () => {
    const { id } = (await createEvent(10)).json();
    expect((await registerTo(id, "anna@example.com")).statusCode).toBe(201);

    const res = await registerTo(id, "anna@example.com");
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe("ALREADY_REGISTERED");
  });

  it("överbokar inte vid samtidiga anmälningar", async () => {
    const { id } = (await createEvent(3)).json();

    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => registerTo(id, `user${i}@example.com`)),
    );

    expect(results.filter((r) => r.statusCode === 201)).toHaveLength(3);
    expect(results.filter((r) => r.statusCode === 409)).toHaveLength(7);

    const event = (await app.inject({ method: "GET", url: `/events/${id}` })).json();
    expect(event).toMatchObject({ seatsTaken: 3, seatsLeft: 0, isFull: true });
  });
});
