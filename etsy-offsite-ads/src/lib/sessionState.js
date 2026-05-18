'use strict';

const fs = require('fs');

const WARM_URLS = [
  'https://printify.com/',
  'https://printify.com/app/dashboard',
  'https://printify.com/app/products',
];

const AUTH_COOKIE_HINTS = ['__cf_bm', 'cf_clearance', 'fs_uid', 'AMP_'];

function readSessionFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const state = JSON.parse(raw);
  return state;
}

function validateSessionState(state) {
  const issues = [];
  if (!state || typeof state !== 'object') {
    issues.push('not an object');
    return { ok: false, issues };
  }
  const cookies = state.cookies || [];
  if (!cookies.length) issues.push('no cookies');
  const printifyCookies = cookies.filter(
    (c) => c.domain && String(c.domain).includes('printify.com')
  );
  if (!printifyCookies.length) issues.push('no printify.com cookies');
  const hasAuthHint = printifyCookies.some((c) =>
    AUTH_COOKIE_HINTS.some((h) => c.name && c.name.includes(h))
  );
  if (!hasAuthHint) issues.push('missing common Printify session cookies (may still work)');
  const origins = state.origins || [];
  const printifyOrigin = origins.find((o) => o.origin && o.origin.includes('printify.com'));
  if (!printifyOrigin) issues.push('no printify.com localStorage origin');
  return { ok: issues.length === 0 || (cookies.length > 0 && printifyCookies.length > 0), issues };
}

function minifySession(state) {
  return JSON.stringify(state);
}

function writeSessionFile(filePath, state) {
  const v = validateSessionState(state);
  if (!v.ok) {
    console.warn('[session] Validation warnings:', v.issues.join('; '));
  }
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
  return v;
}

/**
 * Visit key Printify URLs so cookies + localStorage match a real browser session.
 */
async function warmPrintifySession(page, options = {}) {
  const timeout = options.timeoutMs || parseInt(process.env.PLAYWRIGHT_TIMEOUT_MS || '90000', 10);
  const settle = options.settleMs || parseInt(process.env.PAGE_SETTLE_MS || '4000', 10);
  const productId = options.skipProduct
    ? ''
    : (options.productId || process.env.VERIFY_PRODUCT_ID || '').trim();

  for (const url of WARM_URLS) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout }).catch(() => null);
    await page.waitForTimeout(settle);
  }

  if (productId) {
    await page
      .goto(`https://printify.com/app/product-details/${productId}`, {
        waitUntil: 'domcontentloaded',
        timeout,
      })
      .catch(() => null);
    await page.waitForTimeout(settle);
  }
}

function getContextExtras() {
  return {
    userAgent:
      process.env.PLAYWRIGHT_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  };
}

async function applyStealthScripts(context) {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
}

module.exports = {
  readSessionFile,
  validateSessionState,
  minifySession,
  writeSessionFile,
  warmPrintifySession,
  getContextExtras,
  applyStealthScripts,
  WARM_URLS,
};
