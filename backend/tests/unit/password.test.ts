import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/auth/password.js";

describe("lösenordshantering", () => {
  it("verifierar rätt lösenord", async () => {
    const hash = await hashPassword("hemligt123");
    expect(await verifyPassword("hemligt123", hash)).toBe(true);
  });

  it("avvisar fel lösenord", async () => {
    const hash = await hashPassword("hemligt123");
    expect(await verifyPassword("fel-lösenord", hash)).toBe(false);
  });

  it("använder unikt salt, så samma lösenord ger olika hashar", async () => {
    expect(await hashPassword("samma")).not.toBe(await hashPassword("samma"));
  });

  it("avvisar ogiltigt hash-format", async () => {
    expect(await verifyPassword("x", "inte-ett-hash")).toBe(false);
  });
});
