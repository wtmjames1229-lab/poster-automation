/**
 * offsiteAds.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Printify "Etsy off-site ads" toggle automation via Playwright.
 *
 * HOW IT WORKS
 * ─────────────
 * Printify has NO public API for the offsite-ads toggle. The toggle only exists
 * inside the Printify product-detail UI (Angular SPA). This module:
 *
 *   1. Logs into printify.com using stored session cookies (or email/password).
 *   2. Navigates to each product-detail page by product ID.
 *   3. Waits for the Angular component containing "Etsy off-site ads" to mount.
 *   4. Reads the current toggle state.
 *   5. Clicks the toggle if it doesn't match the desired state.
 *   6. Waits for the network PATCH/PUT call to settle before moving on.
 *
 * INTEGRATION WITH automation.js
 * ────────────────────────────────
 * After publishToEtsy() succeeds, call:
 *
 *   const { enableOffsiteAds } = require('./offsiteAds');
 *   await enableOffsiteAds(productId, false); // false = disable offsite ads
 *
 * SETUP
 * ──────
 *   npm install playwright dotenv
 *   npx playwright install chromium
 *
 * ENV VARS (add to .env)
 * ───────────────────────
 *   PRINTIFY_EMAIL=your@email.com
 *   PRINTIFY_PASSWORD=yourpassword
 *   PRINTIFY_SHOP_ID=18634010
 *   OFFSITE_ADS_ENABLED=false          # true = enable, false = disable
 *   PRINTIFY_SESSION_FILE=./session.json  # persisted login session
 */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { loadEnv, paths } = require('./config');
const { spawnScriptSync } = require('./spawnUtil');

loadEnv();

const CONFIG = {
  email: process.env.PRINTIFY_EMAIL,
  password: process.env.PRINTIFY_PASSWORD,
  shopId: process.env.PRINTIFY_SHOP_ID || '18634010',
  sessionFile: paths.getSessionPath(),
  headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
  slowMo: parseInt(process.env.PLAYWRIGHT_SLOW_MO || '0', 10),
  timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT_MS || '90000', 10),
  userDataDir: paths.getChromeProfilePath(),
  useProfile: process.env.PLAYWRIGHT_USE_PROFILE === 'true',
  preferSession: process.env.PLAYWRIGHT_PREFER_SESSION !== 'false',
};

// ─── Selectors ───────────────────────────────────────────────────────────────
// Derived from the Printify product-detail Angular HTML.
// The "Etsy off-site ads" section is inside the Pricing card.
// The toggle input is a pfy-toggle-switch inside the offsite-ads card.
//
// Strategy: text-anchor first → then find the nearest toggle.
// This is resilient to class name changes (Angular generates dynamic classes).

const NAV_WAIT = 'domcontentloaded';

const SELECTORS = {
  // Login page (Printify changes layout; try several patterns)
  loginEmailInput:
    'input[type="email"], input[name="email"], input[id*="email"], ' +
    'input[type="text"][name*="email" i], input[autocomplete="username"], ' +
    'input[placeholder*="email" i], input[placeholder*="Email"]',
  loginPasswordInput: 'input[type="password"], input[autocomplete="current-password"]',
  loginSubmitBtn:
    'button[type="submit"], button:has-text("Log in"), button:has-text("Sign in"), ' +
    'button:has-text("Continue"), button:has-text("Log In")',
  loginWithEmailBtn:
    'button:has-text("Continue with email"), a:has-text("Continue with email"), ' +
    'button:has-text("Log in with email"), a:has-text("Log in with email")',

  // Logged-in indicator
  loggedInIndicator:
    '[data-testid="sidebar"], pfa-sidebar, .pfy-sidebar, nav[aria-label="Main"], ' +
    'a[href*="/app/dashboard"], a[href*="/app/store"]',

  // Etsy off-site ads (pfa-off-site-ads + pfy-toggle)
  offsiteAdsRoot:       'pfa-off-site-ads[data-testid="offsiteAds"]',
  offsiteAdsCheckbox:   'pfa-off-site-ads[data-testid="offsiteAds"] input.toggle-input',
  offsiteAdsClickLabel: 'pfa-off-site-ads[data-testid="offsiteAds"] label.control',
};

