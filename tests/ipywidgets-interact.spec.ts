import { test, expect } from '@playwright/test';

const PYODIDE_TIMEOUT = 90_000;

test.describe('ipywidgets interact', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ipywidgets.html');
  });

  test('interact creates a slider and output', async ({ page }) => {
    // The interact section should produce a slider and output area
    const interactSection = page.locator('#interact').locator('~ *');
    const slider = interactSection.locator('.widget-slider input[type="range"], .jupyter-widgets input[type="range"]').first();
    await expect(slider).toBeVisible({ timeout: PYODIDE_TIMEOUT });

    // Should show initial output: x = 5, x² = 25
    const output = interactSection.locator('.widget-output, .jupyter-widgets-output-area').first();
    await expect(output).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(output).toContainText('x = 5');
  });

  test('changing interact slider updates output', async ({ page }) => {
    const interactSection = page.locator('#interact').locator('~ *');
    const slider = interactSection.locator('.widget-slider input[type="range"], .jupyter-widgets input[type="range"]').first();
    await expect(slider).toBeVisible({ timeout: PYODIDE_TIMEOUT });

    // Change slider to 3
    await slider.fill('3');
    await slider.dispatchEvent('input');

    // Output should update
    const output = interactSection.locator('.widget-output, .jupyter-widgets-output-area').first();
    await expect(output).toContainText('x = 3', { timeout: PYODIDE_TIMEOUT });
    await expect(output).toContainText('x² = 9');
  });
});
