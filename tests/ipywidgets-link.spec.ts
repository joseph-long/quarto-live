import { test, expect, PYODIDE_TIMEOUT } from './fixtures';

test.describe('ipywidgets linked sliders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ipywidgets.html');
  });

  test('two linked sliders render', async ({ page }) => {
    const linkedSection = page.locator('#linked-sliders').locator('~ *');
    const sliders = linkedSection.locator('.widget-slider input[type="range"], .jupyter-widgets input[type="range"]');
    await expect(sliders.first()).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(sliders.nth(1)).toBeVisible({ timeout: PYODIDE_TIMEOUT });
  });

  test('changing one linked slider updates the other', async ({ page }) => {
    const linkedSection = page.locator('#linked-sliders').locator('~ *');
    const sliders = linkedSection.locator('.widget-slider input[type="range"], .jupyter-widgets input[type="range"]');
    await expect(sliders.first()).toBeVisible({ timeout: PYODIDE_TIMEOUT });

    // Set slider a to 42
    await sliders.first().fill('42');
    await sliders.first().dispatchEvent('input');

    // Slider b should sync to the same value
    await expect(sliders.nth(1)).toHaveValue('42', { timeout: 10_000 });
  });
});
