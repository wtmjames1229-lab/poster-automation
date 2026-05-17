'use strict';

const { sleep } = require('./pageReady');

function captchaTextVisible(text) {
  const t = (text || '').toLowerCase();
  return (
    t.includes('verify you are human') ||
    t.includes('checking your browser') ||
    t.includes('just a moment') ||
    t.includes('attention required') ||
    t.includes('cf-turnstile')
  );
}

async function isCaptchaVisible(page) {
  const body = await page.locator('body').innerText().catch(() => '');
  if (captchaTextVisible(body)) return true;

  for (const sel of [
    'iframe[src*="challenges.cloudflare.com"]',
    'iframe[src*="turnstile"]',
    '#cf-turnstile',
    '[class*="turnstile"]',
  ]) {
    if ((await page.locator(sel).count()) > 0) return true;
  }
  return false;
}

/**
 * Try clicking Cloudflare Turnstile / human checkbox (headed + persistent profile).
 */
async function attemptHumanVerification(page) {
  await sleep(2000);

  const selectors = [
    'iframe[src*="challenges.cloudflare.com"]',
    'iframe[src*="turnstile"]',
    'iframe[title*="Widget"]',
    'iframe[title*="challenge"]',
  ];

  for (const sel of selectors) {
    const count = await page.locator(sel).count().catch(() => 0);
    for (let i = 0; i < count; i++) {
      const frame = page.frameLocator(sel).nth(i);
      const targets = [
        frame.locator('input[type="checkbox"]'),
        frame.locator('[role="checkbox"]'),
        frame.locator('label'),
        frame.locator('body'),
      ];
      for (const t of targets) {
        try {
          if ((await t.count()) > 0) {
            await t.first().click({ timeout: 12000, force: true });
            await sleep(5000);
            return true;
          }
        } catch (_) {
          /* try next */
        }
      }
    }
  }

  for (const frame of page.frames()) {
    try {
      const url = frame.url();
      if (!url || (!url.includes('cloudflare') && !url.includes('turnstile'))) continue;
      const clicked = await frame.evaluate(() => {
        const cb = document.querySelector('input[type="checkbox"], [role="checkbox"]');
        if (cb) {
          cb.click();
          return true;
        }
        const label = document.querySelector('label');
        if (label) {
          label.click();
          return true;
        }
        return false;
      });
      if (clicked) {
        await sleep(5000);
        return true;
      }
    } catch (_) {
      /* cross-origin */
    }
  }

  const pageCheckbox = page.getByRole('checkbox', { name: /human|verify/i });
  if ((await pageCheckbox.count()) > 0) {
    await pageCheckbox.first().click({ timeout: 8000 }).catch(() => null);
    await sleep(4000);
    return true;
  }

  return false;
}

/**
 * Wait until Cloudflare challenge text / widgets are gone (or timeout).
 */
async function waitForCaptchaCleared(page, maxMs) {
  const deadline = Date.now() + (maxMs ?? parseInt(process.env.LOGIN_CAPTCHA_MAX_MS || '180000', 10));
  let attempts = 0;

  while (Date.now() < deadline) {
    if (!(await isCaptchaVisible(page))) {
      await sleep(2000);
      if (!(await isCaptchaVisible(page))) return true;
    }

    attempts++;
    if (attempts % 3 === 0) {
      console.log('[captcha] Still waiting — complete verification in the browser if shown...');
    }
    await attemptHumanVerification(page);
    await sleep(3000);
  }

  return !(await isCaptchaVisible(page));
}

/**
 * After credentials are filled: handle captcha, then submit when clear.
 */
async function handleCaptchaThenSubmit(page, submitFn, options = {}) {
  const captchaMax = options.captchaMaxMs ?? parseInt(process.env.LOGIN_CAPTCHA_MAX_MS || '180000', 10);
  const postSubmitSettle = options.postSubmitSettleMs ?? parseInt(process.env.LOGIN_POST_SUBMIT_MS || '8000', 10);

  console.log(`[login] Waiting for page / captcha (up to ${Math.round(captchaMax / 1000)}s)...`);
  await waitForCaptchaCleared(page, captchaMax);

  if (await isCaptchaVisible(page)) {
    console.log('[login] Captcha may still be visible — trying submit anyway...');
  }

  await sleep(1500);
  await submitFn();
  await sleep(postSubmitSettle);

  if (await isCaptchaVisible(page)) {
    console.log('[login] Post-submit captcha — waiting again...');
    await waitForCaptchaCleared(page, captchaMax);
  }
}

module.exports = {
  isCaptchaVisible,
  attemptHumanVerification,
  waitForCaptchaCleared,
  handleCaptchaThenSubmit,
  captchaTextVisible,
};
