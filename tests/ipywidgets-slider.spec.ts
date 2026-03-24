import { test, expect } from '@playwright/test';

const PYODIDE_TIMEOUT = 90_000;

test.describe('ipywidgets IntSlider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ipywidgets.html');
  });

  test('slider widget renders with correct initial value', async ({ page }) => {
    // Look for the ipywidgets slider in the Slider section
    const sliderSection = page.locator('#slider').locator('~ *');
    const slider = sliderSection.locator('.widget-slider input[type="range"], .jupyter-widgets input[type="range"]').first();
    await expect(slider).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    // Initial value should be 5
    await expect(slider).toHaveValue('5');
  });

  test('slider label shows description', async ({ page }) => {
    const sliderSection = page.locator('#slider').locator('~ *');
    const label = sliderSection.locator('.widget-label, label').first();
    await expect(label).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(label).toContainText('x:');
  });
});
