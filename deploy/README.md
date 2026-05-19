# DigitalOcean VPS deployment

Production deployment for **autonomous** Etsy off-site ads watch. Runs on **your** VPS (persistent Chrome profile), not GitHub cloud.

## Requirements

| Resource | Minimum |
|----------|---------|
| Droplet | Ubuntu 22.04 or 24.04 |
| RAM | 2 GB (4 GB recommended for first full sync) |
| Disk | 10 GB |
| Ports | Outbound HTTPS only |

## Quick install (recommended)

On a fresh droplet:

```bash
sudo apt update && sudo apt install -y git
git clone https://github.com/wtmjames1229-lab/poster-automation.git /opt/etsy-ads/app
cd /opt/etsy-ads/app
sudo bash deploy/install.sh
```

Edit secrets:

```bash
sudo nano /var/lib/etsy-ads/.env
```

### One-time Printify login (choose one)

**A — Import session from your PC** (best if VPS hits captcha)

On Windows (after `npm run login` locally):

```powershell
scp etsy-offsite-ads\printify_session.json root@YOUR_DROPLET_IP:/var/lib/etsy-ads/printify_session.json
scp -r etsy-offsite-ads\data\chrome-profile root@YOUR_DROPLET_IP:/var/lib/etsy-ads/data/chrome-profile
sudo chown -R etsy-ads:etsy-ads /var/lib/etsy-ads
```

**B — Login on the VPS** (virtual display)

```bash
cd /opt/etsy-ads/app/etsy-offsite-ads
sudo -u etsy-ads env DEPLOY_MODE=vps APP_USER_DATA=/var/lib/etsy-ads npm run vps:login
```

### Run / logs

```bash
# Manual run
sudo systemctl start etsy-ads-watch.service

# Follow logs
tail -f /var/lib/etsy-ads/logs/watch.log

# Timer status (every 6h)
systemctl status etsy-ads-watch.timer
```

## Layout

```text
/opt/etsy-ads/app/          # git clone (this repo)
/var/lib/etsy-ads/
  .env                      # secrets (chmod 600)
  printify_session.json     # optional export
  data/
    chrome-profile/         # persistent login (primary)
    ads-watch-state.json    # progress between runs
  logs/
    watch.log
```

## Docker (optional)

```bash
cp deploy/env.template /var/lib/etsy-ads/.env
# edit /var/lib/etsy-ads/.env

cd /opt/etsy-ads/app
docker compose -f deploy/docker/docker-compose.yml build
docker compose -f deploy/docker/docker-compose.yml run --rm etsy-ads-watch
```

Mount data: `ETSY_ADS_ENV_FILE=/var/lib/etsy-ads/.env`

## Operations

| Task | Command |
|------|---------|
| Change ads on/off | Edit `OFFSITE_ADS_ENABLED` in `.env`, restart service |
| Watch status | `cd etsy-offsite-ads && sudo -u etsy-ads env APP_USER_DATA=/var/lib/etsy-ads npm run watch:status` |
| Dry-run queue | `npm run watch:dry` (with env vars set) |
| Update code | `cd /opt/etsy-ads/app && git pull && cd etsy-offsite-ads && sudo -u etsy-ads npm ci` |
| Re-login | `npm run vps:login` or re-import session |

## vs GitHub Actions cloud

| | VPS (this guide) | GitHub cloud workflow |
|--|------------------|------------------------|
| Autonomous | Yes (after one login) | No — session expires / captcha |
| Cost | ~$6–12/mo droplet | Free tier minutes |
| PC must be on | No | No |

## Troubleshooting

**Session expired in logs**

Re-import session from PC or run `npm run vps:login`.

**Captcha on VPS**

Use session import from your home PC (option A above).

**Out of memory**

Resize droplet to 4 GB or set `ADS_WATCH` limit: `node src/adsWatch.js --limit 20` in a custom systemd override.
