'use strict';

const {
  getContext,
  closeBrowser,
  resetBrowserSession,
  saveSession,
  setOffsiteAdsOnPage,
  warmSession,
  CONFIG,
} = require('./offsiteAds');
const jobStore = require('./adsJobStore');
const syncLogger = require('./lib/syncLogger');
const { isSessionError } = require('./lib/errors');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function jitter(ms, spread = 0.25) {
  const delta = ms * spread * (Math.random() * 2 - 1);
  return Math.max(500, Math.floor(ms + delta));
}

function formatEta(done, total, msPerItem) {
  const left = total - done;
  const min = Math.round((left * msPerItem) / 60000);
  if (min < 1) return '<1 min';
  if (min < 60) return `~${min} min`;
  return `~${(min / 60).toFixed(1)} h`;
}

function printProgress(stats, index, total, msPerItem) {
  const pct = total ? ((index / total) * 100).toFixed(1) : '0';
  const eta = formatEta(index, total, msPerItem);
  process.stdout.write(
    `\r[sync] ${index}/${total} (${pct}%) | done ${stats.done} | ` +
    `fail ${stats.failed} | changed ${stats.changed} | unchanged ${stats.unchanged} | ETA ${eta}   `
  );
}

async function refreshSessionContext() {
  await resetBrowserSession();
  const context = await getContext();
  const page = context.pages()[0] || (await context.newPage());
  await warmSession(page);
  return { context, page };
}

async function runAdsSync(options) {
  const {
    enable,
    productIds,
    job,
    jobFile,
    delayMs = parseInt(process.env.ADS_SYNC_DELAY_MS || '1500', 10),
    checkpointEvery = parseInt(process.env.ADS_SYNC_CHECKPOINT_EVERY || '5', 10),
    sessionRefreshEvery = parseInt(process.env.ADS_SYNC_SESSION_EVERY || '15', 10),
    browserRestartEvery = parseInt(process.env.ADS_SYNC_BROWSER_RESTART_EVERY || '80', 10),
    maxRetries = parseInt(process.env.ADS_SYNC_MAX_RETRIES || '3', 10),
    maxConsecutiveFailures = parseInt(process.env.ADS_SYNC_MAX_CONSECUTIVE_FAILURES || '5', 10),
    onProductDone,
    onProgress,
  } = options;

  let interrupted = false;
  const onSigInt = () => {
    interrupted = true;
    console.log('\n[sync] Interrupt received — saving job after current product...');
  };
  process.once('SIGINT', onSigInt);

  let { context, page } = await refreshSessionContext();
  let processedInSession = 0;
  let consecutiveFailures = 0;
  const timings = [];
  let index = 0;
  const total = productIds.length;

  console.log(`[sync] Starting bulk sync: ${total} products → ads ${enable ? 'ON' : 'OFF'}`);
  console.log(
    `[sync] delay=${delayMs}ms checkpoint=${checkpointEvery} sessionEvery=${sessionRefreshEvery} ` +
    `browserRestart=${browserRestartEvery}`
  );

  for (const productId of productIds) {
    if (interrupted || options.shouldAbort?.()) break;

    index++;
    let success = false;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const meta = job?.products?.[productId];
        const result = await setOffsiteAdsOnPage(page, productId, enable, {
          skipLogin: true,
          title: meta?.title,
          viaProductsList: process.env.PRINTIFY_NAV_VIA_PRODUCTS === 'true',
        });
        jobStore.markDone(job, productId, result);
        syncLogger.log('info', 'product_done', {
          productId,
          changed: result.changed,
          index,
          total,
        });
        success = true;
        consecutiveFailures = 0;
        break;
      } catch (err) {
        lastError = err;
        jobStore.incrementAttempt(job, productId);
        console.log(`\n[sync] ${productId} attempt ${attempt}/${maxRetries}: ${err.message}`);

        if (isSessionError(err) && attempt === 1) {
          console.log('[sync] Session issue — reloading browser context...');
          ({ context, page } = await refreshSessionContext());
          processedInSession = 0;
        } else if (attempt < maxRetries) {
          await sleep(jitter(2000 * attempt));
          await page.goto('https://printify.com/app/dashboard', {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          }).catch(() => null);
        }
      }
    }

    if (!success) {
      const errMsg = lastError?.message || 'unknown error';
      jobStore.markFailed(job, productId, errMsg);
      syncLogger.log('error', 'product_failed', { productId, error: errMsg, index, total });
      consecutiveFailures++;
    }

    processedInSession++;
    const t0 = timings.length ? timings[timings.length - 1] : 10000;
    timings.push(success ? Math.max(4000, t0 * 0.92) : t0);
    const avgMs = timings.reduce((a, b) => a + b, 0) / timings.length;
    printProgress(job.stats, index, total, avgMs);

    if (onProductDone) onProductDone(job, productId, success);
    job.stats = jobStore.computeStats(job.products);

    if (onProgress) {
      onProgress({
        index,
        total,
        productId,
        title: job.products[productId]?.title,
        success,
        error: success ? null : lastError?.message,
        stats: { ...job.stats },
        eta: formatEta(index, total, avgMs),
        interrupted,
      });
    }

    if (options.shouldAbort?.()) {
      interrupted = true;
    }

    if (processedInSession % checkpointEvery === 0) {
      jobStore.saveJob(job, jobFile);
      await saveSession(context).catch(() => null);
    }

    if (processedInSession % sessionRefreshEvery === 0) {
      await saveSession(context).catch(() => null);
    }

    if (processedInSession >= browserRestartEvery && index < total && !interrupted) {
      console.log('\n[sync] Browser restart (memory hygiene)...');
      await page.close().catch(() => null);
      ({ context, page } = await refreshSessionContext());
      processedInSession = 0;
    }

    if (consecutiveFailures >= maxConsecutiveFailures) {
      console.log(`\n[sync] ${maxConsecutiveFailures} failures in a row — pause 45s, then continue...`);
      await sleep(45000);
      consecutiveFailures = 0;
      await page.close().catch(() => null);
      ({ context, page } = await refreshSessionContext());
      processedInSession = 0;
    }

    if (index < total && !interrupted) await sleep(jitter(delayMs));
  }

  process.off('SIGINT', onSigInt);
  jobStore.saveJob(job, jobFile);
  await saveSession(context).catch(() => null);
  await page.close().catch(() => null);
  await closeBrowser();

  console.log('\n');
  return { job, interrupted };
}

module.exports = { runAdsSync };
