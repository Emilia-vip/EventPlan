import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

let container: StartedPostgreSqlContainer;

export async function setup(project: TestProject) {
  container = await new PostgreSqlContainer("postgres:16").start();
  const databaseUrl = container.getConnectionUri();

  // Kör alla migrationer i ordning mot test-databasen
  const migrationsDir = join(import.meta.dirname, "../../migrations");
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  for (const file of files) {
    await client.query(await readFile(join(migrationsDir, file), "utf8"));
  }
  await client.end();

  project.provide("databaseUrl", databaseUrl);
}

export async function teardown() {
  await container?.stop();
}
