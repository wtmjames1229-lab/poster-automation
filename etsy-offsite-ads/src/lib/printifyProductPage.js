'use strict';

const { waitForPageReady, sleep } = require('./pageReady');
const { openEtsyProductListing } = require('./printifyProductsNav');

class SessionExpiredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SessionExpiredError';
    this.code = 'SESSION_EXPIRED';
  }
}

/** Printify Etsy off-site ads component (2025 UI). */
const OFFSITE = {
  section: '.preferences-ads, pfa-off-site-ads[data-testid="offsiteAds"]',
  root: 'pfa-off-site-ads[data-testid="offsiteAds"]',
  container: '[data-testid="offsiteAds"].offsite-ads-section, .offsite-ads-toggle-container',
  checkbox:
    'pfa-off-site-ads[data-testid="offsiteAds"] input.toggle-input, ' +
    '.preferences-ads input.toggle-input, ' +
    '.offsite-ads-toggle-container input[type="checkbox"]',
  clickLabel: 'pfa-off-site-ads[data-testid="offsiteAds"] label.control',
  clickToggle: 'pfa-off-site-ads[data-testid="offsiteAds"] span.toggle-toggle',
  heading: '.preferences-ads strong, pfa-off-site-ads[data-testid="offsiteAds"]',
};

function isLoginUrl(url) {
  return /\/auth\/login|\/app\/login(?:\?|$)/.test(url);
}

function offsiteCheckbox(page) {
  return page.locator(OFFSITE.checkbox).first();
}

function offsiteClickTarget(page) {
  const label = page.locator(OFFSITE.clickLabel).first();
  if (label) return label;
  return page.locator(OFFSITE.clickToggle).first();
}

async function assertAuthenticated(page, options = {}) {
  const maxWaitMs = options.maxWaitMs || 20000;
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    const url = page.url();
    if (isLoginUrl(url)) {
      await sleep(1000);
      continue;
    }
    const onApp = /printify\.com\/app\//.test(url);
    const onLoginForm = await page.locator('input[type="password"]').isVisible().catch(() => false);
    if (onApp && !onLoginForm) return;
    await sleep(1000);
  }

  if (isLoginUrl(page.url())) {
    throw new SessionExpiredError(
      'Redirected to Printify login — refresh session (npm run login:headed && npm run session:export)'
    );
  }
}

async function dismissProductModals(page) {
  const closeSelectors = [
    page.getByRole('button', { name: /^close$/i }),
    page.locator('button[aria-label="Close"]'),
    page.locator('.cdk-overlay-backdrop'),
  ];
  for (const loc of closeSelectors) {
    const btn = loc.first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ timeout: 2000, force: true }).catch(() => null);
      await sleep(400);
    }
  }
}

async function openPricingSection(page) {
  const pricingTab = page.getByRole('tab', { name: /pricing/i }).first();
  if (await pricingTab.isVisible().catch(() => false)) {
    await pricingTab.click({ timeout: 8000 }).catch(() => null);
    await sleep(2000);
  }
}

