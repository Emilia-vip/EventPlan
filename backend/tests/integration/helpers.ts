import type { FastifyInstance } from "fastify";
import { pool } from "../../src/db.js";

export interface TestSession {
  token: string;
  user: { id: string; name: string; email: string; role: "customer" | "admin" };
}

export async function signup(app: FastifyInstance, email: string, name = "Anna"): Promise<TestSession> {
  const res = await app.inject({
    method: "POST",
    url: "/auth/signup",
    payload: { name, email, password: "hemligt123" },
  });
  if (res.statusCode !== 201) throw new Error(`signup misslyckades: ${res.body}`);
  return res.json() as TestSession;
}

/** Skapar ett konto och ger det admin-rollen direkt i databasen (ingen API-väg finns för det). */
export async function adminSession(app: FastifyInstance, email = "admin@example.com"): Promise<TestSession> {
  const session = await signup(app, email, "Admin");
  await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [session.user.id]);
  return { ...session, user: { ...session.user, role: "admin" } };
}

export const bearer = (session: TestSession) => ({ authorization: `Bearer ${session.token}` });
