import { test, expect } from "@playwright/test";

test("Core Journey: Check Contrast -> Fail -> Magic Fix -> Pass", async ({
  page,
}) => {
  // 1. Navigate to home
  await page.goto("/");

  // 2. Check title
  await expect(
    page.getByRole("heading", { name: /Precision Contrast/i }),
  ).toBeVisible();

  // 3. Enter Failing Colors (Grey on Black)
  const fgInput = page.getByRole("textbox", {
    name: "Foreground",
    exact: true,
  });
  const bgInput = page.getByRole("textbox", {
    name: "Background",
    exact: true,
  });

  await fgInput.fill("#333333");
  await bgInput.fill("#000000");

  // 4. Click Check Contrast. The palette panel above the suggestions fetches
  // /api/v1/palettes and expands when it lands, pushing the Apply button down.
  // Clicking before that settles races the layout shift (WebKit flaked on it).
  const palettesLoaded = page.waitForResponse(
    (res) =>
      res.url().endsWith("/api/v1/palettes") &&
      res.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Execute Check" }).click();

  // 5. Verify Suggestions Appear for failing colors
  await expect(page.getByText("Suggestions")).toBeVisible();
  await palettesLoaded;

  // 6. Click Magic Fix (Apply First Suggestion)
  await page.getByRole("button", { name: "Apply" }).first().click();

  // 7. Verify Success state appears
  await expect(page.getByText(/meets WCAG AA standards/i)).toBeVisible();
});
