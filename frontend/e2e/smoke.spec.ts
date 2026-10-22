import { expect, test } from "@playwright/test";

// Backend körs inte i e2e-testerna. API-anropen mockas så att testet bara kontrollerar frontend.
test("startsidan listar kommande event från API:t", async ({ page }) => {
  await page.route("**/events", (route) =>
    route.fulfill({
      json: [
        {
          id: "00000000-0000-0000-0000-000000000001",
          title: "Julfest på Söder",
          description: "Glögg och pepparkakor",
          location: "Stockholm",
          startsAt: "2030-12-24T18:00:00.000Z",
          capacity: 40,
          seatsTaken: 10,
          seatsLeft: 30,
          isFull: false,
        },
      ],
    }),
  );

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Julfest på Söder" })).toBeVisible();
});