// ─── Browser singleton ────────────────────────────────────────────────────────

const productPage = require('./lib/printifyProductPage');
const { SessionExpiredError } = productPage;

let _browser = null;
let _context = null;
/** @type {'session'|'profile'|null} */
let _contextMode = null;

async function getBrowser() {
  if (_context) {
    const b = _context.browser();
    if (b) return b;
  }
  if (_browser && _browser.isConnected()) return _browser;
  return (await getContext()).browser();
}

async function createContext(browser) {
  const baseOptions = {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  };

  let ctx;
  if (fs.existsSync(CONFIG.sessionFile)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CONFIG.sessionFile, 'utf-8'));
      ctx = await browser.newContext({ ...baseOptions, storageState: saved });
      console.log('[offsiteAds] Restored saved Printify session.');
    } catch (e) {
      console.warn('[offsiteAds] Session file invalid, will re-login:', e.message);
    }
  }
  if (!ctx) ctx = await browser.newContext(baseOptions);

  if (process.env.ADS_BLOCK_MEDIA === 'true') {
    await ctx.route('**/*', (route) => {
      const type = route.request().resourceType();
      if (type === 'image' || type === 'font' || type === 'media') {
        return route.abort();
      }
      return route.continue();
    });
  }

  return ctx;
}

async function launchBrowser() {
  const launchOpts = {
    headless: CONFIG.headless,
    slowMo: CONFIG.slowMo,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  };
  try {
    return await chromium.launch({ ...launchOpts, channel: 'chrome' });
  } catch {
    return await chromium.launch(launchOpts);
  }
}

async function getContext() {
  if (_context) return _context;

  const sessionExists = fs.existsSync(CONFIG.sessionFile);
  const useSavedSession =
    _contextMode === 'session' ||
    (_contextMode !== 'profile' && CONFIG.preferSession && sessionExists);

  if (useSavedSession) {
    _browser = await launchBrowser();
    _context = await createContext(_browser);
    console.log('[offsiteAds] Using saved session (storageState).');
    return _context;
  }

  const useProfile =
    _contextMode === 'profile' ||
    (_contextMode !== 'session' && CONFIG.useProfile && fs.existsSync(CONFIG.userDataDir));

  if (useProfile) {
    try {
      const launchOpts = {
        headless: CONFIG.headless,
        slowMo: CONFIG.slowMo,
        viewport: { width: 1440, height: 900 },
        args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
      };
      try {
        _context = await chromium.launchPersistentContext(CONFIG.userDataDir, {
          ...launchOpts,
          channel: 'chrome',
        });
      } catch {
        _context = await chromium.launchPersistentContext(CONFIG.userDataDir, launchOpts);
      }
      console.log('[offsiteAds] Using persistent Chrome profile.');
      return _context;
    } catch (e) {
      console.warn('[offsiteAds] Persistent profile unavailable:', e.message);
    }
  }

  _browser = await launchBrowser();
  _context = await createContext(_browser);
  return _context;
}

/** Warm SPA session before product-detail navigation (bulk sync). */
async function warmSession(page) {
  const { waitForPageReady } = require('./lib/pageReady');
  await waitForPageReady(page, {
    goto: 'https://printify.com/app/dashboard',
    settleMs: parseInt(process.env.PAGE_SETTLE_MS || '6000', 10),
    timeout: CONFIG.timeout,
  });
  await productPage.assertAuthenticated(page, { maxWaitMs: 30000 });
}

async function saveSession(context) {
  const ctx = context || _context;
  if (!ctx) return;
  const state = await ctx.storageState();
  fs.writeFileSync(CONFIG.sessionFile, JSON.stringify(state, null, 2));
}

