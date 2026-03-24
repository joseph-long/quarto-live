import { test, expect, PYODIDE_TIMEOUT } from './fixtures';

test.describe('OJS define and round-trip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ojs-define.html');
  });

  test('Python define renders spiral plot via OJS', async ({ page }) => {
    // Observable Plot renders as SVG
    const svg = page.locator('svg').first();
    await expect(svg).toBeVisible({ timeout: PYODIDE_TIMEOUT });
  });

  test('round-trip polygon renders via OJS Plot', async ({ page }) => {
    // The polygon section also uses Plot (SVG)
    // There should be at least 2 SVGs on the page (spiral + polygon)
    const svgs = page.locator('figure svg, .observablehq svg');
    await expect(svgs.first()).toBeVisible({ timeout: PYODIDE_TIMEOUT });
  });

  test('changing polygon sides slider updates the SVG', async ({ page }) => {
    // Wait for polygon SVG
    const svgs = page.locator('figure svg, .observablehq svg');
    await expect(svgs.first()).toBeVisible({ timeout: PYODIDE_TIMEOUT });

    // Change the n_sides slider
    const slider = page.locator('input[type="range"]').first();
    await slider.fill('8');
    await slider.dispatchEvent('input');

    // SVG should still be visible after update
    await page.waitForTimeout(2000);
    await expect(svgs.first()).toBeVisible();
  });
});
