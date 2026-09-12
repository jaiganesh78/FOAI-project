import { test, expect } from '@playwright/test';

test('Homepage loads correctly with Sprint 0 heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('GPIOS Enterprise Platform');
});
