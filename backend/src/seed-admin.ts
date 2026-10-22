import type pg from "pg";
import { hashPassword } from "./auth/password.js";

// Skapar admin-kontot från ADMIN_EMAIL och ADMIN_PASSWORD. Körs av migrate-jobbet efter migreringarna.
// Idempotent: finns kontot redan får det admin-rollen, men lösenordet ändras inte.
export async function seedAdmin(client: pg.Client) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("ADMIN_EMAIL eller ADMIN_PASSWORD saknas, hoppar över admin-seed");
    return;
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD måste vara minst 8 tecken");
  }

  await client.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ('Admin', $1, $2, 'admin')
     ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
    [email, await hashPassword(password)],
  );
  console.log("Admin-konto säkerställt");
}
