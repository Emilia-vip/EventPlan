import { expect, test } from "@playwright/test";

test("startsidan visar hero och eventlistan från backend", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Find something to");
  // Antingen finns det event i databasen eller så visas tomt-läget. Felläget får inte visas.
  await expect(page.getByText("Something went wrong")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Upcoming events" })).toBeVisible();
});

// Här är det enda stället backend medvetet inte används: vi simulerar att den ligger nere.
test("visar ett felmeddelande med Try again när backend inte går att nå", async ({ page }) => {
  await page.route("**/events", (route) => route.abort());

  await page.goto("/");

  await expect(page.getByText("We couldn't load the events right now.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});
