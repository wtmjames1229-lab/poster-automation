'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_PATH =
  process.env.ADS_WATCH_STATE_FILE ||
  path.join(__dirname, '..', '..', 'data', 'ads-watch-state.json');

const STATUS = {
  DONE: 'done',
  FAILED: 'failed',
};

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function atomicWrite(filePath, data) {
  ensureDir(filePath);
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, filePath);
}

function emptyState(shopId, targetEnable) {
  const now = new Date().toISOString();
  return {
    version: 1,
    shopId,
    targetEnable,
    initialSyncComplete: false,
    createdAt: now,
    updatedAt: now,
    lastRunAt: null,
    lastSuccessAt: null,
    lastRunSummary: null,
    products: {},
  };
}

function loadState(filePath = DEFAULT_PATH) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveState(state, filePath = DEFAULT_PATH) {
  state.updatedAt = new Date().toISOString();
  atomicWrite(filePath, state);
  return state;
}

function getOrCreateState({ shopId, targetEnable, filePath }) {
  let state = loadState(filePath);
  if (!state) {
    state = emptyState(shopId, targetEnable);
    saveState(state, filePath);
  }
  if (state.shopId !== shopId) {
    throw new Error(
      `Watch state shop ${state.shopId} != current ${shopId}. Delete ${filePath} or fix PRINTIFY_SHOP_ID.`
    );
  }
  if (state.targetEnable !== targetEnable) {
    state.targetEnable = targetEnable;
    saveState(state, filePath);
  }
  return state;
}

function catalogToEntries(catalog) {
  return catalog.map((p) => ({
    id: p.id,
    title: (p.title || '').slice(0, 120),
    etsyId: p.etsyId || null,
  }));
}

/**
 * Products that need toggling: not successfully done at target state.
 * Includes failed (for retry) and never-seen IDs.
 */
function findQueue(state, catalog, { retryFailed = true } = {}) {
  const catalogIds = new Set(catalog.map((p) => p.id));
  const queue = [];
  const reasons = { new: 0, failed: 0, missing: 0 };

  for (const p of catalog) {
    const entry = state.products[p.id];
    if (!entry) {
      queue.push(p);
      reasons.new++;
      continue;
    }
    if (entry.status === STATUS.DONE) continue;
    if (entry.status === STATUS.FAILED && retryFailed) {
      queue.push(p);
      reasons.failed++;
    }
  }

  // First-time full sync: queue catalog items not yet done
  if (!state.initialSyncComplete) {
    const all = catalogToEntries(catalog);
    const pending = all.filter((p) => state.products[p.id]?.status !== STATUS.DONE);
    return {
      queue: pending,
      mode: 'initial',
      reasons: { initial: pending.length, catalogTotal: all.length },
    };
  }

  return { queue: catalogToEntries(queue), mode: 'incremental', reasons };
}

function markDone(state, productId, result, meta = {}) {
  const now = new Date().toISOString();
  state.products[productId] = {
    id: productId,
    title: meta.title || state.products[productId]?.title || '',
    etsyId: meta.etsyId ?? state.products[productId]?.etsyId ?? null,
    status: STATUS.DONE,
    changed: Boolean(result?.changed),
    newState: result?.newState ?? null,
    lastError: null,
    syncedAt: now,
    updatedAt: now,
  };
  return state;
}

function markFailed(state, productId, errorMessage, meta = {}) {
  const now = new Date().toISOString();
  const prev = state.products[productId];
  state.products[productId] = {
    id: productId,
    title: meta.title || prev?.title || '',
    etsyId: meta.etsyId ?? prev?.etsyId ?? null,
    status: STATUS.FAILED,
    changed: null,
    newState: null,
    lastError: String(errorMessage).slice(0, 500),
    syncedAt: prev?.syncedAt || null,
    updatedAt: now,
    attempts: (prev?.attempts || 0) + 1,
  };
  return state;
}

function computeStats(state) {
  const values = Object.values(state.products);
  const stats = {
    registered: values.length,
    done: 0,
    failed: 0,
  };
  for (const e of values) {
    if (e.status === STATUS.DONE) stats.done++;
    if (e.status === STATUS.FAILED) stats.failed++;
  }
  return stats;
}

function recordRun(state, summary) {
  state.lastRunAt = new Date().toISOString();
  state.lastRunSummary = summary;
  if (summary.ok) state.lastSuccessAt = state.lastRunAt;
  return state;
}

function pruneOrphans(state, catalogIds) {
  const ids = new Set(catalogIds);
  for (const id of Object.keys(state.products)) {
    if (!ids.has(id)) {
      state.products[id].orphan = true;
    }
  }
  return state;
}

module.exports = {
  DEFAULT_PATH,
  STATUS,
  loadState,
  saveState,
  getOrCreateState,
  findQueue,
  markDone,
  markFailed,
  computeStats,
  recordRun,
  pruneOrphans,
  catalogToEntries,
};
