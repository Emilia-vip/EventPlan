import { describe, expect, it } from "vitest";
import { createEventSchema, registrationSchema } from "../../src/validation.js";

const inOneDay = () => new Date(Date.now() + 86_400_000).toISOString();

describe("createEventSchema", () => {
  it("godkänner ett giltigt event", () => {
    const result = createEventSchema.safeParse({ title: "Fest", startsAt: inOneDay(), capacity: 10 });
    expect(result.success).toBe(true);
  });

  it("trimmar titeln och sätter standardvärden", () => {
    const event = createEventSchema.parse({ title: "  Fest  ", startsAt: inOneDay(), capacity: 10 });
    expect(event.title).toBe("Fest");
    expect(event.description).toBe("");
  });

  it("avvisar tom titel", () => {
    const result = createEventSchema.safeParse({ title: "   ", startsAt: inOneDay(), capacity: 10 });
    expect(result.success).toBe(false);
  });

  it("avvisar 0 platser", () => {
    const result = createEventSchema.safeParse({ title: "Fest", startsAt: inOneDay(), capacity: 0 });
    expect(result.success).toBe(false);
  });

  it("avvisar datum som redan passerat", () => {
    const result = createEventSchema.safeParse({ title: "Fest", startsAt: "2020-01-01", capacity: 10 });
    expect(result.success).toBe(false);
  });
});

describe("registrationSchema", () => {
  it("gör om e-posten till små bokstäver", () => {
    const reg = registrationSchema.parse({ name: "Anna", email: "  Anna@Test.SE " });
    expect(reg.email).toBe("anna@test.se");
  });

  it("avvisar ogiltig e-post", () => {
    const result = registrationSchema.safeParse({ name: "Anna", email: "inte-en-epost" });
    expect(result.success).toBe(false);
  });
});