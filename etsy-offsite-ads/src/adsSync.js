#!/usr/bin/env node
/**
 * Full-store Etsy offsite ads sync (resumable, checkpointed).
 *
 * Usage:
 *   npm run ads:sync:off              Disable ads for entire Etsy catalog
 *   npm run ads:sync:on               Enable ads for entire Etsy catalog
 *   npm run ads:sync:status             Show job progress
 *   node adsSync.js --off --resume      Continue interrupted job
 *   node adsSync.js --off --fresh       Start new job from scratch
 *   node adsSync.js --retry-failed      Retry only failed products
 *   node adsSync.js --off --canvas-only Limit to canvas blueprint
 *
 * First time: npm run login:save
 */

'use strict';

const { loadEnv, validateForPlaywright, config } = require('./config');
loadEnv();
const jobStore = require('./adsJobStore');
const { runAdsSync } = require('./adsSyncEngine');
const {
  SHOP_ID,
  fetchAllShopProducts,
  filterEtsyPublished,
  isPublishedToEtsy,
} = require('./printifyShop');

const args = process.argv.slice(2);

function flag(name) {
  return args.includes(name);
}

function optNum(name, def) {
  const eq = args.find((a) => a.startsWith(name + '='));
  if (eq) return parseInt(eq.split('=')[1], 10);
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1] && !args[i + 1].startsWith('--')) return parseInt(args[i + 1], 10);
  return def;
}

function printUsage() {
  console.log(`
Full-store Etsy offsite ads sync (Printify UI)

  npm run ads:sync:off        Disable ads — full Etsy store, resumable
  npm run ads:sync:on         Enable ads — full Etsy store, resumable
  npm run ads:sync:status     Job progress from last run

  node adsSync.js --off [--fresh] [--resume] [--retry-failed]
  node adsSync.js --on  --canvas-only
  node adsSync.js --status

Options:
  --fresh              Discard previous job, rebuild product list
  --resume               Continue pending/failed (default)
  --retry-failed         Only re-run failed items
  --canvas-only          Only blueprint ${config.canvas.blueprintId} on Etsy
  --delay=1800           Ms between products (default 1800)
  --checkpoint-every=5   Save job file every N products

Setup: npm run login:save   (once, before first bulk sync)
`);
}

function getEtsyCatalog(canvasOnly) {
  return fetchAllShopProducts().then((all) => {
    const etsy = filterEtsyPublished(all, { canvasOnly });
    return etsy.map((p) => ({
      id: p.id,
      title: p.title,
      etsyId: Array.isArray(p.external) ? p.external[0]?.id : p.external?.id,
    }));
  });
}

function printJobStatus(job) {
  const s = job.stats;
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  ADS SYNC JOB STATUS');
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Job ID         : ${job.jobId}`);
  console.log(`  Target         : ads ${job.targetEnable ? 'ON' : 'OFF'}`);
  console.log(`  Shop           : ${job.shopId}`);
  console.log(`  Canvas only    : ${job.canvasOnly}`);
  console.log(`  Updated        : ${job.updatedAt}`);
  console.log(`  Total          : ${s.total}`);
  console.log(`  Pending        : ${s.pending}`);
  console.log(`  Done           : ${s.done}`);
  console.log(`  Failed         : ${s.failed}`);
  console.log(`  Changed        : ${s.changed}`);
  console.log(`  Already OK     : ${s.unchanged}`);
  console.log(`  Job file       : ${jobStore.DEFAULT_PATH}`);

  const failed = Object.values(job.products).filter((e) => e.status === jobStore.STATUS.FAILED);
  if (failed.length) {
    console.log(`\n  Failed (${failed.length}):`);
    failed.slice(0, 15).forEach((e) => console.log(`    • ${e.id}: ${e.lastError}`));
    if (failed.length > 15) console.log(`    ... and ${failed.length - 15} more`);
  }
  console.log('');
}

async function main() {
  if (flag('--help') || flag('-h')) {
    printUsage();
    return;
  }

  if (flag('--status')) {
    const job = jobStore.loadJob();
    if (!job) {
      console.log('No sync job found. Run: npm run ads:sync:off');
      return;
    }
    printJobStatus(job);
    return;
  }

  const enable = flag('--on') || flag('--enable');
  const disable = flag('--off') || flag('--disable');
  if (enable === disable) {
    console.error('Specify exactly one of --on or --off');
    process.exit(1);
  }
  const targetEnable = enable;

  validateForPlaywright();

  const limit = optNum('--limit', 0);
  const canvasOnly = flag('--canvas-only');
  const fresh = flag('--fresh');
  const retryFailed = flag('--retry-failed');
  let job = fresh ? null : jobStore.loadJob();

  if (job && job.targetEnable !== targetEnable && !fresh) {
    console.log(
      `[sync] Existing job targets ads ${job.targetEnable ? 'ON' : 'OFF'}; ` +
      `you requested ${targetEnable ? 'ON' : 'OFF'}. Use --fresh to start over.`
    );
    process.exit(1);
  }

  if (!job || fresh) {
    console.log('[sync] Building Etsy product catalog from Printify API...');
    const catalog = await getEtsyCatalog(canvasOnly);
    if (!catalog.length) {
      console.log('No Etsy-published products found.');
      return;
    }
    job = jobStore.createJob({
      shopId: SHOP_ID,
      targetEnable,
      products: catalog,
      canvasOnly,
    });
    jobStore.saveJob(job);
    console.log(`[sync] New job: ${catalog.length} products queued.`);
  } else {
    console.log(`[sync] Resuming job ${job.jobId} (${job.stats.pending} pending, ${job.stats.failed} failed).`);
  }

  if (retryFailed) jobStore.resetFailed(job);

  let productIds = jobStore.getPendingIds(job, { retryFailed });
  if (!productIds.length) {
    printJobStatus(job);
    console.log('[sync] Nothing to do — all products processed.');
    return;
  }

  if (limit > 0) {
    productIds = productIds.slice(0, limit);
    console.log(`[sync] --limit ${limit}: processing first ${productIds.length} only.`);
  }

  const { ensureSession } = require('./offsiteAds');
  await ensureSession();

  console.log(`[sync] Processing ${productIds.length} product(s)...\n`);

  const { job: finalJob, interrupted } = await runAdsSync({
    enable: targetEnable,
    productIds,
    job,
    jobFile: jobStore.DEFAULT_PATH,
    delayMs: optNum('--delay', parseInt(process.env.ADS_SYNC_DELAY_MS || '1800', 10)),
    checkpointEvery: optNum('--checkpoint-every', 5),
    sessionRefreshEvery: optNum('--session-every', 20),
    browserRestartEvery: optNum('--browser-restart-every', 60),
  });

  printJobStatus(finalJob);

  if (interrupted) {
    console.log('[sync] Interrupted. Run again with --resume to continue.');
    process.exit(130);
  }

  if (finalJob.stats.failed > 0) {
    console.log('[sync] Some failures remain. Run: node adsSync.js --retry-failed --off (or --on)');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
