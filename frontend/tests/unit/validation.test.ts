import { describe, expect, it } from "vitest";
import { createEventSchema, loginSchema, parseForm, signupSchema } from "../../src/validation";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

describe("signupSchema", () => {
  it("gör e-post till gemener och trimmar", () => {
    const parsed = signupSchema.parse({ name: " Anna ", email: " ANNA@Example.se ", password: "hemligt123" });
    expect(parsed).toEqual({ name: "Anna", email: "anna@example.se", password: "hemligt123" });
  });

  it("kräver minst 8 tecken i lösenordet", () => {
    expect(signupSchema.safeParse({ name: "Anna", email: "a@b.se", password: "kort" }).success).toBe(false);
  });

  it("kräver ett namn", () => {
    expect(signupSchema.safeParse({ name: " ", email: "a@b.se", password: "hemligt123" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("avvisar ogiltig e-post", () => {
    expect(loginSchema.safeParse({ email: "inte-en-epost", password: "x" }).success).toBe(false);
  });
});

describe("createEventSchema", () => {
  const valid = { title: "Fest", startsAt: "2999-12-24T18:00", capacity: "30" };

  it("omvandlar kapacitet från text till tal", () => {
    expect(createEventSchema.parse(valid).capacity).toBe(30);
  });

  it("avvisar datum i det förflutna", () => {
    expect(createEventSchema.safeParse({ ...valid, startsAt: "2000-01-01T10:00" }).success).toBe(false);
  });

  it("avvisar 0 platser och decimaltal", () => {
    expect(createEventSchema.safeParse({ ...valid, capacity: "0" }).success).toBe(false);
    expect(createEventSchema.safeParse({ ...valid, capacity: "1.5" }).success).toBe(false);
  });
});

describe("parseForm", () => {
  it("ger data när formuläret är giltigt", () => {
    const result = parseForm(loginSchema, form({ email: "a@b.se", password: "x" }));
    expect(result).toEqual({ ok: true, data: { email: "a@b.se", password: "x" } });
  });

  it("ger första felmeddelandet när formuläret är ogiltigt", () => {
    const result = parseForm(signupSchema, form({ name: "Anna", email: "a@b.se", password: "kort" }));
    expect(result).toEqual({ ok: false, message: "Password must be at least 8 characters" });
  });
});
