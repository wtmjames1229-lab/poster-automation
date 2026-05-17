'use strict';

const { loadEnv, pkgRoot, paths } = require('../config');
loadEnv();

const jobStore = require('../adsJobStore');
const { runAdsSync } = require('../adsSyncEngine');
const {
  ensureSession,
  setOffsiteAds,
  closeBrowser,
  resetBrowserSession,
} = require('../offsiteAds');
const {
  SHOP_ID,
  fetchAllShopProducts,
  filterEtsyPublished,
} = require('../printifyShop');
const { spawnScript } = require('../spawnUtil');
const runState = require('./runState');

let runLock = false;

async function withLock(fn) {
  if (runLock) throw new Error('Another operation is already running');
  runLock = true;
  try {
    return await fn();
  } finally {
    runLock = false;
  }
}

function pipeChildLogs(child) {
  child.stdout.on('data', (d) => {
    String(d)
      .split('\n')
      .filter(Boolean)
      .forEach((line) => runState.appendLog('info', line.trim()));
  });
  child.stderr.on('data', (d) => {
    String(d)
      .split('\n')
      .filter(Boolean)
      .forEach((line) => runState.appendLog('warn', line.trim()));
  });
}

function runScriptTask(scriptRelative, label) {
  return new Promise((resolve, reject) => {
    const child = spawnScript(scriptRelative);
    pipeChildLogs(child);
    child.on('close', (code) => {
      if (code === 0) resolve({ ok: true });
      else reject(new Error(`${label} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function checkSession() {
  try {
    await ensureSession({ strict: true });
    return { ok: true, message: 'Signed in to Printify' };
  } catch (e) {
    return { ok: false, message: e.message };
  } finally {
    await resetBrowserSession().catch(() => null);
  }
}

async function runPreflightTask() {
  return withLock(async () => {
    runState.startRun('preflight', 'Checking API and browser session…');
    runState.appendLog('info', 'Preflight started');
    try {
      const { fetchAllShopProducts: fetch } = require('../printifyShop');
      const all = await fetch();
      const etsy = filterEtsyPublished(all);
      runState.appendLog('info', `API OK — ${etsy.length} Etsy listings`);
      const session = await checkSession();
      if (!session.ok) throw new Error(session.message);
      runState.appendLog('info', 'Browser session OK');
      runState.finishRun(true, { etsyCount: etsy.length, session: true });
      return { ok: true, etsyCount: etsy.length };
    } catch (e) {
      runState.appendLog('error', e.message);
      runState.finishRun(false, { error: e.message });
      throw e;
    }
  });
}

function runLoginTask() {
  return withLock(async () => {
    runState.startRun('login', 'Opening Chrome for login (complete captcha in browser)…');
    runState.appendLog('info', 'Launching headed login…');
    try {
      await runScriptTask('scripts/headedLogin.js', 'Login');
      runState.appendLog('info', 'Exporting session cookies…');
      await runScriptTask('scripts/exportSession.js', 'Export session');
      const session = await checkSession();
      if (!session.ok) throw new Error(session.message);
      runState.finishRun(true, { login: true });
      return { ok: true };
    } catch (e) {
      runState.finishRun(false, { error: e.message });
      throw e;
    }
  });
}

async function runReconnectTask() {
  return withLock(async () => {
    runState.startRun('reconnect', 'Reconnecting Printify — sign in when Chrome opens…');
    runState.appendLog('info', 'Resetting browser session…');
    try {
      await resetBrowserSession().catch(() => null);
      runState.appendLog('info', 'Opening Chrome for Printify login…');
      await runScriptTask('scripts/headedLogin.js', 'Login');
      runState.appendLog('info', 'Saving session…');
      await runScriptTask('scripts/exportSession.js', 'Export session');
      const session = await checkSession();
      if (!session.ok) throw new Error(session.message);
      runState.appendLog('info', 'Printify reconnected');
      runState.finishRun(true, { reconnect: true });
      return { ok: true };
    } catch (e) {
      runState.appendLog('error', e.message);
      runState.finishRun(false, { error: e.message });
      throw e;
    }
  });
}

async function runToggleTask(productId, enable) {
  return withLock(async () => {
    const label = enable ? 'ON' : 'OFF';
    runState.startRun('toggle', `Toggling ads ${label} for ${productId}`);
    runState.resetProgress(1);
    runState.setProgress({ index: 0, total: 1, currentProductId: productId });

    try {
      await ensureSession();
      runState.appendLog('info', 'Session OK');
      const result = await setOffsiteAds(productId, enable);
      runState.setProgress({
        index: 1,
        done: 1,
        changed: result.changed ? 1 : 0,
        unchanged: result.changed ? 0 : 1,
        currentProductId: productId,
      });
      runState.appendLog(
        'info',
        `Product ${productId}: ads ${result.newState ? 'ON' : 'OFF'}${result.changed ? ' (changed)' : ' (already set)'}`
      );
      runState.finishRun(true, result);
      return result;
    } catch (e) {
      runState.appendLog('error', e.message);
      runState.finishRun(false, { error: e.message });
      throw e;
    } finally {
      await closeBrowser().catch(() => null);
    }
  });
}

async function buildJob(targetEnable, { fresh, canvasOnly }) {
  if (fresh || !jobStore.loadJob()) {
    runState.appendLog('info', 'Building catalog from Printify API…');
    const catalog = filterEtsyPublished(await fetchAllShopProducts(), { canvasOnly });
    const job = jobStore.createJob({
      shopId: SHOP_ID,
      targetEnable,
      products: catalog.map((p) => ({
        id: p.id,
        title: p.title,
        etsyId: Array.isArray(p.external) ? p.external[0]?.id : p.external?.id,
      })),
      canvasOnly,
    });
    jobStore.saveJob(job);
    runState.appendLog('info', `Job created: ${catalog.length} products → ads ${targetEnable ? 'ON' : 'OFF'}`);
    return job;
  }
  const job = jobStore.loadJob();
  if (job.targetEnable !== targetEnable) {
    throw new Error(
      `Existing job is ads ${job.targetEnable ? 'ON' : 'OFF'}. Use fresh start to switch.`
    );
  }
  return job;
}

async function runSyncTask(options = {}) {
  const { enable, fresh = false, retryFailed = false, limit = 0, canvasOnly = false } = options;

  return withLock(async () => {
    const label = enable ? 'ON' : 'OFF';
    runState.startRun('sync', `Bulk sync — turn ads ${label} for Etsy store`);
    runState.appendLog('info', `Starting sync (ads ${label})`);

    try {
      await ensureSession();
      let job = await buildJob(enable, { fresh, canvasOnly });
      if (retryFailed) jobStore.resetFailed(job);

      let productIds = jobStore.getPendingIds(job, { retryFailed });
      if (!productIds.length) {
        runState.appendLog('info', 'Nothing pending — all products processed');
        runState.finishRun(true, { job: job.stats });
        return { job };
      }
      if (limit > 0) productIds = productIds.slice(0, limit);

      const total = productIds.length;
      runState.resetProgress(total);
      runState.appendLog('info', `Processing ${total} products`);

      const timings = [];
      const { job: finalJob, interrupted } = await runAdsSync({
        enable,
        productIds,
        job,
        jobFile: jobStore.DEFAULT_PATH,
        shouldAbort: () => runState.isAbortRequested(),
        onProgress: (p) => {
          const avgMs =
            timings.length > 0
              ? timings.reduce((a, b) => a + b, 0) / timings.length
              : 120000;
          if (p.success) timings.push(Math.max(4000, avgMs * 0.95));
          runState.setProgress({
            index: p.index,
            total: p.total,
            done: p.stats.done,
            failed: p.stats.failed,
            changed: p.stats.changed,
            unchanged: p.stats.unchanged,
            eta: p.eta,
            currentProductId: p.productId,
            currentTitle: p.title,
          });
          const line = p.success
            ? `✓ ${p.productId} ${p.stats.changed ? '(changed)' : '(ok)'}`
            : `✗ ${p.productId}: ${p.error}`;
          runState.appendLog(p.success ? 'info' : 'error', line, {
            productId: p.productId,
          });
        },
      });

      const ok = !interrupted && finalJob.stats.failed === 0;
      runState.finishRun(ok, {
        interrupted,
        stats: finalJob.stats,
        targetEnable: enable,
      });
      if (interrupted) runState.appendLog('warn', 'Sync stopped by user');
      else runState.appendLog('info', 'Sync complete');
      return { job: finalJob, interrupted };
    } catch (e) {
      runState.appendLog('error', e.message);
      runState.finishRun(false, { error: e.message });
      throw e;
    } finally {
      await closeBrowser().catch(() => null);
    }
  });
}

function stopTask() {
  if (!runState.isRunning()) return { ok: false, message: 'Nothing running' };
  runState.requestAbort();
  return { ok: true, message: 'Stop requested' };
}

function getJobSummary() {
  const job = jobStore.loadJob();
  if (!job) return null;
  return {
    jobId: job.jobId,
    targetEnable: job.targetEnable,
    shopId: job.shopId,
    updatedAt: job.updatedAt,
    stats: job.stats,
    recentFailed: Object.values(job.products)
      .filter((p) => p.status === jobStore.STATUS.FAILED)
      .slice(0, 10)
      .map((p) => ({ id: p.id, title: p.title, error: p.lastError })),
  };
}

module.exports = {
  checkSession,
  runPreflightTask,
  runLoginTask,
  runReconnectTask,
  runToggleTask,
  runSyncTask,
  stopTask,
  getJobSummary,
  pkgRoot,
  paths,
};
