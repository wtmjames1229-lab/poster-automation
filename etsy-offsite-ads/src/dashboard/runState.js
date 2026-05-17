'use strict';

const { EventEmitter } = require('events');

const MAX_LOGS = 400;

const state = {
  status: 'idle',
  phase: null,
  message: '',
  startedAt: null,
  finishedAt: null,
  progress: {
    index: 0,
    total: 0,
    done: 0,
    failed: 0,
    changed: 0,
    unchanged: 0,
    pct: 0,
    eta: '',
    currentProductId: null,
    currentTitle: null,
  },
  lastResult: null,
  abortRequested: false,
};

const bus = new EventEmitter();
bus.setMaxListeners(50);

function snapshot() {
  const { _logs, ...rest } = state;
  return {
    ...JSON.parse(JSON.stringify(rest)),
    logs: getLogs().slice(-120),
  };
}

function emit(type, payload) {
  bus.emit('event', { type, payload, state: snapshot(), ts: Date.now() });
}

function setStatus(status, message, phase = state.phase) {
  state.status = status;
  state.message = message || '';
  if (phase !== undefined) state.phase = phase;
  emit('status', { status, message, phase });
}

function setProgress(patch) {
  Object.assign(state.progress, patch);
  if (state.progress.total > 0) {
    state.progress.pct = Math.round((state.progress.index / state.progress.total) * 1000) / 10;
  }
  emit('progress', state.progress);
}

function resetProgress(total = 0) {
  state.progress = {
    index: 0,
    total,
    done: 0,
    failed: 0,
    changed: 0,
    unchanged: 0,
    pct: 0,
    eta: '',
    currentProductId: null,
    currentTitle: null,
  };
  emit('progress', state.progress);
}

function appendLog(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  if (!state._logs) state._logs = [];
  state._logs.push(entry);
  if (state._logs.length > MAX_LOGS) state._logs.shift();
  emit('log', entry);
  return entry;
}

function getLogs() {
  return state._logs || [];
}

function startRun(phase, message) {
  state.status = 'running';
  state.phase = phase;
  state.message = message;
  state.startedAt = new Date().toISOString();
  state.finishedAt = null;
  state.abortRequested = false;
  state.lastResult = null;
  emit('run_start', { phase, message });
}

function finishRun(success, result) {
  state.status = success ? 'idle' : 'error';
  state.finishedAt = new Date().toISOString();
  state.lastResult = result || null;
  state.message = success ? 'Ready' : (result?.error || 'Finished with errors');
  emit('run_end', { success, result });
}

function requestAbort() {
  state.abortRequested = true;
  appendLog('warn', 'Stop requested — finishing current product…');
  emit('abort', {});
}

function isAbortRequested() {
  return state.abortRequested;
}

function isRunning() {
  return state.status === 'running';
}

module.exports = {
  bus,
  snapshot,
  setStatus,
  setProgress,
  resetProgress,
  appendLog,
  getLogs,
  startRun,
  finishRun,
  requestAbort,
  isAbortRequested,
  isRunning,
};
