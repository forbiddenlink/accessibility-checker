import { test, expect } from "@playwright/test";

// Skip webkit due to timing issues with React state updates
test("Analyzer Security: SSRF Validation", async ({ page, browserName }) => {
  test.skip(
    browserName === "webkit",
    "Webkit has timing issues with React state updates",
  );
  await page.goto("/");

  // 1. Find Website Analyzer section
  const urlInput = page
    .getByRole("textbox", { name: "Website URL to analyze" })
    .first();
  const analyzeBtn = page.getByRole("button", { name: "Analyze", exact: true });

  // 2. Try Internal URL (localhost) - Should be blocked by our new SSRF logic
  await urlInput.fill("http://localhost:3000");
  await expect(analyzeBtn).toBeEnabled();
  await analyzeBtn.click();

  // 3. Verify Error Message
  // The API returns 400 with 'Access to localhost is denied'
  // The UI displays the error from the API
  await expect(page.getByText("Access to localhost is denied")).toBeVisible();

  // 4. Try Private IP - Should be blocked
  await urlInput.fill("http://192.168.1.1");
  await analyzeBtn.click();
  await expect(
    page.getByText("Access to private network resources is denied"),
  ).toBeVisible();
});
