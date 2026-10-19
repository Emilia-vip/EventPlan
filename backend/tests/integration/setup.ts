import { inject } from "vitest";

// Måste sättas innan src/db.ts importeras, eftersom poolen skapas vid import
process.env.DATABASE_URL = inject("databaseUrl");