async function resetBrowserSession() {
  if (_context) {
    await _context.close().catch(() => null);
    _context = null;
  }
  if (_browser) {
    await _browser.close().catch(() => null);
    _browser = null;
  }
}

function setContextMode(mode) {
  _contextMode = mode === 'session' || mode === 'profile' ? mode : null;
}

// ─── Login ────────────────────────────────────────────────────────────────────

async function isDashboardUrl(page) {
  const url = page.url();
  return (
    /printify\.com\/app\//.test(url) &&
    !url.includes('/auth/login') &&
    !url.includes('/app/login')
  );
}

async function isLoggedIn(page) {
  if (productPage.isLoginUrl(page.url())) return false;
  if (await isDashboardUrl(page)) return true;
  if (/\/app\/(dashboard|store|products|product-details)/.test(page.url())) return true;
  return (await page.locator(SELECTORS.loggedInIndicator).count()) > 0;
}

async function getLoginSurface(page) {
  for (const frame of page.frames()) {
    try {
      const n = await frame.locator('input[type="password"]').count();
      if (n > 0) return frame;
    } catch (_) {
      /* cross-origin frame */
    }
  }
  return page;
}

async function findEmailInput(surface) {
  const selectors = SELECTORS.loginEmailInput.split(',').map((s) => s.trim());
  for (const sel of selectors) {
    const loc = surface.locator(sel).first();
    if ((await loc.count()) > 0 && (await loc.isVisible().catch(() => false))) return loc;
  }
  const named = surface.getByRole('textbox', { name: /email/i });
  if ((await named.count()) > 0) return named.first();
  return surface.getByRole('textbox').first();
}

async function dismissOverlays(page) {
  const labels = ['Accept', 'Accept all', 'Got it', 'I agree', 'Allow all'];
  for (const label of labels) {
    const btn = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
    if ((await btn.count()) > 0) {
      await btn.click({ timeout: 3000 }).catch(() => null);
      await sleep(500);
    }
  }
}

