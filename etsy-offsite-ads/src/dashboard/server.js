'use strict';

const http = require('http');
const path = require('path');
const express = require('express');
const { loadEnv, pkgRoot } = require('../config');
loadEnv();

const runState = require('./runState');
const tasks = require('./tasks');

const PORT = parseInt(process.env.DASHBOARD_PORT || '3847', 10);
const publicDir = path.join(pkgRoot, 'public');
let sessionCache = { at: 0, data: null };

async function getSessionCached() {
  if (runState.isRunning()) return { ok: null, message: 'Checking during run…' };
  if (Date.now() - sessionCache.at < 60000 && sessionCache.data) return sessionCache.data;
  sessionCache.data = await tasks.checkSession();
  sessionCache.at = Date.now();
  return sessionCache.data;
}

const app = express();
app.use(express.json());
app.use(express.static(publicDir));

app.get('/api/status', async (_req, res) => {
  try {
    const session = await getSessionCached();
    res.json({
      run: runState.snapshot(),
      session,
      job: tasks.getJobSummary(),
      shopId: process.env.PRINTIFY_SHOP_ID || '18634010',
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  send({ type: 'hello', state: runState.snapshot() });

  const onEvent = (payload) => send(payload);
  runState.bus.on('event', onEvent);

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    runState.bus.off('event', onEvent);
  });
});

app.post('/api/preflight', (_req, res) => {
  if (runState.isRunning()) return res.status(409).json({ error: 'Busy' });
  tasks.runPreflightTask().catch(() => null);
  res.json({ ok: true, message: 'Preflight started' });
});

app.post('/api/login', (_req, res) => {
  if (runState.isRunning()) return res.status(409).json({ error: 'Busy' });
  tasks.runLoginTask().catch(() => null);
  res.json({ ok: true, message: 'Login window opening' });
});

app.post('/api/toggle', (req, res) => {
  const { productId, enable } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'productId required' });
  if (typeof enable !== 'boolean') return res.status(400).json({ error: 'enable (boolean) required' });
  if (runState.isRunning()) return res.status(409).json({ error: 'Busy' });

  tasks.runToggleTask(String(productId).trim(), enable).catch(() => null);
  res.json({ ok: true, message: 'Toggle started' });
});

app.post('/api/sync/start', (req, res) => {
  const { enable, fresh, retryFailed, limit, canvasOnly } = req.body || {};
  if (typeof enable !== 'boolean') return res.status(400).json({ error: 'enable (boolean) required' });
  if (runState.isRunning()) return res.status(409).json({ error: 'Busy' });

  tasks
    .runSyncTask({
      enable,
      fresh: Boolean(fresh),
      retryFailed: Boolean(retryFailed),
      limit: parseInt(limit || '0', 10) || 0,
      canvasOnly: Boolean(canvasOnly),
    })
    .catch(() => null);
  res.json({ ok: true, message: 'Sync started' });
});

app.post('/api/sync/stop', (_req, res) => {
  res.json(tasks.stopTask());
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`\n  Etsy Offsite Ads Dashboard`);
  console.log(`  → http://localhost:${PORT}\n`);
});
