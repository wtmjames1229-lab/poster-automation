#!/usr/bin/env node
'use strict';

/**
 * One-time manual login — saves printify_session.json for headless runs.
 * A browser window opens; log into Printify, then press Enter in the terminal.
 */

require('dotenv').config();
const { chromium } = require('playwright');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const sessionFile = process.env.PRINTIFY_SESSION_FILE || path.join(__dirname, '..', 'printify_session.json');

async function main() {
  console.log('\n── Save Printify session ──\n');
  console.log('1. A browser will open');
  console.log('2. Log into Printify (email or Google)');
  console.log('3. Wait until you see the dashboard');
  console.log('4. Return here and press Enter\n');

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('https://printify.com/app/auth/login', { waitUntil: 'domcontentloaded' });

  await new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Press Enter after you are logged in... ', () => {
      rl.close();
      resolve();
    });
  });

  const state = await context.storageState();
  fs.writeFileSync(sessionFile, JSON.stringify(state, null, 2));
  console.log('\n✓ Session saved to', sessionFile);
  console.log('  Headless runs can use: npm run ads:off\n');

  await browser.close();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
