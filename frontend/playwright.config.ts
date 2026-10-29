import { defineConfig, devices } from "@playwright/test";
import { ADMIN } from "./e2e/constants";

// E2E körs mot hela kedjan: webbläsare -> frontend (Vite) -> backend (Fastify) -> Postgres.
// Frontend och backend ligger på olika portar (precis som cdn./api. i produktion), så CORS testas på riktigt.
// Kräver en Postgres som går att nå på E2E_DATABASE_URL (i CI startas den som en service-container).
const FRONTEND_PORT = 5180;
const BACKEND_PORT = 3100;
const frontendUrl = `http://localhost:${FRONTEND_PORT}`;
const backendUrl = `http://localhost:${BACKEND_PORT}`;


export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: frontendUrl,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // Migrerar databasen och skapar admin-kontot (samma steg som migrate-jobbet i produktion), startar sedan API:t
      command: "npm run migrate && npm start",
      cwd: "../backend",
      url: `${backendUrl}/ready`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        PORT: String(BACKEND_PORT),
        DATABASE_URL: process.env.E2E_DATABASE_URL ?? "postgres://eventapp:eventapp@localhost:5432/eventapp",
        JWT_SECRET: "e2e-hemlighet-som-ar-minst-32-tecken-lang",
        CORS_ORIGIN: frontendUrl,
        ADMIN_EMAIL: ADMIN.email,
        ADMIN_PASSWORD: ADMIN.password,
      },
    },
    {
      command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      env: { VITE_API_URL: backendUrl },
    },
  ],
});
