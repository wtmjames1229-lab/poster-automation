#!/usr/bin/env node
'use strict';

/**
 * Set-and-forget watch mode:
 *   - First run: toggle all Etsy-published products to target ads state
 *   - Later runs: only new (or failed) products
 *   - Email on missing secrets, session expiry, or run failures
 *
 * Does not modify manual bulk job (data/ads-sync-job.json).
 */

const path = require('path');
const { loadEnv, validateForApi, validateForPlaywright, paths } = require('./config');
loadEnv();

const watchStore = require('./watch/watchStore');
const watchLock = require('./watch/watchLock');
const jobStore = require('./adsJobStore');
const { runAdsSync } = require('./adsSyncEngine');
const {
  SHOP_ID,
  fetchAllShopProducts,
  filterEtsyPublished,
} = require('./printifyShop');
const { ensureSession, closeBrowser, resetBrowserSession } = require('./offsiteAds');
const { isSessionError } = require('./lib/errors');
const mailer = require('./lib/mailer');

const WATCH_JOB_FILE =
  process.env.ADS_WATCH_JOB_FILE ||
  path.join(paths.getUserDataRoot(), 'data', 'ads-watch-job.json');

const WATCH_STATE_FILE = watchStore.DEFAULT_PATH;

function flag(name) {
  return process.argv.includes(name);
}

function optNum(name, def) {
  const eq = process.argv.find((a) => a.startsWith(name + '='));
  if (eq) return parseInt(eq.split('=')[1], 10);
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
    return parseInt(process.argv[i + 1], 10);
  }
  return def;
}

function getTargetEnable() {
  return process.env.OFFSITE_ADS_ENABLED === 'true';
}

function checkSecrets() {
  const missing = [];
  try {
    validateForApi();
  } catch (e) {
    missing.push('PRINTIFY_API_KEY');
  }
  try {
    validateForPlaywright();
  } catch (e) {
    if (!process.env.PRINTIFY_EMAIL?.trim()) missing.push('PRINTIFY_EMAIL');
    if (!process.env.PRINTIFY_PASSWORD?.trim()) missing.push('PRINTIFY_PASSWORD');
  }
  if (!process.env.PRINTIFY_SHOP_ID?.trim() && !SHOP_ID) missing.push('PRINTIFY_SHOP_ID');
  return missing;
}

function printUsage() {
  console.log(`
Etsy off-site ads — automatic watch (set-and-forget)

  node src/adsWatch.js              Run watch (initial full sync, then new products only)
  node src/adsWatch.js --dry-run    Show queue without toggling
  node src/adsWatch.js --status     Show watch registry stats
  node src/adsWatch.js --help

Options:
  --limit N           Process at most N products this run
  --no-retry-failed   Skip products marked failed in watch state
  --force-initial     Re-queue all Etsy products (does not clear registry)

Env:
  OFFSITE_ADS_ENABLED=true|false   Target ads state (default: false = disable ads)
  ADS_WATCH_RETRY_FAILED=true      Retry failed on next run (default true)
  ADS_WATCH_NOTIFY_ON_SUCCESS=false  Email when run succeeds with work done

Mail (optional but recommended for CI):
  MAIL_TO, MAIL_FROM
  SENDGRID_API_KEY  OR  MAIL_SMTP_HOST, MAIL_SMTP_USER, MAIL_SMTP_PASS

State: ${WATCH_STATE_FILE}
Job:   ${WATCH_JOB_FILE}
`);
}

async function fetchEtsyCatalog() {
  const canvasOnly = process.env.ADS_WATCH_CANVAS_ONLY === 'true';
  const all = await fetchAllShopProducts();
  const etsy = filterEtsyPublished(all, { canvasOnly });
  return etsy.map((p) => ({
    id: p.id,
    title: p.title,
    etsyId: Array.isArray(p.external) ? p.external[0]?.id : p.external?.id,
  }));
}

function buildWatchJob(products, targetEnable, canvasOnly) {
  return jobStore.createJob({
    shopId: SHOP_ID,
    targetEnable,
    products,
    canvasOnly,
  });
}

