# Printify POD + Etsy Off-Site Ads Automation

Automates your Printify → Etsy workflow and **Etsy off-site ads** toggles in the Printify UI.

| Component | Folder | Purpose |
|-----------|--------|---------|
| POD pipeline | `automation.js` (root) | Gemini → Printify → Etsy publishing |
| **Ads toggle + watch** | [`etsy-offsite-ads/`](etsy-offsite-ads/) | Toggle off-site ads; scheduled set-and-forget mode |

---

## GitHub: run automatically after upload

**→ Follow [`GITHUB_SETUP.md`](GITHUB_SETUP.md)** — checklist for secrets, first login, and enabling the scheduler.

Summary:

1. Push this repo to GitHub: **https://github.com/wtmjames1229-lab/poster-automation** (private recommended).
2. Add secrets (Printify API, login, session base64, email).
3. Run workflow **Etsy Ads Watch** manually once, then it runs every 6 hours.

No server required — uses **GitHub Actions**.

---

## Local quick start (ads toggle only)

```powershell
cd etsy-offsite-ads
npm install
npx playwright install chromium
copy .env.example .env
# Edit .env with your Printify credentials

npm run login
npm run session:export
npm run preflight

npm run watch:dry
npm run watch
```

Full CLI/GUI docs: **[`etsy-offsite-ads/RUN.md`](etsy-offsite-ads/RUN.md)**

---

## Root commands (from this folder)

```powershell
npm install
npm run ads:watch          # scheduled-style watch (local)
npm run ads:login
npm run ads:sync:off
npm run ads:desktop        # Electron GUI
npm start                  # main POD automation.js
```

---

## What gets committed vs ignored

| Commit | Do not commit |
|--------|----------------|
| Source code, workflows, `.env.example` | `.env`, `printify_session.json` |
| `package-lock.json` | `node_modules/`, `data/chrome-profile/` |
| `data/.gitkeep` | `data/*.json` job/state files |

---

## License

Private use for your Printify shop. Keep API keys and sessions out of git.