/** Wait for Angular offsite-ads component to mount. */
async function waitForOffsiteComponent(page, timeoutMs = 45000) {
  const root = page.locator(OFFSITE.root).first();
  try {
    await root.waitFor({ state: 'visible', timeout: timeoutMs });
    return true;
  } catch {
    const section = page.locator(OFFSITE.section).first();
    try {
      await section.waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }
}

/** Scroll until preferences-ads / offsiteAds test id is visible. */
async function scrollToOffsiteAdsToggle(page) {
  await openPricingSection(page);

  if (await waitForOffsiteComponent(page, 15000)) {
    const section = page.locator(OFFSITE.section).first();
    await section.scrollIntoViewIfNeeded().catch(() => null);
    await sleep(800);
    if ((await offsiteCheckbox(page).count()) > 0) return true;
  }

  const maxScrolls = parseInt(process.env.PRODUCT_SCROLL_STEPS || '25', 10);
  for (let i = 0; i < maxScrolls; i++) {
    const cb = offsiteCheckbox(page);
    if ((await cb.count()) > 0 && (await cb.isVisible().catch(() => false))) {
      await cb.scrollIntoViewIfNeeded().catch(() => null);
      return true;
    }
    await page.mouse.wheel(0, 500);
    await sleep(300);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(800);
  return (await offsiteCheckbox(page).count()) > 0;
}

async function readToggleState(page) {
  await scrollToOffsiteAdsToggle(page);

  const checkbox = offsiteCheckbox(page);
  if ((await checkbox.count()) > 0) {
    try {
      await checkbox.waitFor({ state: 'attached', timeout: 5000 });
      return { found: true, checked: await checkbox.isChecked(), via: 'toggle-input' };
    } catch (_) {
      /* fall through */
    }
  }

  return page.evaluate((sel) => {
    const root =
      document.querySelector('pfa-off-site-ads[data-testid="offsiteAds"]') ||
      document.querySelector('.preferences-ads');
    if (!root) return { found: false, reason: 'offsite component not in DOM' };

    const input =
      root.querySelector('input.toggle-input') ||
      root.querySelector('input[type="checkbox"]');
    if (input) return { found: true, checked: input.checked, via: 'dom' };

    return { found: false, reason: 'checkbox not in offsite component' };
  }, OFFSITE);
}

async function clickToggle(page) {
  await scrollToOffsiteAdsToggle(page);

  const checkbox = offsiteCheckbox(page);
  if ((await checkbox.count()) === 0) {
    throw new Error('Etsy off-site ads toggle not found (data-testid=offsiteAds)');
  }

  await checkbox.scrollIntoViewIfNeeded().catch(() => null);
  const wasChecked = await checkbox.isChecked();

  const label = page.locator(OFFSITE.clickLabel).first();
  if ((await label.count()) > 0) {
    await label.click({ timeout: 10000 });
  } else {
    const toggleSpan = page.locator(OFFSITE.clickToggle).first();
    if ((await toggleSpan.count()) > 0) {
      await toggleSpan.click({ timeout: 10000 });
    } else {
      await checkbox.click({ timeout: 10000, force: true });
    }
  }

  await sleep(1000);

  const nowChecked = await checkbox.isChecked().catch(() => wasChecked);
  if (nowChecked === wasChecked) {
    await page.evaluate(() => {
      const root = document.querySelector('pfa-off-site-ads[data-testid="offsiteAds"]');
      const input = root?.querySelector('input.toggle-input, input[type="checkbox"]');
      if (input) input.click();
    });
    await sleep(800);
  }
}

async function waitForOffsiteAdsControl(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastReason = 'timeout';

  while (Date.now() < deadline) {
    await assertAuthenticated(page, { maxWaitMs: 8000 });
    const info = await readToggleState(page);
    if (info.found) return info;
    lastReason = info.reason || lastReason;
    await sleep(1200);
  }

  return { found: false, reason: lastReason };
}

async function prepareProductPage(page, productId, options = {}) {
  if (!/\/printify\.com\/app\//.test(page.url()) || isLoginUrl(page.url())) {
    await waitForPageReady(page, {
      goto: 'https://printify.com/app/dashboard',
      settleMs: parseInt(process.env.PRODUCT_PAGE_SETTLE_MS || '4000', 10),
    });
    await assertAuthenticated(page, { maxWaitMs: 25000 });
  }

  await openEtsyProductListing(page, productId, {
    title: options.title,
    viaProductsList: options.viaProductsList,
  });

  await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => null);
  await sleep(parseInt(process.env.PRODUCT_PAGE_SETTLE_MS || '4000', 10));
  await dismissProductModals(page);
  await waitForOffsiteComponent(page, 60000);
  await scrollToOffsiteAdsToggle(page);
}

module.exports = {
  SessionExpiredError,
  OFFSITE,
  assertAuthenticated,
  prepareProductPage,
  openPricingSection,
  scrollToOffsiteAdsToggle,
  waitForOffsiteAdsControl,
  readToggleState,
  clickToggle,
  isLoginUrl,
};
