import { test, expect } from '@playwright/test';

test('Core Journey: Check Contrast -> Fail -> Magic Fix -> Pass', async ({ page }) => {
    // 1. Navigate to home
    await page.goto('/');

    // 2. Check title
    await expect(page.getByRole('heading', { name: 'Color Contrast Checker' })).toBeVisible();

    // 3. Enter Failing Colors (Grey on Black)
    const fgInput = page.getByLabel('Text Color', { exact: true });
    const bgInput = page.getByLabel('Background Color', { exact: true });

    await fgInput.fill('#333333');
    await bgInput.fill('#000000');

    // 4. Click Check Contrast
    await page.getByRole('button', { name: 'Check color contrast' }).click();

    // 5. Verify Suggestions Appear for failing colors
    await expect(page.getByText('Color Suggestions')).toBeVisible();

    // 7. Click Magic Fix (Apply First Suggestion)
    // We added "Apply Fix" text in the button
    await page.getByRole('button', { name: 'Apply Fix' }).first().click();

    // 7. Verify Success state appears
    await expect(page.getByText('meets WCAG AA standards! No changes needed.')).toBeVisible();
});
