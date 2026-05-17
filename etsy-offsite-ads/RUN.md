# Etsy Off-Site Ads Toggle — Run Guide

> **GitHub (upload & automate):** start with **[`../GITHUB_SETUP.md`](../GITHUB_SETUP.md)** at the repo root.

This document explains how to install, configure, and run the **Printify Etsy off-site ads** toggle system from the terminal (and optional desktop UI).

The tool automates the **“Etsy off-site ads”** switch on each Printify product page. Printify does not expose this setting via API, so the app uses:

1. **Printify API** — list products published to Etsy  
2. **Playwright + Chrome** — open each product in Printify and click the toggle  

It lives in the standalone folder `etsy-offsite-ads/` and is separate from the main `automation.js` POD pipeline.

---

## Table of contents

1. [What you need](#1-what-you-need)  
2. [Project layout](#2-project-layout)  
3. [Installation](#3-installation)  
4. [Configuration (`.env`)](#4-configuration-env)  
5. [First-time setup: Printify login](#5-first-time-setup-printify-login)  
6. [Verify everything works](#6-verify-everything-works)  
7. [Desktop app (optional)](#7-desktop-app-optional)  
8. [Single product toggle](#8-single-product-toggle)  
9. [Bulk sync (entire Etsy store)](#9-bulk-sync-entire-etsy-store)  
10. [Commands reference](#10-commands-reference)  
11. [How resumable jobs work](#11-how-resumable-jobs-work)  
12. [Recommended workflows](#12-recommended-workflows)  
13. [Troubleshooting](#13-troubleshooting)  
14. [Security](#14-security)  

---

## 1. What you need

| Requirement | Notes |
|-------------|--------|
| **Node.js 18+** | [nodejs.org](https://nodejs.org) — check with `node -v` |
| **npm** | Included with Node |
| **Google Chrome** | Playwright uses installed Chrome (`channel: 'chrome'`) |
| **Printify account** | API token, login email/password, shop ID |
| **Windows / macOS / Linux** | Commands below use PowerShell-style paths on Windows; use your OS shell equivalent |

---

## 2. Project layout

```
New folder (2)/
├── .env                          # Main project env (can be used by ads tool)
├── automation.js                 # POD pipeline (separate from ads toggle)
└── etsy-offsite-ads/             # ← This toggle system
    ├── .env                      # Ads-specific env (optional; copied from root)
    ├── .env.example
    ├── RUN.md                    # This file
    ├── package.json
    ├── bin/toggle.js             # CLI: single product + sync wrapper
    ├── scripts/
    │   ├── headedLogin.js        # Visible Chrome login
    │   ├── exportSession.js      # Save cookies to session file
    │   ├── verifySession.js      # Test session
    │   └── preflight.js          # API + session check
    ├── src/
    │   ├── adsSync.js            # Bulk sync entry
    │   ├── adsSyncEngine.js      # Bulk loop
    │   ├── adsJobStore.js        # Resumable job file
    │   ├── offsiteAds.js         # Playwright toggle core
    │   └── printifyShop.js       # Printify API catalog
    ├── desktop/                  # Electron GUI (optional)
    ├── public/                   # GUI assets
    └── data/
        ├── ads-sync-job.json     # Bulk job checkpoint (created at runtime)
        └── chrome-profile/       # Persistent browser profile (login)
    printify_session.json         # Exported cookies (created after login)
```

---

## 3. Installation

Open a terminal in the **project root** or go straight into the ads package.

### Option A — from `etsy-offsite-ads` (recommended)

```powershell
cd "c:\Users\afnan\Desktop\New folder (2)\etsy-offsite-ads"
npm install
npx playwright install chromium
```

### Option B — shortcuts from project root

Root `package.json` includes helpers that `cd` into `etsy-offsite-ads` for you (see [§10](#10-commands-reference)).

You only need to run `npm install` **inside `etsy-offsite-ads`** once (or after pulling dependency changes).

---

## 4. Configuration (`.env`)

The tool loads environment variables from:

1. `etsy-offsite-ads/.env` (primary)  
2. If missing, it may copy from the **parent** `.env` at project root on first run  

### Create / copy config

```powershell
cd etsy-offsite-ads
copy "..\.env" ".env"
```

Or copy from the template:

```powershell
copy .env.example .env
```

Then edit `.env` with your values.

### Required variables

| Variable | Description |
|----------|-------------|
| `PRINTIFY_API_KEY` | Printify API token (Shop → API) |
| `PRINTIFY_EMAIL` | Printify login email |
| `PRINTIFY_PASSWORD` | Printify login password |
| `PRINTIFY_SHOP_ID` | Numeric shop ID (e.g. `18634010` for Snoopy) |

### Recommended variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PRINTIFY_SHOP_NAME` | — | Display name only (GUI) |
| `PLAYWRIGHT_USE_PROFILE` | `true` | Use persistent Chrome profile in `data/chrome-profile` |
| `PLAYWRIGHT_PREFER_SESSION` | `false` | Prefer profile over `printify_session.json` when both exist |
| `PLAYWRIGHT_HEADLESS` | `true` | `false` = visible browser during toggles (debugging) |
| `PLAYWRIGHT_TIMEOUT_MS` | `90000` | Page/action timeout (ms) |
| `PRINTIFY_NAV_VIA_PRODUCTS` | `false` | `false` = open product URL directly (faster, more reliable) |
| `ADS_SYNC_DELAY_MS` | `1800` | Pause between products in bulk sync (ms) |

### Optional path overrides

Usually leave unset — defaults are under `etsy-offsite-ads/`:

| Variable | Default location |
|----------|------------------|
| `PRINTIFY_SESSION_FILE` | `./printify_session.json` |
| `PLAYWRIGHT_USER_DATA_DIR` | `./data/chrome-profile` |
| `ADS_SYNC_JOB_FILE` | `./data/ads-sync-job.json` |

---

## 5. First-time setup: Printify login

Bulk sync and toggles need a **valid Printify browser session**. API key alone is not enough for the UI toggle.

### Step 1 — Headed login

Chrome opens visibly. Sign in, complete captcha if shown, wait until you are on the Printify dashboard.

```powershell
cd etsy-offsite-ads
npm run login
```

This runs `scripts/headedLogin.js` and saves your session into `data/chrome-profile/`.

### Step 2 — Export session cookies (recommended)

```powershell
npm run session:export
```

Creates/updates `printify_session.json` as a backup session source.

### Step 3 — Verify session (optional)

```powershell
npm run verify
```

Exits with code `0` if the session can open a product page while logged in.

**When to repeat:** Session expires after days/weeks, after password change, or if you see “No valid Printify session” errors. Run `npm run login` and `npm run session:export` again.

---

## 6. Verify everything works

### Preflight (API + browser)

```powershell
npm run preflight
```

This will:

- Call the Printify API and count Etsy-published listings  
- Launch headless Chrome and verify login  

Expect **1–2 minutes** on first run while it loads a real product page.

### Quick single-product test

Pick a Printify product ID from your dashboard URL, e.g.  
`https://printify.com/app/product-details/6a08463f315e8641c5061426` → ID is `6a08463f315e8641c5061426`.

```powershell
node bin/toggle.js off 6a08463f315e8641c5061426
```

Output includes `"changed": true` if the switch was clicked, or `"changed": false` if ads were already OFF.

---

## 7. Desktop app (optional)

Graphical UI with connection status, bulk sync buttons, and live log — still started from the terminal:

```powershell
cd etsy-offsite-ads
npm start
```

From project root:

```powershell
npm run ads:desktop
```

**GUI features:**

- **Reconnect Printify** — login + export session + verify  
- **Check connection** — refresh session status  
- **Bulk sync** — ON/OFF, resume, retry failed, fresh job, product limit  
- **Open settings folder** — opens the folder containing `.env` and session data  

---

## 8. Single product toggle

### Enable ads (ON)

```powershell
node bin/toggle.js on <productId>
```

### Disable ads (OFF)

```powershell
node bin/toggle.js off <productId>
```

### Via npm script

```powershell
npm run toggle -- off <productId>
npm run toggle -- on <productId>
```

Each run: checks session → opens product page → reads toggle → clicks if needed → closes browser.

---

## 9. Bulk sync (entire Etsy store)

Bulk mode builds a **job** of all Etsy-published products (via API), then processes them one by one in Chrome.

### Turn ads OFF for the whole store (new job)

```powershell
node src/adsSync.js --off --fresh
```

### Turn ads ON for the whole store (new job)

```powershell
node src/adsSync.js --on --fresh
```

### Pilot run (first N products only)

Always test before a full ~375 listing run:

```powershell
node src/adsSync.js --off --fresh --limit 5
```

### Resume after stop or crash

If `data/ads-sync-job.json` exists and you did **not** use `--fresh`:

```powershell
node src/adsSync.js --off
```

Pending products continue automatically. No `--resume` flag is required — resuming is the default when a job file exists.

### Retry only failed products

```powershell
node src/adsSync.js --off --retry-failed
```

### Switch target (ON ↔ OFF)

You cannot change ON/OFF on the same job file. Start a new job:

```powershell
node src/adsSync.js --on --fresh
```

### Canvas blueprint only

Only products using the canvas blueprint (default blueprint ID `1297`):

```powershell
node src/adsSync.js --off --fresh --canvas-only
```

### View job status

```powershell
npm run sync:status
# or
node src/adsSync.js --status
```

### Bulk sync options

| Flag | Description |
|------|-------------|
| `--on` / `--off` | Target state (required for sync) |
| `--fresh` | Delete previous job; rebuild catalog from API |
| `--retry-failed` | Reset failed items to pending and run only those |
| `--limit N` | Process only first N pending products |
| `--canvas-only` | Filter to canvas blueprint on Etsy |
| `--delay=1800` | Ms between products (overrides `ADS_SYNC_DELAY_MS`) |
| `--checkpoint-every=5` | Save job file every N products |
| `--status` | Print job summary and exit |

### npm shortcuts (inside `etsy-offsite-ads`)

```powershell
npm run sync:off
npm run sync:on
npm run sync:status
```

These run `adsSync.js` without extra flags (resume existing job if present).

---

## 10. Commands reference

### From `etsy-offsite-ads/`

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npx playwright install chromium` | Install browser binary |
| `npm run login` | Headed Printify login |
| `npm run session:export` | Export cookies to `printify_session.json` |
| `npm run verify` | Test session |
| `npm run preflight` | API + session preflight |
| `npm run toggle -- off <id>` | Single product OFF |
| `npm run toggle -- on <id>` | Single product ON |
| `npm run sync:off` | Bulk OFF (resume if job exists) |
| `npm run sync:on` | Bulk ON (resume if job exists) |
| `npm run sync:status` | Job status |
| `npm start` | Desktop GUI |

### From project root (`New folder (2)/`)

| Command | Purpose |
|---------|---------|
| `npm run ads:login` | Headed login |
| `npm run ads:preflight` | Preflight |
| `npm run ads:sync:off` | Bulk OFF |
| `npm run ads:sync:on` | Bulk ON |
| `npm run ads:sync:status` | Job status |
| `npm run ads:desktop` | Desktop GUI |

### `bin/toggle.js` wrapper

```powershell
node bin/toggle.js off <productId>
node bin/toggle.js on <productId>
node bin/toggle.js status
node bin/toggle.js sync --off --fresh --limit 10
node bin/toggle.js --help
```

---

## 11. How resumable jobs work

1. **`--fresh`** — Fetches all Etsy-published products from Printify API and writes `data/ads-sync-job.json`.  
2. Each product is marked `pending` → `done` or `failed`.  
3. The job file is saved every few products (`--checkpoint-every`).  
4. If you **Ctrl+C** or lose connection, run again **without** `--fresh`:  
   `node src/adsSync.js --off`  
5. Stats tracked: `done`, `changed`, `unchanged` (already correct state), `failed`.

**Job file path:** `etsy-offsite-ads/data/ads-sync-job.json`

---

## 12. Recommended workflows

### A — First time on a new machine

```powershell
cd etsy-offsite-ads
npm install
npx playwright install chromium
copy "..\.env" ".env"
npm run login
npm run session:export
npm run preflight
node src/adsSync.js --off --fresh --limit 3
```

If the pilot looks good:

```powershell
node src/adsSync.js --off --fresh
```

### B — Turn off ads for entire Snoopy Etsy store

```powershell
node src/adsSync.js --off --fresh
```

Monitor with:

```powershell
node src/adsSync.js --status
```

### C — Session expired mid-sync

```powershell
npm run login
npm run session:export
node src/adsSync.js --off
```

### D — Some products failed

```powershell
node src/adsSync.js --status
node src/adsSync.js --off --retry-failed
```

### E — Debug with visible browser

In `.env`:

```env
PLAYWRIGHT_HEADLESS=false
```

Then run a single toggle or `--limit 1` bulk test.

---

## 13. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| `Missing required env: PRINTIFY_API_KEY` | `.env` missing or empty | Fill `.env` in `etsy-offsite-ads` or copy from root |
| `No valid Printify session` | Cookies expired | `npm run login` → `npm run session:export` |
| Preflight hangs ~60–120s | Normal on first product page load | Wait; or reduce scope with `--limit 1` |
| `Existing job targets ads ON; you requested OFF` | Job file mismatch | Use `--fresh` for a new direction |
| Toggle says `changed: false` | Ads already in target state | Expected; not an error |
| Playwright / Chrome errors | Chrome not installed | Install Chrome; run `npx playwright install chromium` |
| API returns 401 | Bad API key | Regenerate token in Printify |
| Overlay / click blocked on products list | Known UI issue | Keep `PRINTIFY_NAV_VIA_PRODUCTS=false` (direct URL) |
| Bulk run very slow | ~1–2 min per product is normal | Use `--limit` for tests; adjust `--delay` if needed |

### Logs and artifacts

- **Terminal** — all `[sync]`, `[toggle]`, `[offsiteAds]` lines  
- **Desktop app** — Activity log panel  
- **Job file** — `data/ads-sync-job.json` (failed product errors in `lastError`)  

### Stop a running bulk sync

- Terminal: **Ctrl+C**  
- Desktop: **Stop current task**  

Then resume with `node src/adsSync.js --off` (no `--fresh`).

---

## 14. Security

- Keep **`.env` out of git** — it contains API key and password.  
- Rotate `PRINTIFY_API_KEY` if it was ever shared or committed.  
- `printify_session.json` and `data/chrome-profile/` are as sensitive as your login — do not share them.  
- This tool is for **your own shop** automation only; respect Printify’s terms of service.  

---

## Quick command cheat sheet

```powershell
# Setup (once)
cd etsy-offsite-ads && npm install && npx playwright install chromium
npm run login && npm run session:export && npm run preflight

# One product
node bin/toggle.js off PRODUCT_ID

# Full store OFF (new job)
node src/adsSync.js --off --fresh

# Continue / status
node src/adsSync.js --off
node src/adsSync.js --status

# GUI
npm start
```

For questions about the main POD pipeline (`automation.js`), see the root project — this package only handles **Etsy off-site ads** toggles on Printify.

---

## 15. Automatic watch mode (set-and-forget)

Watch mode runs on a **schedule** (e.g. GitHub Actions). It does **not** replace manual CLI or desktop tools — it uses separate state files:

| File | Purpose |
|------|---------|
| `data/ads-watch-state.json` | Long-term registry (which products are synced) |
| `data/ads-watch-job.json` | Checkpoint for the **current** watch run only |
| `data/ads-sync-job.json` | Unchanged — still used by `adsSync.js` / desktop bulk |

### Behaviour

1. **First run** — Queues every Etsy-published product not yet marked `done` in watch state; toggles each to `OFFSITE_ADS_ENABLED` (default: ads **OFF**).
2. **Later runs** — API diff: only **new** Etsy listings + optional **failed** retries.
3. **Email** — Sent when secrets are missing, session expired, or any product fails (if mail is configured).

### Local commands

```powershell
cd etsy-offsite-ads
npm run watch:dry      # show queue, no browser
npm run watch          # run watch now
npm run watch:status   # registry stats
```

From project root: `npm run ads:watch`

### Email configuration

Set in `.env`:

```env
MAIL_TO=you@example.com
MAIL_FROM=ads-watch@yourdomain.com
SENDGRID_API_KEY=SG.xxx
```

Or SMTP (requires `nodemailer`, installed with `npm install`):

```env
MAIL_SMTP_HOST=smtp.gmail.com
MAIL_SMTP_PORT=587
MAIL_SMTP_USER=you@gmail.com
MAIL_SMTP_PASS=app-password
```

### GitHub Actions setup

Workflow: `.github/workflows/ads-watch.yml` (every 6 hours + manual trigger).

**Required secrets**

| Secret | Description |
|--------|-------------|
| `PRINTIFY_API_KEY` | API token |
| `PRINTIFY_EMAIL` | Login email |
| `PRINTIFY_PASSWORD` | Login password |
| `PRINTIFY_SHOP_ID` | e.g. `18634010` |
| `PRINTIFY_SESSION_B64` | Base64 of `printify_session.json` |
| `MAIL_TO` | Alert recipient |
| `SENDGRID_API_KEY` or `MAIL_SMTP_*` | Email delivery |

**Create session secret (after local login):**

```powershell
cd etsy-offsite-ads
npm run login
npm run session:export
npm run session:b64
```

Copy the printed line into GitHub → Settings → Secrets → `PRINTIFY_SESSION_B64`.

**Refresh session** when you receive a “session expired” email (typically monthly).

**State between CI runs** — stored in GitHub Actions cache (`ads-watch-state-<shopId>-v1`). First workflow run performs the full initial sync; later runs are incremental.

**Optional variable:** `OFFSITE_ADS_ENABLED` repository variable (`true` / `false`, default `false`).

### Watch env reference

| Variable | Default | Description |
|----------|---------|-------------|
| `OFFSITE_ADS_ENABLED` | `false` | Target: enable (`true`) or disable (`false`) off-site ads |
| `ADS_WATCH_RETRY_FAILED` | `true` | Retry failed products on next run |
| `ADS_WATCH_NOTIFY_ON_SUCCESS` | `false` | Email even when everything succeeds |
| `ADS_WATCH_CANVAS_ONLY` | `false` | Only canvas blueprint products |
| `ADS_WATCH_DELAY_MS` | `1800` | Delay between products (ms) |

### Architecture

```text
Schedule (GitHub / cron)
        │
        ▼
   adsWatch.js
        ├── API: list Etsy products
        ├── watchStore: diff → queue
        ├── ensureSession (Playwright)
        ├── adsSyncEngine: toggle queue  (same engine as manual bulk)
        ├── watchStore: mark done/failed
        └── mailer: alert on failure / session / secrets
```

Manual `npm run sync:off` and desktop bulk sync are **unchanged** and can be used anytime alongside watch mode.
