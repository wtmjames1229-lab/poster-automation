'use strict';

const { shell } = require('electron');
const { loadEnv, paths } = require('../src/config');
loadEnv();

const runState = require('../src/dashboard/runState');
const tasks = require('../src/dashboard/tasks');

let sessionCache = { at: 0, data: null, checking: false };

function invalidateSessionCache() {
  sessionCache.at = 0;
  sessionCache.data = null;
  sessionCache.checking = false;
}

function connectionMeta() {
  return {
    shopId: process.env.PRINTIFY_SHOP_ID || '18634010',
    shopName: process.env.PRINTIFY_SHOP_NAME || 'Printify shop',
    envPath: paths.getEnvPath(),
    sessionPath: paths.getSessionPath(),
    profilePath: paths.getChromeProfilePath(),
    hasApiKey: Boolean(process.env.PRINTIFY_API_KEY?.trim()),
    hasCredentials: Boolean(
      process.env.PRINTIFY_EMAIL?.trim() && process.env.PRINTIFY_PASSWORD?.trim()
    ),
    packaged: paths.isPackaged(),
    userDataRoot: paths.getUserDataRoot(),
  };
}

async function getSessionCached() {
  if (runState.isRunning()) {
    return { ok: null, message: 'Session check paused while a task runs', checking: false };
  }
  if (Date.now() - sessionCache.at < 60000 && sessionCache.data) {
    return { ...sessionCache.data, checkedAt: sessionCache.at, checking: false };
  }
  if (sessionCache.checking) {
    return { ok: null, message: 'Checking Printify session…', checking: true };
  }

  sessionCache.checking = true;
  try {
    sessionCache.data = await tasks.checkSession();
    sessionCache.at = Date.now();
    return { ...sessionCache.data, checkedAt: sessionCache.at, checking: false };
  } finally {
    sessionCache.checking = false;
  }
}

async function getStatus() {
  const session = await getSessionCached();
  return {
    run: runState.snapshot(),
    session,
    connection: connectionMeta(),
    job: tasks.getJobSummary(),
  };
}

function startBackground(fn) {
  fn().catch(() => null);
}

async function preflight() {
  if (runState.isRunning()) throw new Error('Busy');
  startBackground(() => tasks.runPreflightTask().then(() => invalidateSessionCache()));
  return { ok: true, message: 'Preflight started' };
}

async function login() {
  if (runState.isRunning()) throw new Error('Busy');
  startBackground(() => tasks.runLoginTask().then(() => invalidateSessionCache()));
  return { ok: true, message: 'Login window opening' };
}

async function reconnect() {
  if (runState.isRunning()) throw new Error('Busy');
  invalidateSessionCache();
  startBackground(() => tasks.runReconnectTask().then(() => invalidateSessionCache()));
  return { ok: true, message: 'Reconnect started — complete login in Chrome' };
}

async function refreshSession() {
  if (runState.isRunning()) throw new Error('Busy');
  invalidateSessionCache();
  sessionCache.checking = true;
  try {
    sessionCache.data = await tasks.checkSession();
    sessionCache.at = Date.now();
    return { ...sessionCache.data, checkedAt: sessionCache.at, checking: false };
  } finally {
    sessionCache.checking = false;
  }
}

function stop() {
  return tasks.stopTask();
}

async function toggle(productId, enable) {
  if (runState.isRunning()) throw new Error('Busy');
  startBackground(() => tasks.runToggleTask(productId, enable));
  return { ok: true, message: 'Toggle started' };
}

async function syncStart(opts) {
  if (runState.isRunning()) throw new Error('Busy');
  startBackground(() => tasks.runSyncTask(opts));
  return { ok: true, message: 'Sync started' };
}

async function openConfigFolder() {
  const root = paths.getUserDataRoot();
  await shell.openPath(root);
  return { ok: true, path: root };
}

module.exports = {
  runState,
  getStatus,
  preflight,
  login,
  reconnect,
  refreshSession,
  stop,
  toggle,
  syncStart,
  openConfigFolder,
  invalidateSessionCache,
};
