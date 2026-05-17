'use strict';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Wait for navigation + SPA settle before interacting with Printify.
 */
async function waitForPageReady(page, options = {}) {
  const settleMs = options.settleMs ?? parseInt(process.env.PAGE_SETTLE_MS || '6000', 10);
  const timeout = options.timeout ?? parseInt(process.env.PLAYWRIGHT_TIMEOUT_MS || '120000', 10);
  const waitUntil = options.waitUntil || 'load';

  if (options.goto) {
    await page.goto(options.goto, { waitUntil, timeout });
  }

  await page.waitForLoadState('domcontentloaded', { timeout }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 45000) }).catch(() => null);
  await sleep(settleMs);
}

async function waitForAppShell(page, timeoutMs = 60000) {
  await page
    .waitForFunction(
      () => {
        const body = document.body?.innerText || '';
        if (body.toLowerCase().includes('verify you are human')) return false;
        return (
          document.querySelector('nav, [class*="sidebar"], [class*="dashboard"], main') !== null ||
          window.location.pathname.startsWith('/app/')
        );
      },
      { timeout: timeoutMs }
    )
    .catch(() => null);
}

module.exports = { waitForPageReady, waitForAppShell, sleep };
