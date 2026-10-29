import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

describe("driftsendpoints", () => {
  it("/health svarar ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it("/ready svarar ok när databasen går att nå", async () => {
    const res = await app.inject({ method: "GET", url: "/ready" });
    expect(res.statusCode).toBe(200);
  });

  it("/metrics exponerar Prometheus-format med rutt-mönster som label", async () => {
    await app.inject({ method: "GET", url: "/events/00000000-0000-0000-0000-000000000000" });

    const res = await app.inject({ method: "GET", url: "/metrics" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
    expect(res.body).toContain("http_requests_total");
    // Rutt-mönstret ska användas, inte det konkreta id:t
    expect(res.body).toContain('route="/events/:id"');
    expect(res.body).not.toContain("00000000-0000-0000-0000-000000000000");
  });
});

describe("klientfel från Fastify", () => {
  it("trasig JSON ger 400, inte 500", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      headers: { "content-type": "application/json" },
      payload: "{trasig",
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: "FST_ERR_CTP_INVALID_JSON_BODY" });
  });

  it("tom body med Content-Type: application/json ger 400, inte 500", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      headers: { "content-type": "application/json" },
    });
    expect(res.statusCode).toBe(400);
  });
});
