import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import { seedAdmin } from "./seed-admin.js";

// Kör migrationer som ännu inte är körda. Körs som ett Kubernetes-Job före varje deploy.
// En advisory lock gör att två samtidiga körningar inte krockar.
const LOCK_ID = 727_001;
const migrationsDir = process.env.MIGRATIONS_DIR ?? join(import.meta.dirname, "../migrations");

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await client.query<{ name: string }>("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.name));

  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(join(migrationsDir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`Körde migrering ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }
  await seedAdmin(client);
  console.log("Migreringar klara");
} finally {
  await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]);
  await client.end();
}
