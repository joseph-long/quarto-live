import { test, expect, PYODIDE_TIMEOUT } from './fixtures';

test.describe('ipywidgets Output widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ipywidgets.html');
  });

  test('Output widget renders captured print output', async ({ page }) => {
    const outputSection = page.locator('section#output-widget');
    // The Output widget renders captured text. Look for the text in the section.
    const output = outputSection.locator('.widget-output, .cell-output-pyodide').first();
    await expect(output).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(output).toContainText('captured output');
  });
});
