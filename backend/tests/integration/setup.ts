import { inject } from "vitest";

// Måste sättas innan src/db.ts importeras, eftersom poolen skapas vid import
process.env.DATABASE_URL = inject("databaseUrl");
process.env.JWT_SECRET ??= "testhemlighet-som-ar-minst-32-tecken-lang";
