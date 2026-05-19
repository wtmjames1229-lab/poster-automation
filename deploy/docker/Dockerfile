FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /app/etsy-offsite-ads

ENV DEPLOY_MODE=vps \
    APP_USER_DATA=/data \
    NODE_ENV=production \
    PLAYWRIGHT_USE_PROFILE=true \
    PLAYWRIGHT_PREFER_SESSION=false \
    PLAYWRIGHT_HEADLESS=true \
    PRINTIFY_NAV_VIA_PRODUCTS=true \
    ADS_WATCH_AUTO_RELOGIN=true

RUN apt-get update && apt-get install -y xvfb && rm -rf /var/lib/apt/lists/*

COPY etsy-offsite-ads/package*.json ./
RUN npm ci

COPY etsy-offsite-ads/ ./

RUN npx playwright install chromium

VOLUME ["/data"]

CMD ["node", "src/adsWatch.js"]
