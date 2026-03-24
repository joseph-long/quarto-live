import { test, expect, PYODIDE_TIMEOUT } from './fixtures';

test.describe('ipywidgets IntSlider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ipywidgets.html');
  });

  test('slider widget renders with correct initial value', async ({ page }) => {
    // Look for the ipywidgets slider in the Slider section
    const sliderSection = page.locator('section#slider');
    const slider = sliderSection.locator('[role="slider"]').first();
    await expect(slider).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    // Initial value readout should be 5
    const readout = sliderSection.locator('.widget-readout').first();
    await expect(readout).toContainText('5');
  });

  test('slider label shows description', async ({ page }) => {
    const sliderSection = page.locator('section#slider');
    const label = sliderSection.locator('.widget-label').first();
    await expect(label).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(label).toContainText('x');
  });
});
