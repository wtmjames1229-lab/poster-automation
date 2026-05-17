'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_PATH =
  process.env.ADS_SYNC_JOB_FILE ||
  path.join(__dirname, '..', 'data', 'ads-sync-job.json');

const STATUS = {
  PENDING: 'pending',
  DONE: 'done',
  FAILED: 'failed',
  SKIPPED: 'skipped',
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

function loadJob(filePath) {
  const p = filePath || DEFAULT_PATH;
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function createJob({ shopId, targetEnable, products, canvasOnly }) {
  const now = new Date().toISOString();
  const entries = {};
  for (const p of products) {
    entries[p.id] = {
      id: p.id,
      title: (p.title || '').slice(0, 120),
      etsyId: p.etsyId || null,
      status: STATUS.PENDING,
      attempts: 0,
      changed: null,
      previousState: null,
      newState: null,
      lastError: null,
      updatedAt: now,
    };
  }
  return {
    jobId: crypto.randomUUID(),
    version: 1,
    shopId,
    targetEnable,
    canvasOnly: Boolean(canvasOnly),
    createdAt: now,
    updatedAt: now,
    products: entries,
    stats: computeStats(entries),
  };
}

function computeStats(entries) {
  const values = Object.values(entries);
  const stats = {
    total: values.length,
    pending: 0,
    done: 0,
    failed: 0,
    skipped: 0,
    changed: 0,
    unchanged: 0,
  };
  for (const e of values) {
    stats[e.status] = (stats[e.status] || 0) + 1;
    if (e.status === STATUS.DONE) {
      if (e.changed) stats.changed++;
      else stats.unchanged++;
    }
  }
  return stats;
}

function saveJob(job, filePath) {
  job.updatedAt = new Date().toISOString();
  job.stats = computeStats(job.products);
  atomicWrite(filePath || DEFAULT_PATH, job);
  return job;
}

function getPendingIds(job, { retryFailed = false } = {}) {
  return Object.values(job.products)
    .filter((e) => {
      if (e.status === STATUS.PENDING) return true;
      if (retryFailed && e.status === STATUS.FAILED) return true;
      return false;
    })
    .map((e) => e.id);
}

function markProduct(job, id, patch) {
  const entry = job.products[id];
  if (!entry) return job;
  Object.assign(entry, patch, { updatedAt: new Date().toISOString() });
  return saveJob(job);
}

function markDone(job, id, result) {
  return markProduct(job, id, {
    status: STATUS.DONE,
    changed: Boolean(result.changed),
    previousState: result.previousState,
    newState: result.newState,
    lastError: null,
  });
}

function markFailed(job, id, errorMessage) {
  const entry = job.products[id];
  return markProduct(job, id, {
    status: STATUS.FAILED,
    attempts: (entry?.attempts || 0) + 1,
    lastError: String(errorMessage).slice(0, 500),
  });
}

function incrementAttempt(job, id) {
  const entry = job.products[id];
  return markProduct(job, id, { attempts: (entry?.attempts || 0) + 1 });
}

function resetFailed(job) {
  for (const e of Object.values(job.products)) {
    if (e.status === STATUS.FAILED) {
      e.status = STATUS.PENDING;
      e.lastError = null;
    }
  }
  return saveJob(job);
}

function resetAll(job) {
  for (const e of Object.values(job.products)) {
    e.status = STATUS.PENDING;
    e.attempts = 0;
    e.changed = null;
    e.lastError = null;
  }
  return saveJob(job);
}

module.exports = {
  DEFAULT_PATH,
  STATUS,
  loadJob,
  saveJob,
  createJob,
  getPendingIds,
  markDone,
  markFailed,
  incrementAttempt,
  resetFailed,
  resetAll,
  computeStats,
};