async function verifySessionOrNotify() {
  try {
    await ensureSession({ strict: true });
    await resetBrowserSession().catch(() => null);
    return true;
  } catch (err) {
    const detail = err.message || String(err);
    console.error('[watch] Session invalid:', detail);
    await mailer.notifySessionExpired(detail);
    return false;
  }
}

function printStatus(state) {
  const stats = watchStore.computeStats(state);
  console.log('\n' + '═'.repeat(60));
  console.log('  ADS WATCH STATUS');
  console.log('═'.repeat(60));
  console.log(`  Shop              : ${state.shopId}`);
  console.log(`  Target ads        : ${state.targetEnable ? 'ON' : 'OFF'}`);
  console.log(`  Initial sync done : ${state.initialSyncComplete}`);
  console.log(`  Registered        : ${stats.registered} (done ${stats.done}, failed ${stats.failed})`);
  console.log(`  Last run          : ${state.lastRunAt || '—'}`);
  console.log(`  Last success      : ${state.lastSuccessAt || '—'}`);
  if (state.lastRunSummary) {
    const s = state.lastRunSummary;
    console.log(`  Last summary      : queued=${s.queued} failed=${s.failed} mode=${s.mode}`);
  }
  console.log(`  State file        : ${WATCH_STATE_FILE}`);
  console.log('');
}

