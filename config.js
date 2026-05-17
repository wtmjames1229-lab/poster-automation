'use strict';

require('dotenv').config();

function env(name, defaultValue) {
  const v = process.env[name];
  if (v === undefined || v === '') return defaultValue;
  return v;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return String(v).trim();
}

const config = {
  printify: {
    apiKey: () => requireEnv('PRINTIFY_API_KEY'),
    shopId: env('PRINTIFY_SHOP_ID', '18634010'),
    email: () => requireEnv('PRINTIFY_EMAIL'),
    password: () => requireEnv('PRINTIFY_PASSWORD'),
    sessionFile: env('PRINTIFY_SESSION_FILE', './printify_session.json'),
  },
  gemini: {
    apiKey: env('NB_API_KEY', ''),
    hasKey() {
      return Boolean(this.apiKey && this.apiKey.trim());
    },
  },
  ads: {
    enabled: env('OFFSITE_ADS_ENABLED', 'false') === 'true',
  },
  pipeline: {
    dailyNewListings: parseInt(env('DAILY_NEW_LISTINGS', '5'), 10),
    skipNewListings: env('SKIP_NEW_LISTINGS', 'false') === 'true',
    toggleAllEtsyPublished: env('TOGGLE_ALL_ETSY_PUBLISHED', 'true') !== 'false',
  },
  playwright: {
    headless: env('PLAYWRIGHT_HEADLESS', 'true') !== 'false',
    slowMo: parseInt(env('PLAYWRIGHT_SLOW_MO', '0'), 10),
  },
  canvas: {
    blueprintId: parseInt(env('CANVAS_BLUEPRINT_ID', '1297'), 10),
    printProviderId: parseInt(env('PRINT_PROVIDER_ID', '259'), 10),
  },
};

function validateForApi() {
  config.printify.apiKey();
  return config;
}

function validateForPlaywright() {
  validateForApi();
  config.printify.email();
  config.printify.password();
  return config;
}

function validateForPipeline() {
  validateForPlaywright();
  if (!config.gemini.hasKey()) {
    throw new Error('NB_API_KEY is required for the full listing pipeline (npm start)');
  }
  return config;
}

module.exports = {
  config,
  env,
  requireEnv,
  validateForApi,
  validateForPlaywright,
  validateForPipeline,
};
