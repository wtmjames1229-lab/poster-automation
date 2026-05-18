#!/usr/bin/env node
'use strict';

/** Warm Printify in browser profile, then export printify_session.json for CI. */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { loadEnv } = require('../src/config');
const sessionState = require('../src/lib/sessionState');
const { isLoggedInUrl } = require('../src/lib/printifyLogin');

loadEnv();

const userDataDir =
  process.env.PLAYWRIGHT_USER_DATA_DIR || path.join(__dirname, '..', 'data', 'chrome-profile');
const sessionFile =
  process.env.PRINTIFY_SESSION_FILE || path.join(__dirname, '..', 'printify_session.json');

async function fetchSampleProductId() {
  const key = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID || '18634010';
  if (!key) return (process.env.VERIFY_PRODUCT_ID || '').trim();
  try {
    const res = await fetch(
      `https://api.printify.com/v1/shops/${shopId}/products.json?limit=1&page=1`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return '';
    const data = await res.json();
    return data.data?.[0]?.id || '';
  } catch {
    return '';
  }
}

async function main() {
  const productId = (process.env.VERIFY_PRODUCT_ID || (await fetchSampleProductId()) || '').trim();
  const opts = {
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    ...sessionState.getContextExtras(),
    args: ['--disable-blink-features=AutomationControlled'],
  };

  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, { ...opts, channel: 'chrome' });
  } catch {
    context = await chromium.launchPersistentContext(userDataDir, opts);
  }

  const page = context.pages()[0] || (await context.newPage());

  await sessionState.warmPrintifySession(page, { productId });

  if (!isLoggedInUrl(page.url())) {
    await context.close();
    console.log('NOT_LOGGED_IN', page.url());
    console.log('Run: npm run login');
    process.exit(2);
  }

  const state = await context.storageState();
  sessionState.writeSessionFile(sessionFile, state);
  const v = sessionState.validateSessionState(state);
  console.log(
    'SESSION_EXPORTED',
    path.resolve(sessionFile),
    `cookies=${state.cookies?.length || 0}`,
    v.ok ? 'ok' : `warn:${v.issues.join(',')}`
  );
  await context.close();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
