import pg from "pg";

export const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ?? "postgres://eventapp:eventapp@localhost:5432/eventapp",
});