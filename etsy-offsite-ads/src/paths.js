'use strict';

const fs = require('fs');
const path = require('path');

function isPackaged() {
  return process.env.ELECTRON_IS_PACKAGED === '1';
}

function getUserDataRoot() {
  return process.env.APP_USER_DATA || path.join(__dirname, '..');
}

function getResourceRoot() {
  if (process.env.APP_RESOURCE_ROOT) {
    return process.env.APP_RESOURCE_ROOT;
  }
  if (isPackaged() && process.resourcesPath) {
    return path.join(process.resourcesPath, 'app.asar');
  }
  return path.join(__dirname, '..');
}

function getEnvPath() {
  return path.join(getUserDataRoot(), '.env');
}

function getSessionPath() {
  if (process.env.PRINTIFY_SESSION_FILE && path.isAbsolute(process.env.PRINTIFY_SESSION_FILE)) {
    return process.env.PRINTIFY_SESSION_FILE;
  }
  return path.join(getUserDataRoot(), 'printify_session.json');
}

function getChromeProfilePath() {
  if (process.env.PLAYWRIGHT_USER_DATA_DIR && path.isAbsolute(process.env.PLAYWRIGHT_USER_DATA_DIR)) {
    return process.env.PLAYWRIGHT_USER_DATA_DIR;
  }
  return path.join(getUserDataRoot(), 'data', 'chrome-profile');
}

function getJobPath() {
  if (process.env.ADS_SYNC_JOB_FILE && path.isAbsolute(process.env.ADS_SYNC_JOB_FILE)) {
    return process.env.ADS_SYNC_JOB_FILE;
  }
  return path.join(getUserDataRoot(), 'data', 'ads-sync-job.json');
}

function getScriptPath(relative) {
  return path.join(getResourceRoot(), relative);
}

function ensureUserDataDirs() {
  const root = getUserDataRoot();
  const dataDir = path.join(root, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function ensureEnvFile() {
  const envPath = getEnvPath();
  if (fs.existsSync(envPath)) return envPath;

  const candidates = [
    path.join(getResourceRoot(), '.env'),
    path.join(getResourceRoot(), '.env.example'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '..', '.env'),
  ];

  for (const src of candidates) {
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(envPath), { recursive: true });
      fs.copyFileSync(src, envPath);
      return envPath;
    }
  }

  const example = path.join(getResourceRoot(), '.env.example');
  if (fs.existsSync(example)) {
    fs.mkdirSync(path.dirname(envPath), { recursive: true });
    fs.copyFileSync(example, envPath);
  }
  return envPath;
}

module.exports = {
  isPackaged,
  getUserDataRoot,
  getResourceRoot,
  getEnvPath,
  getSessionPath,
  getChromeProfilePath,
  getJobPath,
  getScriptPath,
  ensureUserDataDirs,
  ensureEnvFile,
};
