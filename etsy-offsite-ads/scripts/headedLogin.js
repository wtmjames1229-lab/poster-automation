#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { loadEnv, validateForPlaywright, pkgRoot } = require('../src/config');
loadEnv();
const { performPrintifyLogin } = require('../src/lib/printifyLogin');
const { waitForPageReady } = require('../src/lib/pageReady');

const email = process.env.PRINTIFY_EMAIL;
const password = process.env.PRINTIFY_PASSWORD;
const sessionFile =
  process.env.PRINTIFY_SESSION_FILE || path.join(pkgRoot, 'printify_session.json');
const userDataDir =
  process.env.PLAYWRIGHT_USER_DATA_DIR || path.join(pkgRoot, 'data', 'chrome-profile');

async function main() {
  validateForPlaywright();
  if (!email || !password) throw new Error('PRINTIFY_EMAIL and PRINTIFY_PASSWORD required');

  fs.mkdirSync(userDataDir, { recursive: true });

  console.log('[headedLogin] Launching Chrome (visible)...');
  const launchOpts = {
    headless: false,
    slowMo: parseInt(process.env.PLAYWRIGHT_SLOW_MO || '80', 10),
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
  };

  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, {
      ...launchOpts,
      channel: 'chrome',
    });
  } catch {
    context = await chromium.launchPersistentContext(userDataDir, launchOpts);
  }

  const page = context.pages()[0] || (await context.newPage());

  try {
    await performPrintifyLogin(page, { email, password });
    await waitForPageReady(page, {
      goto: 'https://printify.com/app/dashboard',
      settleMs: parseInt(process.env.LOGIN_PAGE_SETTLE_MS || '8000', 10),
    });
    fs.writeFileSync(sessionFile, JSON.stringify(await context.storageState(), null, 2));
    console.log('[headedLogin] ✓ Session saved:', path.resolve(sessionFile));
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error('[headedLogin] ✗', err.message);
  process.exit(1);
});
