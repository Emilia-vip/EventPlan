import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app.js";
import { pool } from "../../src/db.js";

const ALLOWED = "https://cdn.example.se";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp({ corsOrigins: [ALLOWED] });
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

describe("CORS", () => {
  it("tillåter anrop från frontend-domänen", async () => {
    const res = await app.inject({ method: "GET", url: "/events", headers: { origin: ALLOWED } });
    expect(res.statusCode).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED);
  });

  it("svarar på preflight med Content-Type och Authorization tillåtna", async () => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/events",
      headers: {
        origin: ALLOWED,
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type,authorization",
      },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(ALLOWED);
    expect(res.headers["access-control-allow-headers"]).toMatch(/content-type/i);
    expect(res.headers["access-control-allow-headers"]).toMatch(/authorization/i);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
  });

  it("ger ingen CORS-header till andra domäner", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/events",
      headers: { origin: "https://ond.example.com" },
    });
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
