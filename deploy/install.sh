#!/usr/bin/env bash
# DigitalOcean / Ubuntu VPS installer for Etsy off-site ads watch
# Usage: sudo bash deploy/install.sh
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/etsy-ads/app}"
DATA_ROOT="${DATA_ROOT:-/var/lib/etsy-ads}"
SERVICE_USER="${SERVICE_USER:-etsy-ads}"
REPO_URL="${REPO_URL:-https://github.com/wtmjames1229-lab/poster-automation.git}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo bash deploy/install.sh"
  exit 1
fi

echo "==> Installing system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates xvfb fonts-liberation libnss3 libatk-bridge2.0-0 \
  libdrm2 libxkbcommon0 libgbm1 libasound2t64 libxshmfence1 || \
apt-get install -y -qq git curl ca-certificates xvfb fonts-liberation libnss3 libatk-bridge2.0-0 \
  libdrm2 libxkbcommon0 libgbm1 libasound2 libxshmfence1

if ! command -v node >/dev/null 2>&1 || [[ "$(node -p process.versions.node.split('.')[0])" -lt 18 ]]; then
  echo "==> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
fi

echo "==> Service user: $SERVICE_USER"
if ! id "$SERVICE_USER" &>/dev/null; then
  useradd --system --home "$DATA_ROOT" --shell /usr/sbin/nologin "$SERVICE_USER"
fi

mkdir -p "$DATA_ROOT"/{data,logs}
chown -R "$SERVICE_USER:$SERVICE_USER" "$DATA_ROOT"

echo "==> Application at $APP_ROOT"
mkdir -p "$(dirname "$APP_ROOT")"
if [[ ! -d "$APP_ROOT/.git" ]]; then
  if [[ -d "$APP_ROOT" ]]; then
    echo "Using existing files in $APP_ROOT"
  else
    git clone "$REPO_URL" "$APP_ROOT"
  fi
else
  sudo -u "$SERVICE_USER" git -C "$APP_ROOT" pull --ff-only || true
fi

PKG="$APP_ROOT/etsy-offsite-ads"
if [[ ! -f "$PKG/package.json" ]]; then
  echo "Missing $PKG/package.json — set APP_ROOT to your clone path"
  exit 1
fi

echo "==> npm install + Playwright..."
cd "$PKG"
sudo -u "$SERVICE_USER" env HOME="$DATA_ROOT" npm ci
sudo -u "$SERVICE_USER" env HOME="$DATA_ROOT" npx playwright install chromium
sudo -u "$SERVICE_USER" env HOME="$DATA_ROOT" npx playwright install-deps chromium || true

if [[ ! -f "$DATA_ROOT/.env" ]]; then
  cp "$APP_ROOT/deploy/env.template" "$DATA_ROOT/.env"
  chmod 600 "$DATA_ROOT/.env"
  chown "$SERVICE_USER:$SERVICE_USER" "$DATA_ROOT/.env"
  echo ""
  echo "!! Edit secrets: nano $DATA_ROOT/.env"
  echo ""
fi

echo "==> systemd units..."
sed "s|/opt/etsy-ads/app|$APP_ROOT|g" "$APP_ROOT/deploy/systemd/etsy-ads-watch.service" \
  > /etc/systemd/system/etsy-ads-watch.service
cp "$APP_ROOT/deploy/systemd/etsy-ads-watch.timer" /etc/systemd/system/

systemctl daemon-reload
systemctl enable etsy-ads-watch.timer
systemctl start etsy-ads-watch.timer

echo ""
echo "=============================================="
echo "  Installed. Timer: every 6 hours"
echo "  Config:  $DATA_ROOT/.env"
echo "  Logs:    $DATA_ROOT/logs/watch.log"
echo ""
echo "  One-time login (pick one):"
echo "    cd $PKG && sudo -u $SERVICE_USER DEPLOY_MODE=vps APP_USER_DATA=$DATA_ROOT npm run vps:login"
echo "    — or copy printify_session.json from your PC (see deploy/README.md)"
echo ""
echo "  Test now:"
echo "    sudo systemctl start etsy-ads-watch.service"
echo "    tail -f $DATA_ROOT/logs/watch.log"
echo "=============================================="