async function submitLogin(surface) {
  const candidates = [
    surface.getByRole('button', { name: /^continue$/i }),
    surface.getByRole('button', { name: /^log\s*in$/i }),
    surface.locator('button[type="submit"]'),
    surface.locator('button.button.primary'),
    surface.locator('button[data-testid="button"].primary'),
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

async function loginIfNeeded(page) {
  if (await isLoggedIn(page)) {
    console.log('[offsiteAds] Already logged in.');
    return;
  }

  const { performPrintifyLogin } = require('./lib/printifyLogin');
  const headed = process.env.PLAYWRIGHT_HEADLESS === 'false';

  await performPrintifyLogin(
    page,
    { email: CONFIG.email, password: CONFIG.password },
    { headed, captchaMaxMs: parseInt(process.env.LOGIN_CAPTCHA_MAX_MS || '180000', 10) }
  );

  const state = await page.context().storageState();
  fs.writeFileSync(CONFIG.sessionFile, JSON.stringify(state, null, 2));
  console.log('[offsiteAds] Session saved to', CONFIG.sessionFile);
}

function runVerifySession(mode) {
  return spawnScriptSync('scripts/verifySession.js', { PLAYWRIGHT_VERIFY_MODE: mode });
}

async function ensureSession(options = {}) {
  const strict = options.strict !== false;
  const modes = [];

  if (CONFIG.useProfile && fs.existsSync(CONFIG.userDataDir)) modes.push('profile');
  if (fs.existsSync(CONFIG.sessionFile) && CONFIG.preferSession) modes.push('session');
  if (!modes.length && fs.existsSync(CONFIG.sessionFile)) modes.push('session');

  for (const mode of modes) {
    await resetBrowserSession();
    setContextMode(mode);
    const r = runVerifySession(mode);
    if (r.status === 0) {
      console.log(`[offsiteAds] Session OK (${mode}).`);
      return mode;
    }
    console.warn(`[offsiteAds] ${mode} auth invalid.`);
  }

  await resetBrowserSession();
  setContextMode(null);

  if (strict) {
    throw new Error(
      'No valid Printify session. Run: npm run login:headed  then  node scripts/exportSession.js'
    );
  }

  console.log('[offsiteAds] Attempting automated login...');
  const r = spawnScriptSync('scripts/autoLogin.js');
  if (r.status !== 0) {
    throw new Error(
      'Automated login failed (Cloudflare). Run: npm run login:headed  then  node scripts/exportSession.js'
    );
  }
}

// ─── Core toggle logic ────────────────────────────────────────────────────────

/**
 * Navigates to a Printify product detail page and sets the offsite-ads toggle.
 *
 * @param {string}  productId   - Printify product ID (hex string)
 * @param {boolean} enable      - true = enable ads, false = disable ads
 * @param {object}  [options]
 * @param {number}  [options.retries=3]
 * @returns {Promise<{ productId, previousState, newState, changed }>}
 */
/**
 * Toggle ads using an existing page (bulk sync — no new tab per product).
 * @param {object} [options]
 * @param {boolean} [options.skipLogin] - do not attempt login mid-sync (default true)
 */
async function setOffsiteAdsOnPage(page, productId, enable, options = {}) {
  const skipLogin = options.skipLogin !== false;

  await productPage.prepareProductPage(page, productId, {
    title: options.title,
    viaProductsList: options.viaProductsList,
  });

  if (!skipLogin) {
    await loginIfNeeded(page);
    await productPage.prepareProductPage(page, productId, {
      title: options.title,
      viaProductsList: options.viaProductsList,
    });
  }

  const toggleInfo = await productPage.waitForOffsiteAdsControl(page, CONFIG.timeout);
  if (!toggleInfo.found) {
    await page.screenshot({ path: `debug_${productId}.png`, fullPage: true }).catch(() => null);
    throw new Error(`Toggle not found for ${productId}: ${toggleInfo.reason}`);
  }

  const currentlyEnabled = toggleInfo.checked;
  if (currentlyEnabled === enable) {
    return { productId, previousState: currentlyEnabled, newState: enable, changed: false };
  }

  const networkPromise = page
    .waitForResponse(
      (resp) => {
        const u = resp.url();
        return (
          resp.status() < 400 &&
          ['PUT', 'PATCH', 'POST'].includes(resp.request().method()) &&
          (u.includes('/api/') || u.includes('offsite') || u.includes('product'))
        );
      },
      { timeout: 30000 }
    )
    .catch(() => null);

  await productPage.clickToggle(page);
  await networkPromise;
  await sleep(1500);

  const verifyInfo = await productPage.readToggleState(page);
  const newState = verifyInfo.found ? verifyInfo.checked : enable;

  if (verifyInfo.found && verifyInfo.checked !== enable) {
    throw new Error(`Toggle verify failed for ${productId}: expected ${enable}, got ${verifyInfo.checked}`);
  }

  return {
    productId,
    previousState: currentlyEnabled,
    newState: verifyInfo.found ? verifyInfo.checked : enable,
    changed: true,
  };
}

async function setOffsiteAds(productId, enable, options = {}) {
  const retries = options.retries ?? 3;

  if (options.page) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await setOffsiteAdsOnPage(options.page, productId, enable, options);
      } catch (err) {
        if (attempt === retries) throw err;
        await sleep(5000 * attempt);
      }
    }
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await _setOffsiteAdsOnce(productId, enable);
    } catch (err) {
      console.error(
        `[offsiteAds] Attempt ${attempt}/${retries} failed for product ${productId}: ${err.message}`
      );
      if (attempt === retries) throw err;
      await sleep(5000 * attempt);
    }
  }
}

async function _setOffsiteAdsOnce(productId, enable) {
  const context = await getContext();
  const page = await context.newPage();

  try {
    const productUrl = `https://printify.com/app/product-details/${productId}`;
    console.log(`[offsiteAds] → ${productUrl}`);

    const result = await setOffsiteAdsOnPage(page, productId, enable);
    if (!result.changed) {
      console.log('[offsiteAds] Already in desired state. No action needed.');
    } else {
      console.log(
        `[offsiteAds] ✓ Product ${productId}: ads now ${result.newState ? 'ENABLED' : 'DISABLED'}`
      );
    }
    return result;
  } finally {
    await page.close();
  }
}

