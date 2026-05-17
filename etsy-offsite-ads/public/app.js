'use strict';

const $ = (id) => document.getElementById(id);
const logView = $('logView');
const logLines = [];
const MAX_VIEW = 200;
const desktop = window.etsyAds;

function api(path, opts = {}) {
  if (!desktop) {
    return fetch(path, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || r.statusText);
      return data;
    });
  }
  return null;
}

function appendLog(entry) {
  const level = entry.level || 'info';
  const ts = entry.ts ? new Date(entry.ts).toLocaleTimeString() : '';
  const line = document.createElement('div');
  line.className = `log-line ${level}`;
  line.textContent = `[${ts}] ${entry.message}`;
  logLines.push(line);
  if (logLines.length > MAX_VIEW) logLines.shift().remove();
  logView.appendChild(line);
  logView.scrollTop = logView.scrollHeight;
}

function setBusy(busy) {
  document.querySelectorAll('.btn').forEach((b) => {
    if (b.id === 'clearLog') return;
    b.disabled = busy && !b.dataset.action?.includes('stop');
  });
}

function setDot(el, kind) {
  if (!el) return;
  const lg = el.id === 'sessionDot' ? ' status-dot-lg' : '';
  el.className = 'status-dot' + lg + ' dot-' + kind;
}

function renderRun(run) {
  const status = run.status || 'idle';
  const running = status === 'running';
  const errored = status === 'error';

  $('runBadge').textContent = running ? 'Running' : errored ? 'Error' : 'Idle';
  $('phaseStatus').textContent = run.phase ? run.phase.charAt(0).toUpperCase() + run.phase.slice(1) : 'Ready';
  $('messageStatus').textContent = run.message || 'Waiting for a task';
  setDot($('runDot'), running ? 'running' : errored ? 'bad' : 'idle');

  const p = run.progress || {};
  const pct = p.pct || 0;
  $('progressPct').textContent = Math.round(pct);
  $('progressFill').style.width = pct + '%';
  $('progressCounts').textContent = `${p.index || 0} of ${p.total || 0} products`;
  $('progressEta').textContent = p.eta ? `ETA ${p.eta}` : 'ETA —';

  if (p.currentProductId) {
    const title = p.currentTitle ? `${p.currentTitle}\n` : '';
    $('progressCurrent').textContent = title + p.currentProductId;
  } else {
    $('progressCurrent').textContent = 'No product in progress';
  }

  $('sDone').textContent = p.done ?? 0;
  $('sChanged').textContent = p.changed ?? 0;
  $('sUnchanged').textContent = p.unchanged ?? 0;
  $('sFailed').textContent = p.failed ?? 0;

  setBusy(running);
}

function renderJob(job) {
  if (!job) {
    $('jobTarget').textContent = 'No active job';
    $('jobStats').textContent = 'Start a bulk sync to create one';
    return;
  }
  $('jobTarget').textContent = `Ads ${job.targetEnable ? 'ON' : 'OFF'} · ${job.stats.total} listings`;
  const s = job.stats;
  $('jobStats').innerHTML = [
    `<div>Pending <strong>${s.pending}</strong></div>`,
    `<div>Done <strong>${s.done}</strong> · Changed <strong>${s.changed}</strong></div>`,
    `<div>Failed <strong>${s.failed}</strong> · Skipped OK <strong>${s.unchanged}</strong></div>`,
  ].join('');
}

function renderSession(session, connection) {
  const stateEl = $('sessionStatus');
  const detailEl = $('sessionDetail');
  const checkedEl = $('sessionChecked');

  if (session?.checking) {
    stateEl.textContent = 'Checking…';
    detailEl.textContent = 'Verifying Printify browser session…';
    checkedEl.textContent = '—';
    setDot($('sessionDot'), 'running');
    return;
  }

  if (session?.ok === true) {
    stateEl.textContent = 'Connected';
    detailEl.textContent = session.message || 'Ready to toggle Etsy off-site ads';
    setDot($('sessionDot'), 'ok');
  } else if (session?.ok === false) {
    stateEl.textContent = 'Not connected';
    detailEl.textContent = session.message || 'Use Reconnect Printify to sign in again';
    setDot($('sessionDot'), 'bad');
  } else {
    stateEl.textContent = 'Unknown';
    detailEl.textContent = session?.message || 'Run Check connection';
    setDot($('sessionDot'), 'idle');
  }

  if (session?.checkedAt) {
    checkedEl.textContent = 'Last checked ' + new Date(session.checkedAt).toLocaleString();
  } else {
    checkedEl.textContent = '—';
  }

  if (connection) {
    const warnings = [];
    if (!connection.hasApiKey) warnings.push('Add PRINTIFY_API_KEY in settings folder');
    if (!connection.hasCredentials) warnings.push('Add email/password in .env');
    if (warnings.length) {
      detailEl.textContent = warnings.join(' · ');
      setDot($('sessionDot'), 'bad');
    }
    const shopLabel = connection.shopName
      ? `${connection.shopName} (${connection.shopId})`
      : `Shop ${connection.shopId}`;
    $('shopBadge').textContent = shopLabel;
  }
}

