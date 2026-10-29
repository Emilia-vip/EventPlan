import { expect, test, type Page } from "@playwright/test";
import { ADMIN } from "./constants";

// Riktigt flöde genom hela kedjan, ingenting är mockat: webbläsare -> frontend -> backend -> Postgres.
// Admin-kontot skapas av migreringssteget som startar backend (se playwright.config.ts).

const run = Date.now();
const customer = { name: "Anna E2E", email: `anna-${run}@example.com`, password: "hemligt123" };
const eventTitle = `E2E-fest ${run}`;

function futureLocal(): string {
  const d = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function logIn(page: Page, email: string, password: string) {
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("dialog").getByRole("button", { name: /^Log in/ }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
}

test("admin skapar event, kund registrerar konto, loggar in och bokar plats", async ({ page }) => {
  await page.goto("/");

  // 1. Admin loggar in och skapar ett event med två platser
  await logIn(page, ADMIN.email, ADMIN.password);
  await page.getByRole("button", { name: "Create event" }).first().click();
  const createDialog = page.getByRole("dialog");
  await createDialog.getByLabel("Title").fill(eventTitle);
  await createDialog.getByLabel("Location").fill("Stockholm");
  await createDialog.getByLabel("Date and time").fill(futureLocal());
  await createDialog.getByLabel("Number of spots").fill("2");
  await createDialog.getByLabel("Description").fill("Skapat av e2e-testet");
  await createDialog.getByRole("button", { name: /^Create event/ }).click();

  // Eventet sparas i databasen och öppnas direkt
  await expect(page.getByRole("dialog").getByRole("heading", { name: eventTitle })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Log out" }).click();

  // 2. Kunden skapar ett konto (loggas in direkt) och loggar ut
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.getByLabel("Name").fill(customer.name);
  await page.getByLabel("Email").fill(customer.email);
  await page.getByLabel("Password").fill(customer.password);
  await page.getByRole("dialog").getByRole("button", { name: /^Create account/ }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create event" })).toHaveCount(0);
  await page.getByRole("button", { name: "Log out" }).click();

  // 3. Kunden loggar in igen och bokar en plats
  await logIn(page, customer.email, customer.password);
  await page.getByRole("button", { name: `Read more about ${eventTitle}` }).click();
  await expect(page.getByRole("dialog").getByText("2 spots left")).toBeVisible();
  await page.getByRole("button", { name: /Get ticket/ }).click();
  await expect(page.getByText("You've got a ticket!")).toBeVisible();
  await page.getByRole("button", { name: "Back to all events" }).click();

  // 4. Biljetten finns kvar efter en omladdning, så den är sparad i databasen
  await page.reload();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  await page.getByRole("button", { name: "My tickets" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: eventTitle })).toBeVisible();
});

test("fel lösenord ger ett felmeddelande från backend", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByLabel("Email").fill(ADMIN.email);
  await page.getByLabel("Password").fill("fel-losenord");
  await page.getByRole("dialog").getByRole("button", { name: /^Log in/ }).click();

  await expect(page.getByRole("alert")).toHaveText("Wrong email or password");
});
