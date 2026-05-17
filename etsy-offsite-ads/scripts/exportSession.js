#!/usr/bin/env node
'use strict';

/** Export printify_session.json from persistent Chrome profile (must be logged in). */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const userDataDir =
  process.env.PLAYWRIGHT_USER_DATA_DIR || path.join(__dirname, '..', 'data', 'chrome-profile');
const sessionFile =
  process.env.PRINTIFY_SESSION_FILE || path.join(__dirname, '..', 'printify_session.json');
const testProductId = process.env.VERIFY_PRODUCT_ID || '6a08463f315e8641c5061426';

function isLoggedInUrl(url) {
  return url.includes('/app/') && !/\/auth\/login|\/app\/login/.test(url);
}

async function main() {
  const opts = { headless: true, viewport: { width: 1440, height: 900 } };
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, { ...opts, channel: 'chrome' });
  } catch {
    context = await chromium.launchPersistentContext(userDataDir, opts);
  }

  const page = context.pages()[0] || (await context.newPage());

  await page.goto('https://printify.com/app/dashboard', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 3000));

  if (!isLoggedInUrl(page.url())) {
    await context.close();
    console.log('NOT_LOGGED_IN', page.url());
    process.exit(2);
  }

  const productUrl = `https://printify.com/app/product-details/${testProductId}`;
  await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 4000));

  if (!page.url().includes('product-details') || !isLoggedInUrl(page.url())) {
    await context.close();
    console.log('NOT_LOGGED_IN_PRODUCT', page.url());
    process.exit(2);
  }

  fs.writeFileSync(sessionFile, JSON.stringify(await context.storageState(), null, 2));
  console.log('SESSION_EXPORTED', path.resolve(sessionFile));
  await context.close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
