'use strict';

const { waitForPageReady, sleep } = require('./pageReady');

function isLoginUrl(url) {
  return /\/auth\/login|\/app\/login(?:\?|$)/.test(url);
}

const PRODUCTS_URLS = [
  'https://printify.com/app/store/products',
  'https://printify.com/app/products',
];

async function dismissUiOverlays(page) {
  const backdrop = page.locator('.cdk-overlay-backdrop');
  if ((await backdrop.count()) > 0) {
    await backdrop.first().click({ timeout: 2000, force: true }).catch(() => null);
    await sleep(400);
  }
  for (const label of ['Got it', 'Close', 'Dismiss', 'Accept']) {
    const btn = page.getByRole('button', { name: new RegExp(label, 'i') }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click({ timeout: 2000 }).catch(() => null);
      await sleep(300);
    }
  }
  await page.keyboard.press('Escape').catch(() => null);
  await sleep(300);
}

async function goToProductsList(page) {
  for (const url of PRODUCTS_URLS) {
    try {
      await waitForPageReady(page, {
        goto: url,
        waitUntil: 'load',
        settleMs: parseInt(process.env.PRODUCT_LIST_SETTLE_MS || '3000', 10),
      });
      await dismissUiOverlays(page);
      if (!isLoginUrl(page.url())) return url;
    } catch (_) {
      /* try next */
    }
  }
  throw new Error('Could not open Printify products list');
}

async function findEtsyProductLink(page, productId, title) {
  const byId = page.locator(`a[href*="${productId}"]`).first();
  if ((await byId.count()) > 0) return byId;

  if (title) {
    const snippet = title.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const byTitle = page.getByRole('link', { name: new RegExp(snippet, 'i') }).first();
    if ((await byTitle.count()) > 0) return byTitle;
  }
  return null;
}

async function searchProductOnList(page, query) {
  const search = page
    .locator('input[type="search"], input[placeholder*="search" i]')
    .first();
  if (!(await search.isVisible().catch(() => false))) return false;
  await dismissUiOverlays(page);
  await search.fill(query.slice(0, 50));
  await sleep(parseInt(process.env.PRODUCT_SEARCH_WAIT_MS || '2500', 10));
  return true;
}

function resolveProductUrl(page, href) {
  if (!href) return null;
  if (href.startsWith('http')) return href.split('?')[0];
  return `https://printify.com${href.startsWith('/') ? '' : '/'}${href}`.split('?')[0];
}

/**
 * Open product: direct URL (fast) or via products list (validates Etsy context).
 */
async function openEtsyProductListing(page, productId, options = {}) {
  const viaList = options.viaProductsList ?? process.env.PRINTIFY_NAV_VIA_PRODUCTS === 'true';
  const directUrl = `https://printify.com/app/product-details/${productId}`;

  if (!viaList) {
    await waitForPageReady(page, {
      goto: directUrl,
      waitUntil: 'load',
      settleMs: parseInt(process.env.PRODUCT_PAGE_SETTLE_MS || '4000', 10),
    });
    await waitForProductDetail(page, productId);
    return { via: 'direct-url' };
  }

  try {
    await goToProductsList(page);
    let link = await findEtsyProductLink(page, productId, options.title);
    if (!link && options.title) {
      await searchProductOnList(page, options.title);
      link = await findEtsyProductLink(page, productId, options.title);
    }

    if (link) {
      await dismissUiOverlays(page);
      const href = await link.getAttribute('href');
      const target = resolveProductUrl(page, href) || directUrl;
      console.log(`[nav] Products list → ${productId}`);
      await waitForPageReady(page, {
        goto: target,
        waitUntil: 'load',
        settleMs: parseInt(process.env.PRODUCT_PAGE_SETTLE_MS || '4000', 10),
      });
      await waitForProductDetail(page, productId);
      return { via: 'products-list' };
    }
  } catch (err) {
    console.warn('[nav] Products list failed, using direct URL:', err.message);
  }

  await waitForPageReady(page, {
    goto: directUrl,
    waitUntil: 'load',
    settleMs: parseInt(process.env.PRODUCT_PAGE_SETTLE_MS || '4000', 10),
  });
  await waitForProductDetail(page, productId);
  return { via: 'direct-url' };
}

async function waitForProductDetail(page, productId) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const url = page.url();
    if (url.includes(productId) && !isLoginUrl(url)) return;
    if (isLoginUrl(url)) break;
    await sleep(400);
  }
  if (isLoginUrl(page.url())) {
    throw new Error('Redirected to login while opening product — refresh session');
  }
}

module.exports = {
  goToProductsList,
  openEtsyProductListing,
  findEtsyProductLink,
  dismissUiOverlays,
};
