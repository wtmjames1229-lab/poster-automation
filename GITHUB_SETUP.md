# GitHub setup — run ads watch automatically

Use this checklist after uploading the repository. Estimated time: **15–20 minutes** (one-time).

---

## 1. Create the repository

1. Create a **private** repo on GitHub.
2. Push this project (do **not** push `.env` or `printify_session.json`).

```powershell
cd "c:\Users\afnan\Desktop\New folder (2)"
git init
git add .
git status
# Confirm .env and data/*.json are NOT listed
git commit -m "Initial commit: POD automation and Etsy ads watch"
git branch -M main
git remote add origin https://github.com/wtmjames1229-lab/poster-automation.git
git push -u origin main
```

---

## 2. Install locally (for login + session export)

GitHub Actions cannot complete Printify captcha for you. Log in **once on your PC**:

```powershell
cd etsy-offsite-ads
npm install
npx playwright install chromium
copy .env.example .env
```

Edit `etsy-offsite-ads\.env`:

```env
PRINTIFY_API_KEY=your_token
PRINTIFY_EMAIL=your@email.com
PRINTIFY_PASSWORD=your_password
PRINTIFY_SHOP_ID=18634010
OFFSITE_ADS_ENABLED=false
```

Then:

```powershell
npm run login
npm run session:export
npm run session:b64
```

Copy the **entire** base64 output (one long line) for step 3.

---

## 3. Add GitHub secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Required

| Secret name | Value |
|-------------|--------|
| `PRINTIFY_API_KEY` | Printify API token |
| `PRINTIFY_EMAIL` | Printify login email |
| `PRINTIFY_PASSWORD` | Printify password |
| `PRINTIFY_SHOP_ID` | e.g. `18634010` |
| `PRINTIFY_SESSION_B64` | Output of `npm run session:b64` |
| `MAIL_TO` | Email for failure/session alerts |

### Email delivery (pick one)

**Option A — SendGrid**

| Secret | Value |
|--------|--------|
| `SENDGRID_API_KEY` | SendGrid API key |
| `MAIL_FROM` | Verified sender email |

**Option B — SMTP (Gmail app password, etc.)**

| Secret | Value |
|--------|--------|
| `MAIL_SMTP_HOST` | e.g. `smtp.gmail.com` |
| `MAIL_SMTP_PORT` | `587` |
| `MAIL_SMTP_USER` | SMTP user |
| `MAIL_SMTP_PASS` | App password |
| `MAIL_FROM` | From address |

---

## 4. Optional repository variable

**Settings** → **Secrets and variables** → **Actions** → **Variables**

| Name | Value | Default |
|------|--------|---------|
| `OFFSITE_ADS_ENABLED` | `false` | Disable off-site ads on new listings |
| | `true` | Enable off-site ads |

If unset, the workflow uses `false` (ads OFF).

---

## 5. Enable Actions and run

1. **Actions** tab → enable workflows if prompted.
2. Open **Etsy Ads Watch** → **Run workflow** → **Run workflow** (manual first run).
3. Watch the log; first run processes **all** Etsy listings (can take hours for large shops).
4. Later runs only process **new** listings (state saved in Actions cache).

Schedule: every **6 hours** (edit `.github/workflows/ads-watch.yml` → `cron` to change).

---

## 6. When you get an email

| Email subject | Action |
|---------------|--------|
| **Session expired** | Local: `npm run login` → `npm run session:export` → `npm run session:b64` → update `PRINTIFY_SESSION_B64` |
| **Missing secrets** | Add/fix secrets in GitHub |
| **Run completed with N failure(s)** | Check Actions log; failed IDs listed; re-run or fix session |
| **Watch crashed** | Open failed workflow run for stack trace |

---

## 7. Verify without processing (dry run)

Locally:

```powershell
cd etsy-offsite-ads
npm run watch:dry
```

In CI, the workflow runs `--dry-run` before the real run (logs queue only; failures ignored).

---

## 8. Project layout (what GitHub runs)

```text
.github/workflows/ads-watch.yml   ← scheduler
etsy-offsite-ads/
  src/adsWatch.js                 ← watch entrypoint
  src/adsSyncEngine.js            ← shared toggle engine
  package-lock.json               ← required for npm ci
```

Manual tools (`adsSync.js`, desktop GUI) remain available locally and are **not** used by the scheduled workflow unless you run them yourself.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `npm ci` fails in Actions | Ensure `etsy-offsite-ads/package-lock.json` is committed |
| `PRINTIFY_SESSION_B64` missing | Run step 2 and add secret |
| Workflow never runs | Enable Actions; check `cron` is valid on default branch |
| All products every run | Cache miss — ensure **Save watch state** step succeeds; check `data/ads-watch-state.json` in artifacts |
| First run timeout | Increase `timeout-minutes` in workflow or use `--limit` locally first |

More detail: [`etsy-offsite-ads/RUN.md`](etsy-offsite-ads/RUN.md) section 15.
