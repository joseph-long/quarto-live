import { test, expect, PYODIDE_TIMEOUT } from './fixtures';

test.describe('ipywidgets linked sliders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ipywidgets.html');
  });

  test('two linked sliders render', async ({ page }) => {
    const linkedSection = page.locator('section#linked-sliders');
    const sliders = linkedSection.locator('[role="slider"]');
    await expect(sliders.first()).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(sliders.nth(1)).toBeVisible({ timeout: PYODIDE_TIMEOUT });
  });

  test('changing one linked slider updates the other', async ({ page }) => {
    const linkedSection = page.locator('section#linked-sliders');
    const sliders = linkedSection.locator('[role="slider"]');
    await expect(sliders.first()).toBeVisible({ timeout: PYODIDE_TIMEOUT });

    // Set slider a to 42 via nouislider API
    const sliderTarget = linkedSection.locator('.noUi-target').first();
    await sliderTarget.evaluate((el: any) => el.noUiSlider.set(42));

    // Slider b readout should sync to the same value
    const readouts = linkedSection.locator('.widget-readout');
    await expect(readouts.nth(1)).toContainText('42', { timeout: 10_000 });
  });
});
