'use strict';

const fs = require('fs');
const path = require('path');

const LOG_PATH =
  process.env.ADS_SYNC_LOG || path.join(__dirname, '..', '..', 'data', 'sync.log');

function ensureLogDir() {
  const dir = path.dirname(LOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(level, message, meta) {
  ensureLogDir();
  const line = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta || {}),
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(line) + '\n');
}

module.exports = { log, LOG_PATH };