async function refreshStatus() {
  try {
    const data = desktop ? await desktop.getStatus() : await api('/api/status');
    if (!data.shopId && data.connection) {
      data.shopId = data.connection.shopId;
    }
    renderRun(data.run);
    renderJob(data.job);
    if (!data.run || data.run.status !== 'running') {
      renderSession(data.session, data.connection);
    }
  } catch (e) {
    appendLog({ level: 'error', message: 'Status: ' + e.message, ts: new Date().toISOString() });
  }
}

function handleEvent(msg) {
  if (msg.type === 'hello' && msg.state) {
    renderRun(msg.state);
    (msg.state.logs || []).forEach(appendLog);
  }
  if (msg.state) renderRun(msg.state);
  if (msg.type === 'log' && msg.payload) appendLog(msg.payload);
  if (msg.type === 'run_end' || msg.type === 'progress') refreshStatus();
}

function connectEvents() {
  if (desktop) {
    desktop.onEvent(handleEvent);
    return;
  }
  const es = new EventSource('/api/events');
  es.onmessage = (ev) => {
    try {
      handleEvent(JSON.parse(ev.data));
    } catch (_) {
      /* ignore */
    }
  };
}

function syncLimit() {
  return parseInt($('syncLimit').value, 10) || 0;
}

function productId() {
  return $('productId').value.trim();
}

async function runAction(a) {
  if (a === 'preflight') {
    if (desktop) await desktop.preflight();
    else await api('/api/preflight', { method: 'POST' });
    appendLog({ level: 'info', message: 'Preflight started', ts: new Date().toISOString() });
  } else if (a === 'login') {
    if (desktop) await desktop.login();
    else await api('/api/login', { method: 'POST' });
    appendLog({ level: 'info', message: 'Login window opening', ts: new Date().toISOString() });
  } else if (a === 'reconnect') {
    if (desktop) await desktop.reconnect();
    else await api('/api/reconnect', { method: 'POST' });
    appendLog({ level: 'info', message: 'Reconnect started — sign in in Chrome', ts: new Date().toISOString() });
  } else if (a === 'refresh-session') {
    if (desktop) {
      renderSession({ checking: true }, null);
      const session = await desktop.refreshSession();
      renderSession(session, null);
    } else {
      await api('/api/session/refresh', { method: 'POST' });
    }
    appendLog({ level: 'info', message: 'Connection checked', ts: new Date().toISOString() });
  } else if (a === 'open-config') {
    if (desktop) {
      const r = await desktop.openConfigFolder();
      appendLog({ level: 'info', message: 'Opened ' + (r.path || 'settings folder'), ts: new Date().toISOString() });
    }
  } else if (a === 'stop') {
    const r = desktop ? await desktop.stop() : await api('/api/sync/stop', { method: 'POST' });
    appendLog({ level: 'warn', message: r.message, ts: new Date().toISOString() });
  } else if (a === 'toggle-on' || a === 'toggle-off') {
    const id = productId();
    if (!id) {
      alert('Enter a product ID');
      return;
    }
    const enable = a === 'toggle-on';
    if (desktop) await desktop.toggle(id, enable);
    else
      await api('/api/toggle', {
        method: 'POST',
        body: JSON.stringify({ productId: id, enable }),
      });
    appendLog({
      level: 'info',
      message: `Toggle ${enable ? 'ON' : 'OFF'} started for ${id}`,
      ts: new Date().toISOString(),
    });
  } else if (a.startsWith('sync-')) {
    const parts = a.split('-');
    const mode = parts[parts.length - 1];
    const enable = mode === 'on';
    const fresh = a.includes('fresh');
    const retryFailed = a.includes('retry');
    const opts = { enable, fresh, retryFailed, limit: syncLimit() };
    if (desktop) await desktop.syncStart(opts);
    else await api('/api/sync/start', { method: 'POST', body: JSON.stringify(opts) });
    appendLog({
      level: 'info',
      message: `Sync started (ads ${enable ? 'ON' : 'OFF'}${fresh ? ', fresh' : ''})`,
      ts: new Date().toISOString(),
    });
  }
  refreshStatus();
}

document.querySelectorAll('[data-action]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    try {
      await runAction(btn.dataset.action);
    } catch (e) {
      appendLog({ level: 'error', message: e.message, ts: new Date().toISOString() });
      alert(e.message);
    }
  });
});

$('clearLog').addEventListener('click', () => {
  logView.innerHTML = '';
  logLines.length = 0;
});

connectEvents();
refreshStatus();
setInterval(refreshStatus, 15000);
