#!/usr/bin/env node
'use strict';

/**
 * Headed Printify login on Linux servers (VPS) via Xvfb virtual display.
 * Requires: apt install xvfb
 */

const { spawnSync } = require('child_process');
const path = require('path');
const { loadEnv } = require('../src/config');
loadEnv();

const script = path.join(__dirname, 'headedLogin.js');
const node = process.execPath;

function hasXvfb() {
  const r = spawnSync('which', ['xvfb-run'], { encoding: 'utf8' });
  return r.status === 0;
}

if (!hasXvfb()) {
  console.error('[linuxHeadedLogin] Install Xvfb: sudo apt install -y xvfb');
  console.error('Or import session from your PC: npm run vps:import-session (see deploy/README.md)');
  process.exit(1);
}

console.log('[linuxHeadedLogin] Starting login under xvfb-run...');
const r = spawnSync('xvfb-run', ['-a', node, script], {
  stdio: 'inherit',
  env: { ...process.env, PLAYWRIGHT_HEADLESS: 'false' },
});

process.exit(r.status ?? 1);
