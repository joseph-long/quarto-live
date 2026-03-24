import { test, expect, PYODIDE_TIMEOUT } from './fixtures';

test.describe('ipywidgets interact', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ipywidgets.html');
  });

  test('interact creates a slider and output', async ({ page }) => {
    // The interact section should produce a slider and output area
    const interactSection = page.locator('section#interact');
    const slider = interactSection.locator('[role="slider"]').first();
    await expect(slider).toBeVisible({ timeout: PYODIDE_TIMEOUT });

    // Should show initial output: x = 5, x² = 25
    // The interact output appears as stdout in a code block or widget output
    const output = interactSection.locator('.cell-output-stdout, .widget-output').first();
    await expect(output).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(output).toContainText('x = 5');
  });

  test('changing interact slider updates output', async ({ page }) => {
    const interactSection = page.locator('section#interact');
    const slider = interactSection.locator('[role="slider"]').first();
    await expect(slider).toBeVisible({ timeout: PYODIDE_TIMEOUT });

    // Change slider to 3 via nouislider API
    const sliderTarget = interactSection.locator('.noUi-target').first();
    await sliderTarget.evaluate((el: any) => el.noUiSlider.set(3));

    // Output should update
    const output = interactSection.locator('.widget-output, .cell-output-stdout').first();
    await expect(output).toContainText('x = 3', { timeout: PYODIDE_TIMEOUT });
    await expect(output).toContainText('x² = 9');
  });
});
