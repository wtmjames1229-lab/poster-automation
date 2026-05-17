'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_LOCK =
  process.env.ADS_WATCH_LOCK_FILE ||
  path.join(__dirname, '..', '..', 'data', 'ads-watch.lock');

const STALE_MS = parseInt(process.env.ADS_WATCH_LOCK_STALE_MS || String(6 * 60 * 60 * 1000), 10);

function acquire(lockPath = DEFAULT_LOCK) {
  const dir = path.dirname(lockPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(lockPath)) {
    try {
      const lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
      const age = Date.now() - (lock.startedAt || 0);
      if (age < STALE_MS) {
        throw new Error(
          `Watch already running (pid ${lock.pid}, started ${lock.startedAt}). ` +
            `Delete ${lockPath} if stale.`
        );
      }
    } catch (e) {
      if (e.message.includes('Watch already running')) throw e;
    }
  }

  const payload = {
    pid: process.pid,
    startedAt: Date.now(),
    host: require('os').hostname(),
  };
  fs.writeFileSync(lockPath, JSON.stringify(payload, null, 2));
  return () => {
    try {
      if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
    } catch (_) {
      /* ignore */
    }
  };
}

module.exports = { acquire, DEFAULT_LOCK };