async function runWatch() {
  const dryRun = flag('--dry-run');
  const limit = optNum('--limit', 0);
  const retryFailed = !flag('--no-retry-failed') && process.env.ADS_WATCH_RETRY_FAILED !== 'false';
  const forceInitial = flag('--force-initial');
  const targetEnable = getTargetEnable();
  const started = Date.now();

  const missing = checkSecrets();
  if (missing.length) {
    console.error('[watch] Missing configuration:', missing.join(', '));
    await mailer.notifySecretsMissing(missing);
    process.exit(2);
  }

  const releaseLock = watchLock.acquire();
  try {
    let state = watchStore.getOrCreateState({
      shopId: SHOP_ID,
      targetEnable,
      filePath: WATCH_STATE_FILE,
    });

    if (forceInitial) {
      state.initialSyncComplete = false;
      watchStore.saveState(state, WATCH_STATE_FILE);
    }

    console.log('[watch] Fetching Etsy-published catalog from Printify API...');
    const catalog = await fetchEtsyCatalog();
    console.log(`[watch] ${catalog.length} Etsy listing(s) in shop ${SHOP_ID}`);

    watchStore.pruneOrphans(
      state,
      catalog.map((p) => p.id)
    );

    const { queue, mode, reasons } = watchStore.findQueue(state, catalog, { retryFailed });
    let work = queue;
    if (limit > 0) work = work.slice(0, limit);

    console.log(`[watch] Mode: ${mode}`, reasons);
    console.log(`[watch] Queue: ${work.length} product(s) to process`);

    if (dryRun) {
      work.slice(0, 30).forEach((p) => console.log(`  - ${p.id}  ${(p.title || '').slice(0, 50)}`));
      if (work.length > 30) console.log(`  ... and ${work.length - 30} more`);
      return;
    }

    if (!work.length) {
      const summary = {
        ok: true,
        mode,
        targetEnable,
        shopId: SHOP_ID,
        catalogCount: catalog.length,
        queued: 0,
        processed: 0,
        changed: 0,
        unchanged: 0,
        failed: 0,
        durationSec: Math.round((Date.now() - started) / 1000),
      };
      watchStore.recordRun(state, summary);
      watchStore.saveState(state, WATCH_STATE_FILE);
      console.log('[watch] Nothing to do — all products up to date.');
      if (process.env.ADS_WATCH_NOTIFY_ON_SUCCESS === 'true') {
        await mailer.notifyRunSummary(summary);
      }
      return;
    }

    if (work[0]?.id) {
      process.env.VERIFY_PRODUCT_ID = work[0].id;
    }

    const sessionOk = await verifySessionOrNotify();
    if (!sessionOk) {
      process.exit(3);
    }

    const job = buildWatchJob(work, targetEnable, process.env.ADS_WATCH_CANVAS_ONLY === 'true');
    jobStore.saveJob(job, WATCH_JOB_FILE);

    const productIds = work.map((p) => p.id);
    console.log(`[watch] Processing ${productIds.length} product(s) → ads ${targetEnable ? 'ON' : 'OFF'}`);

    let runError = null;
    let finalJob = job;

    try {
      await ensureSession({ strict: true });
      const result = await runAdsSync({
        enable: targetEnable,
        productIds,
        job,
        jobFile: WATCH_JOB_FILE,
        delayMs: parseInt(process.env.ADS_WATCH_DELAY_MS || process.env.ADS_SYNC_DELAY_MS || '1800', 10),
        checkpointEvery: parseInt(process.env.ADS_WATCH_CHECKPOINT_EVERY || '5', 10),
        onProgress: (p) => {
          if (p.index % 10 === 0 || p.index === p.total) {
            console.log(
              `[watch] ${p.index}/${p.total} done=${p.stats.done} fail=${p.stats.failed} ` +
                `changed=${p.stats.changed}`
            );
          }
        },
      });
      finalJob = result.job;
    } catch (err) {
      runError = err;
      if (isSessionError(err)) {
        await mailer.notifySessionExpired(err.message);
        process.exit(3);
      }
      throw err;
    } finally {
      await closeBrowser().catch(() => null);
    }

    for (const p of work) {
      const entry = finalJob.products[p.id];
      const meta = { title: p.title, etsyId: p.etsyId };
      if (entry?.status === jobStore.STATUS.DONE) {
        watchStore.markDone(state, p.id, {
          changed: entry.changed,
          newState: entry.newState,
        }, meta);
      } else if (entry?.status === jobStore.STATUS.FAILED) {
        watchStore.markFailed(state, p.id, entry.lastError || 'unknown', meta);
      }
    }

    const failedIds = work
      .filter((p) => finalJob.products[p.id]?.status === jobStore.STATUS.FAILED)
      .map((p) => p.id);

    const stats = finalJob.stats;
    const summary = {
      ok: stats.failed === 0 && !runError,
      mode,
      targetEnable,
      shopId: SHOP_ID,
      catalogCount: catalog.length,
      queued: work.length,
      processed: stats.done + stats.failed,
      changed: stats.changed,
      unchanged: stats.unchanged,
      failed: stats.failed,
      failedIds,
      durationSec: Math.round((Date.now() - started) / 1000),
    };

    const registry = watchStore.computeStats(state);
    if (
      !state.initialSyncComplete &&
      catalog.length > 0 &&
      registry.done >= catalog.length &&
      summary.failed === 0
    ) {
      state.initialSyncComplete = true;
      console.log('[watch] Initial sync marked complete for shop catalog.');
    }

    watchStore.recordRun(state, summary);
    watchStore.saveState(state, WATCH_STATE_FILE);

    console.log('\n[watch] Run complete:', JSON.stringify(summary, null, 2));

    if (summary.failed > 0 || runError) {
      await mailer.notifyRunSummary(summary);
      process.exit(1);
    }

    if (summary.queued > 0 && process.env.ADS_WATCH_NOTIFY_ON_SUCCESS === 'true') {
      await mailer.notifyRunSummary(summary);
    }
  } finally {
    releaseLock();
  }
}

async function main() {
  if (flag('--help') || flag('-h')) {
    printUsage();
    return;
  }

  if (flag('--status')) {
    const state = watchStore.loadState(WATCH_STATE_FILE);
    if (!state) {
      console.log('No watch state yet. Run: node src/adsWatch.js');
      return;
    }
    printStatus(state);
    return;
  }

  await runWatch();
}

main().catch(async (err) => {
  console.error('[watch] Fatal:', err.message);
  await mailer.sendMail({
    subject: 'CRITICAL — Watch crashed',
    text: `Unhandled error:\n\n${err.stack || err.message}`,
    category: 'crash',
  });
  process.exit(1);
});