// ─── Batch processing ─────────────────────────────────────────────────────────

/**
 * Processes a list of product IDs and sets offsite ads for each.
 * Uses the Printify API to fetch all product IDs automatically if not provided.
 *
 * @param {string[]} productIds  - array of Printify product IDs
 * @param {boolean}  enable      - desired state
 * @param {object}   [options]
 * @param {number}   [options.delayMs=3000] - delay between products (ms)
 * @returns {Promise<Array>}
 */
async function batchSetOffsiteAds(productIds, enable, options = {}) {
  const delayMs = options.delayMs ?? 3000;
  const results = [];

  console.log(`[offsiteAds] Batch ${enable ? 'enabling' : 'disabling'} ads for ${productIds.length} products`);

  const context = await getContext();
  const page = await context.newPage();
  await page.goto('https://printify.com/app/dashboard', { waitUntil: NAV_WAIT, timeout: CONFIG.timeout });
  await loginIfNeeded(page);

  for (let i = 0; i < productIds.length; i++) {
    const id = productIds[i];
    console.log(`\n[offsiteAds] [${i + 1}/${productIds.length}] Processing ${id}`);
    try {
      const result = await setOffsiteAds(id, enable, { ...options, page });
      results.push({ ...result, error: null });
    } catch (err) {
      console.error(`[offsiteAds] ✗ Product ${id} failed: ${err.message}`);
      results.push({ productId: id, error: err.message });
    }

    if (i < productIds.length - 1) await sleep(delayMs);
  }

  await page.close();
  await saveSession(context);

  const succeeded = results.filter((r) => !r.error).length;
  const failed = results.filter((r) => r.error).length;
  console.log(`\n[offsiteAds] Batch complete: ${succeeded} succeeded, ${failed} failed`);

  return results;
}

/**
 * Fetch all published product IDs from Printify API and disable/enable ads.
 * Convenience function for bulk operations on an entire shop.
 *
 * @param {boolean} enable
 * @param {object}  [options]
 */
async function setOffsiteAdsForAllProducts(enable, options = {}) {
  const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
  const shopId = CONFIG.shopId;

  if (!PRINTIFY_API_KEY) throw new Error('PRINTIFY_API_KEY env var not set');

  console.log(`[offsiteAds] Fetching all products for shop ${shopId}...`);
  const allIds = [];
  let page = 1;

  while (true) {
    const resp = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json?limit=50&page=${page}`,
      { headers: { Authorization: `Bearer ${PRINTIFY_API_KEY}` } }
    );
    const data = await resp.json();
    const products = data.data || [];
    if (!products.length) break;
    products.forEach((p) => allIds.push(p.id));
    if (products.length < 50) break;
    page++;
  }

  console.log(`[offsiteAds] Found ${allIds.length} products total`);
  return batchSetOffsiteAds(allIds, enable, options);
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function closeBrowser() {
  if (_context) { await _context.close(); _context = null; }
  if (_browser) { await _browser.close(); _browser = null; }
  console.log('[offsiteAds] Browser closed.');
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Public API ───────────────────────────────────────────────────────────────

module.exports = {
  CONFIG,
  NAV_WAIT,
  SessionExpiredError,
  enableOffsiteAds: (productId, opts) => setOffsiteAds(productId, true, opts),
  disableOffsiteAds: (productId, opts) => setOffsiteAds(productId, false, opts),
  setOffsiteAds,
  setOffsiteAdsOnPage,
  loginIfNeeded,
  isLoggedIn,
  saveSession,
  resetBrowserSession,
  setContextMode,
  ensureSession,
  batchSetOffsiteAds,
  setOffsiteAdsForAllProducts,
  getBrowser,
  getContext,
  warmSession,
  closeBrowser,
};
