import { test, expect, PYODIDE_TIMEOUT } from './fixtures';

test.describe('ipywidgets interact updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ipywidgets.html');
  });

  test('interact replaces output on slider change, not appends', async ({ page }) => {
    const interactSection = page.locator('section#interact');
    const slider = interactSection.locator('[role="slider"]').first();
    await expect(slider).toBeVisible({ timeout: PYODIDE_TIMEOUT });

    // Wait for initial output: x = 5, x² = 25
    const output = interactSection.locator('.widget-output').first();
    await expect(output).toContainText('x = 5', { timeout: PYODIDE_TIMEOUT });

    // Change slider to 3
    const sliderTarget = interactSection.locator('.noUi-target').first();
    await sliderTarget.evaluate((el: any) => el.noUiSlider.set(3));

    // Output should update to show x = 3
    await expect(output).toContainText('x = 3', { timeout: PYODIDE_TIMEOUT });

    // The old output should be REPLACED, not appended.
    // In a working interact, only the latest output is visible.
    await expect(output).not.toContainText('x = 5', { timeout: 5_000 });
  });

  test('interact output updates on repeated slider changes', async ({ page }) => {
    const interactSection = page.locator('section#interact');
    const slider = interactSection.locator('[role="slider"]').first();
    await expect(slider).toBeVisible({ timeout: PYODIDE_TIMEOUT });

    // Wait for initial output
    const output = interactSection.locator('.widget-output').first();
    await expect(output).toContainText('x = 5', { timeout: PYODIDE_TIMEOUT });

    // First slider change: move to 3
    const sliderTarget = interactSection.locator('.noUi-target').first();
    await sliderTarget.evaluate((el: any) => el.noUiSlider.set(3));
    await expect(output).toContainText('x = 3', { timeout: PYODIDE_TIMEOUT });

    // Second slider change: move to 7
    await sliderTarget.evaluate((el: any) => el.noUiSlider.set(7));
    await expect(output).toContainText('x = 7', { timeout: PYODIDE_TIMEOUT });
    await expect(output).toContainText('x² = 49');

    // Should NOT contain stale outputs from previous values
    await expect(output).not.toContainText('x = 3', { timeout: 5_000 });
  });
});
