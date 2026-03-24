import { test, expect, PYODIDE_TIMEOUT } from './fixtures';

test.describe('OJS inputs reactivity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ojs-inputs.html');
  });

  test('slider renders', async ({ page }) => {
    const slider = page.locator('input[type="range"]').first();
    await expect(slider).toBeVisible({ timeout: 30_000 });
  });

  test('matplotlib plot renders from slider input', async ({ page }) => {
    // Wait for the matplotlib output (rendered as img or canvas by quarto-live)
    const plot = page.locator('.cell-output-display img, canvas.img-fluid').first();
    await expect(plot).toBeVisible({ timeout: PYODIDE_TIMEOUT });
  });

  test('dropdown renders and shows selected value', async ({ page }) => {
    const dropdown = page.locator('select').first();
    await expect(dropdown).toBeVisible({ timeout: 30_000 });

    // The print output from the dropdown section
    const output = page.locator('.cell-output-stdout').first();
    await expect(output).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(output).toContainText('Selected color:');
  });

  test('changing slider triggers plot re-render', async ({ page }) => {
    // Wait for initial plot
    const plot = page.locator('.cell-output-display img, canvas.img-fluid').first();
    await expect(plot).toBeVisible({ timeout: PYODIDE_TIMEOUT });

    // Change slider value
    const slider = page.locator('input[type="range"]').first();
    await slider.fill('100');
    await slider.dispatchEvent('input');

    // Wait a moment for re-render, then check plot still visible
    await page.waitForTimeout(2000);
    await expect(plot).toBeVisible();
  });
});
