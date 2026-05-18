#!/usr/bin/env node
'use strict';

const fs = require('fs');
const { loadEnv } = require('../src/config');
loadEnv();

const {
  CONFIG,
  getContext,
  closeBrowser,
  warmSession,
  isLoggedIn,
  setContextMode,
} = require('../src/offsiteAds');
const { openEtsyProductListing } = require('../src/lib/printifyProductsNav');
const { isLoginUrl } = require('../src/lib/printifyProductPage');

const productId = (process.env.VERIFY_PRODUCT_ID || '').trim();
const viaList =
  process.env.PRINTIFY_NAV_VIA_PRODUCTS === 'true' || !!process.env.GITHUB_ACTIONS;

async function main() {
  const mode = process.env.PLAYWRIGHT_VERIFY_MODE;
  if (mode === 'session' || mode === 'profile') setContextMode(mode);

  if (mode === 'session' && !fs.existsSync(CONFIG.sessionFile)) {
    console.log('NO_SESSION_FILE');
    process.exit(2);
  }
  if (mode === 'profile' && !fs.existsSync(CONFIG.userDataDir)) {
    console.log('NO_PROFILE');
    process.exit(2);
  }

  const { warmPrintifySession } = require('../src/lib/sessionState');

  const context = await getContext();
  const page = await context.newPage();
  try {
    if (process.env.GITHUB_ACTIONS) {
      await warmPrintifySession(page, { skipProduct: true });
    } else {
      await warmSession(page);
    }
    let ok = await isLoggedIn(page);

    await page.goto('https://printify.com/app/products', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(parseInt(process.env.PAGE_SETTLE_MS || '5000', 10));
    const productsUrl = page.url();
    const productsOk = (await isLoggedIn(page)) && !isLoginUrl(productsUrl);
    console.log('[verify] products page:', productsUrl, productsOk ? 'OK' : 'FAIL');
    ok = ok && productsOk;

    if (productId && productsOk) {
      try {
        await openEtsyProductListing(page, productId, { viaProductsList: viaList });
        await page.waitForTimeout(3000);
      } catch (err) {
        console.log('PRODUCT_OPEN_FAILED', productId, err.message);
      }
      const detailUrl = page.url();
      const onProduct =
        detailUrl.includes('product-details') && !isLoginUrl(detailUrl);
      if (!onProduct) {
        console.log('PRODUCT_CHECK_FAILED', productId);
        console.log('URL:', detailUrl);
        console.log('[verify] nav:', viaList ? 'products-list' : 'direct-url');
      }
      ok = ok && onProduct;
    } else if (productId && !productsOk) {
      console.log('PRODUCT_CHECK_SKIPPED (not logged in on products list)');
    }

    console.log(ok ? 'SESSION_OK' : 'SESSION_EXPIRED');
    if (!ok && !productId) console.log('URL:', page.url());
    process.exit(ok ? 0 : 3);
  } finally {
    await page.close().catch(() => null);
    await closeBrowser();
  }
}

main().catch(() => process.exit(1));
