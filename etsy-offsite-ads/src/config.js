'use strict';

const paths = require('./paths');

function loadEnv() {
  paths.ensureUserDataDirs();
  paths.ensureEnvFile();
  require('dotenv').config({ path: paths.getEnvPath() });
  require('dotenv').config({ path: paths.getEnvPath() + '.local' });

  if (!process.env.PRINTIFY_SESSION_FILE) {
    process.env.PRINTIFY_SESSION_FILE = paths.getSessionPath();
  }
  if (!process.env.PLAYWRIGHT_USER_DATA_DIR) {
    process.env.PLAYWRIGHT_USER_DATA_DIR = paths.getChromeProfilePath();
  }
  if (!process.env.ADS_SYNC_JOB_FILE) {
    process.env.ADS_SYNC_JOB_FILE = paths.getJobPath();
  }
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) throw new Error(`Missing required env: ${name}`);
  return String(v).trim();
}

function validateForApi() {
  requireEnv('PRINTIFY_API_KEY');
  return true;
}

function validateForPlaywright() {
  validateForApi();
  requireEnv('PRINTIFY_EMAIL');
  requireEnv('PRINTIFY_PASSWORD');
  return true;
}

const config = {
  canvas: { blueprintId: parseInt(process.env.CANVAS_BLUEPRINT_ID || '1297', 10) },
};

module.exports = {
  loadEnv,
  validateForApi,
  validateForPlaywright,
  config,
  paths,
  pkgRoot: paths.getResourceRoot(),
  userDataRoot: paths.getUserDataRoot(),
};
