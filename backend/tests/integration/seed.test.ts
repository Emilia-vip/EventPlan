import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type pg from "pg";
import { verifyPassword } from "../../src/auth/password.js";
import { pool } from "../../src/db.js";
import { seedAdmin } from "../../src/seed-admin.js";

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  await pool.query("TRUNCATE users CASCADE");
  process.env.ADMIN_EMAIL = "Admin@Example.com";
  process.env.ADMIN_PASSWORD = "adminlosen123";
});

// seedAdmin använder bara .query(), så poolen fungerar som klient i testet
const client = () => pool as unknown as pg.Client;

describe("admin-seed", () => {
  it("skapar admin-kontot med hashat lösenord", async () => {
    await seedAdmin(client());

    const { rows } = await pool.query("SELECT role, password_hash FROM users WHERE email = $1", [
      "admin@example.com",
    ]);
    expect(rows[0]?.role).toBe("admin");
    expect(rows[0]?.password_hash).not.toContain("adminlosen123");
    expect(await verifyPassword("adminlosen123", rows[0].password_hash)).toBe(true);
  });

  it("är idempotent och ändrar inte lösenordet för ett befintligt konto", async () => {
    await seedAdmin(client());
    const first = await pool.query("SELECT password_hash FROM users WHERE email = 'admin@example.com'");

    process.env.ADMIN_PASSWORD = "nytt-losenord-123";
    await seedAdmin(client());

    const second = await pool.query("SELECT password_hash, role FROM users WHERE email = 'admin@example.com'");
    expect(second.rows[0].password_hash).toBe(first.rows[0].password_hash);
    expect(second.rows[0].role).toBe("admin");
    expect(await pool.query("SELECT 1 FROM users")).toMatchObject({ rowCount: 1 });
  });

  it("hoppar över seeden när variablerna saknas", async () => {
    delete process.env.ADMIN_EMAIL;
    await seedAdmin(client());
    expect((await pool.query("SELECT 1 FROM users")).rowCount).toBe(0);
  });
});
