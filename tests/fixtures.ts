import { test as base } from '@playwright/test';

// Shared test fixture that forwards browser console output to the
// Playwright runner's stdout, giving visibility into runtime errors.
export const test = base.extend({
  page: async ({ page }, use) => {
    page.on('console', (msg) => {
      const type = msg.type();
      const prefix = type === 'error' ? 'PAGE ERROR' : type === 'warning' ? 'PAGE WARN' : 'PAGE LOG';
      console.log(`[${prefix}] ${msg.text()}`);
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';

export const PYODIDE_TIMEOUT = 90_000;
