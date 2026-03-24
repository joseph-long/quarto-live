import { test, expect, PYODIDE_TIMEOUT } from './fixtures';

test.describe('ipywidgets Output widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ipywidgets.html');
  });

  test('Output widget renders captured print output', async ({ page }) => {
    const outputSection = page.locator('#output-widget').locator('~ *');
    const output = outputSection.locator('.widget-output, .jupyter-widgets-output-area').first();
    await expect(output).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(output).toContainText('captured output');
  });
});
