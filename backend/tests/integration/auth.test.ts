import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app.js";
import { pool } from "../../src/db.js";
import { bearer, signup } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

beforeEach(async () => {
  await pool.query("TRUNCATE events, registrations, users CASCADE");
});

describe("auth", () => {
  it("registrerar konto och returnerar token och användare", async () => {
    const session = await signup(app, "anna@example.com", "Anna");
    expect(session.token).toEqual(expect.any(String));
    expect(session.user).toMatchObject({ name: "Anna", email: "anna@example.com", role: "customer" });
    expect(session.user).not.toHaveProperty("password_hash");
  });

  it("nekar dubbel registrering med samma e-post", async () => {
    await signup(app, "anna@example.com");
    const res = await app.inject({
      method: "POST",
      url: "/auth/signup",
      payload: { name: "Anna", email: "ANNA@example.com", password: "hemligt123" },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe("EMAIL_TAKEN");
  });

  it("loggar in med rätt lösenord", async () => {
    await signup(app, "anna@example.com");
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "anna@example.com", password: "hemligt123" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().token).toEqual(expect.any(String));
  });

  it("nekar fel lösenord och okänd e-post med samma fel", async () => {
    await signup(app, "anna@example.com");
    const wrongPassword = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "anna@example.com", password: "fel-lösenord" },
    });
    const unknownEmail = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "finns-inte@example.com", password: "hemligt123" },
    });
    expect(wrongPassword.statusCode).toBe(401);
    expect(unknownEmail.statusCode).toBe(401);
    expect(wrongPassword.json().error).toBe("INVALID_CREDENTIALS");
    expect(unknownEmail.json().error).toBe("INVALID_CREDENTIALS");
  });

  it("/auth/me returnerar den inloggade användaren", async () => {
    const session = await signup(app, "anna@example.com");
    const res = await app.inject({ method: "GET", url: "/auth/me", headers: bearer(session) });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ email: "anna@example.com" });
  });

  it("nekar ogiltig eller förfalskad token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: "Bearer inte.en.jwt" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe("UNAUTHORIZED");
  });
});
