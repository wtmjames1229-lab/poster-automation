'use strict';

const { waitForPageReady, waitForAppShell, sleep } = require('./pageReady');
const { handleCaptchaThenSubmit, waitForCaptchaCleared, isCaptchaVisible } = require('./cloudflare');

const LOGIN_URLS = [
  'https://printify.com/app/auth/login',
  'https://printify.com/app/login',
];

function isLoggedInUrl(url) {
  return (
    /printify\.com\/app\//.test(url) &&
    !/\/auth\/login|\/app\/login(?:\?|$)/.test(url)
  );
}

async function dismissOverlays(page) {
  const labels = ['Accept', 'Accept all', 'Got it', 'I agree', 'Allow all', 'Continue'];
  for (const label of labels) {
    const btn = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
    if ((await btn.count()) > 0 && (await btn.isVisible().catch(() => false))) {
      await btn.click({ timeout: 3000 }).catch(() => null);
      await sleep(800);
    }
  }
}

async function getLoginSurface(page) {
  for (const frame of page.frames()) {
    try {
      if ((await frame.locator('input[type="password"]').count()) > 0) return frame;
    } catch (_) {
      /* cross-origin */
    }
  }
  return page;
}

async function findEmailInput(surface) {
  const selectors = [
    'input[type="email"]',
    'input[name="email"]',
    'input[placeholder*="email" i]',
    'input[autocomplete="username"]',
  ];
  for (const sel of selectors) {
    const loc = surface.locator(sel).first();
    if ((await loc.count()) > 0 && (await loc.isVisible().catch(() => false))) return loc;
  }
  const named = surface.getByRole('textbox', { name: /email/i });
  if ((await named.count()) > 0) return named.first();
  return surface.getByRole('textbox').first();
}

async function clickContinueWithEmail(page) {
  const btn = page
    .locator('button, a')
    .filter({ hasText: /continue with email|sign in with email|use email/i })
    .first();
  if (await btn.isVisible().catch(() => false)) {
    await btn.click({ timeout: 8000 });
    await sleep(3000);
  }
}

async function submitLogin(surface) {
  const candidates = [
    surface.getByRole('button', { name: /^sign\s*in$/i }),
    surface.getByRole('button', { name: /^log\s*in$/i }),
    surface.getByRole('button', { name: /^continue$/i }),
    surface.locator('button[type="submit"]'),
  ];
  for (const loc of candidates) {
    const btn = loc.first();
    if ((await btn.count()) > 0 && (await btn.isVisible().catch(() => false))) {
      await btn.scrollIntoViewIfNeeded().catch(() => null);
      await btn.click({ timeout: 15000 });
      return;
    }
  }
  await surface.keyboard.press('Enter');
}

/**
 * Robust Printify login:
 * 1) load page fully  2) email  3) password  4) captcha wait  5) submit  6) wait for app
 */
async function performPrintifyLogin(page, credentials, options = {}) {
  const email = credentials.email || process.env.PRINTIFY_EMAIL;
  const password = credentials.password || process.env.PRINTIFY_PASSWORD;
  if (!email || !password) {
    throw new Error('PRINTIFY_EMAIL and PRINTIFY_PASSWORD are required');
  }

  const pageSettle = parseInt(process.env.LOGIN_PAGE_SETTLE_MS || '8000', 10);
  const loginTimeout = options.loginTimeoutMs ?? parseInt(process.env.LOGIN_TOTAL_MAX_MS || '600000', 10);
  const deadline = Date.now() + loginTimeout;

  let lastErr = null;

  for (const loginUrl of LOGIN_URLS) {
    try {
      console.log('[login] Loading', loginUrl);
      await waitForPageReady(page, {
        goto: loginUrl,
        waitUntil: 'load',
        settleMs: pageSettle,
        timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT_MS || '120000', 10),
      });

      await dismissOverlays(page);
      await clickContinueWithEmail(page);

      const surface = await getLoginSurface(page);
      const emailInput = await findEmailInput(surface);
      await emailInput.waitFor({ state: 'visible', timeout: 60000 });
      await sleep(1500);

      console.log('[login] Filling email...');
      await emailInput.click();
      await emailInput.fill('');
      await emailInput.pressSequentially(email, { delay: 40 });
      await sleep(1200);

      let passInput = surface.locator('input[type="password"]').first();
      if (!(await passInput.isVisible().catch(() => false))) {
        await submitLogin(surface);
        await sleep(3000);
        passInput = surface.locator('input[type="password"]').first();
        await passInput.waitFor({ state: 'visible', timeout: 60000 });
      }

      console.log('[login] Filling password...');
      await passInput.click();
      await passInput.fill('');
      await passInput.pressSequentially(password, { delay: 40 });
      await sleep(1500);

      await handleCaptchaThenSubmit(page, () => submitLogin(surface), options);

      console.log('[login] Waiting for dashboard / app load...');
      while (Date.now() < deadline) {
        if (isLoggedInUrl(page.url())) break;
        if (await isCaptchaVisible(page)) {
          await waitForCaptchaCleared(page);
        }
        await sleep(2500);
      }

      if (!isLoggedInUrl(page.url())) {
        await page
          .waitForURL((u) => isLoggedInUrl(u.toString()), { timeout: 90000 })
          .catch(() => null);
      }

      await waitForPageReady(page, {
        goto: 'https://printify.com/app/dashboard',
        settleMs: pageSettle,
      });
      await waitForAppShell(page, 60000);

      if (!isLoggedInUrl(page.url())) {
        throw new Error(
          'Still on login after submit — complete captcha in the browser window (npm run login:headed)'
        );
      }

      console.log('[login] ✓ Logged in:', page.url());
      return true;
    } catch (err) {
      lastErr = err;
      console.warn('[login] Attempt failed at', loginUrl, ':', err.message);
      await page.screenshot({ path: 'debug_login.png', fullPage: true }).catch(() => null);
    }
  }

  throw new Error(`Login failed: ${lastErr?.message || 'unknown'}`);
}

module.exports = {
  performPrintifyLogin,
  isLoggedInUrl,
  dismissOverlays,
};
