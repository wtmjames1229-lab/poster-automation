'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Production defaults for VPS / self-hosted (not GitHub cloud CI).
 */
function applyDeployDefaults() {
  const mode = process.env.DEPLOY_MODE;
  if (mode !== 'vps' && mode !== 'selfhosted') return;

  if (!process.env.APP_USER_DATA) {
    process.env.APP_USER_DATA =
      process.platform === 'win32'
        ? path.join(process.env.LOCALAPPDATA || '.', 'etsy-ads')
        : '/var/lib/etsy-ads';
  }

  const defaults = {
    PLAYWRIGHT_USE_PROFILE: 'true',
    PLAYWRIGHT_PREFER_SESSION: 'false',
    PLAYWRIGHT_HEADLESS: 'true',
    PRINTIFY_NAV_VIA_PRODUCTS: 'true',
    ADS_WATCH_AUTO_RELOGIN: 'true',
    ADS_WATCH_RETRY_FAILED: 'true',
    ADS_WATCH_SELF_HOSTED: 'true',
    ADS_BLOCK_MEDIA: 'true',
  };

  for (const [key, val] of Object.entries(defaults)) {
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = val;
    }
  }

  if (mode === 'vps') {
    try {
      fs.mkdirSync(process.env.APP_USER_DATA, { recursive: true });
      fs.mkdirSync(path.join(process.env.APP_USER_DATA, 'data'), { recursive: true });
      fs.mkdirSync(path.join(process.env.APP_USER_DATA, 'logs'), { recursive: true });
    } catch (_) {
      /* installer creates dirs */
    }
  }
}

function isCloudCi() {
  return (
    !!process.env.GITHUB_ACTIONS &&
    process.env.ADS_WATCH_SELF_HOSTED !== 'true' &&
    process.env.DEPLOY_MODE !== 'vps'
  );
}

module.exports = { applyDeployDefaults, isCloudCi };
