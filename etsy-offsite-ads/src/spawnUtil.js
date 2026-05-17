'use strict';

const { spawn, spawnSync } = require('child_process');
const paths = require('./paths');

function childEnv(extra = {}) {
  return {
    ...process.env,
    ELECTRON_RUN_AS_NODE: '1',
    ...extra,
  };
}

function spawnScript(relativePath, opts = {}) {
  const scriptPath = paths.getScriptPath(relativePath);
  const cwd = paths.getResourceRoot();
  return spawn(process.execPath, [scriptPath], {
    cwd,
    env: childEnv(opts.env),
    stdio: opts.stdio || ['ignore', 'pipe', 'pipe'],
    ...opts,
  });
}

function spawnScriptSync(relativePath, extraEnv = {}) {
  const scriptPath = paths.getScriptPath(relativePath);
  const cwd = paths.getResourceRoot();
  return spawnSync(process.execPath, [scriptPath], {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
    env: childEnv(extraEnv),
  });
}

module.exports = { spawnScript, spawnScriptSync, childEnv };
