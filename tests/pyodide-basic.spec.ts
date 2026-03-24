import { test, expect } from '@playwright/test';

const PYODIDE_TIMEOUT = 90_000;

test.describe('Pyodide basic execution', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pyodide-basic.html');
  });

  test('autorun block produces stdout output', async ({ page }) => {
    // The autorun block should execute and show sin(0) = 0.0000
    const output = page.locator('.cell-output-stdout');
    await expect(output.first()).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(output.first()).toContainText('sin(');
  });
});
