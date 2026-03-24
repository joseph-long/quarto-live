import { test, expect, PYODIDE_TIMEOUT } from './fixtures';

test.describe('Comm bridge (Python → JS)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/comm-bridge.html');
  });

  test('Python comm.open() sends comm_open to main thread', async ({ page }) => {
    // Wait for the autorun block to finish executing
    const output = page.locator('.cell-output-stdout');
    await expect(output.first()).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(output.first()).toContainText('comm messages sent');

    // Check that comm_open message was received on the main thread
    const comms = await page.evaluate(() => (window as any).__quarto_live_comms);
    expect(comms).toBeDefined();
    expect(Array.isArray(comms)).toBe(true);

    const commOpen = comms.find((m: any) => m.msgType === 'comm_open');
    expect(commOpen).toBeDefined();
    expect(commOpen.content.data.msg).toBe('hello from python');
    expect(commOpen.content.comm_id).toBeTruthy();
  });

  test('Python comm.send() sends comm_msg to main thread', async ({ page }) => {
    // Wait for execution
    const output = page.locator('.cell-output-stdout');
    await expect(output.first()).toBeVisible({ timeout: PYODIDE_TIMEOUT });
    await expect(output.first()).toContainText('comm messages sent');

    const comms = await page.evaluate(() => (window as any).__quarto_live_comms);
    const commMsg = comms.find((m: any) => m.msgType === 'comm_msg');
    expect(commMsg).toBeDefined();
    expect(commMsg.content.data.count).toBe(42);
    // comm_msg should have the same comm_id as the comm_open
    const commOpen = comms.find((m: any) => m.msgType === 'comm_open');
    expect(commMsg.content.comm_id).toBe(commOpen.content.comm_id);
  });
});
