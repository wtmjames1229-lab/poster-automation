// cleanup.js -- Etsy listing renewal script
// Checks listings aged 100-110 days; renews if views >= 10, lets expire if views < 10.
// Run with: node cleanup.js

require('dotenv').config()

var ETSY_API_KEY       = process.env.ETSY_API_KEY;
var ETSY_SHARED_SECRET = process.env.ETSY_SHARED_SECRET;
var ETSY_REFRESH_TOKEN = process.env.ETSY_REFRESH_TOKEN;
var SHOP_ID            = process.env.ETSY_SHOP_ID;
var ACCESS_TOKEN       = process.env.ETSY_ACCESS_TOKEN; // fallback only; always refreshed at start

var BASE_URL  = 'https://openapi.etsy.com/v3/application';
var TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token';

var CHECK_WINDOW_MIN = 100; // days
var CHECK_WINDOW_MAX = 110; // days

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

async function retry(fn, attempts, delayMs) {
  attempts = attempts || 3;
  delayMs  = delayMs  || 5000;
  var lastErr;
  for (var i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        console.log('  [retry] attempt ' + (i + 1) + ' failed: ' + err.message + ' -- retrying in ' + (delayMs / 1000) + 's');
        await sleep(delayMs);
      }
    }
  }
  throw lastErr;
}

function etsyHeaders() {
  var apiKeyValue = ETSY_SHARED_SECRET
    ? ETSY_API_KEY + ':' + ETSY_SHARED_SECRET
    : ETSY_API_KEY;
  return {
    'x-api-key': apiKeyValue,
    'Authorization': 'Bearer ' + ACCESS_TOKEN,
    'Content-Type': 'application/json'
  };
}

async function etsyFetch(path, options) {
  var url = BASE_URL + path;
  var res = await fetch(url, Object.assign({ headers: etsyHeaders() }, options || {}));
  if (!res.ok) {
    var body = '';
    try { body = await res.text(); } catch(e) {}
    throw new Error('Etsy API ' + res.status + ' for ' + path + ': ' + body);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// OAuth token refresh -- called at the very start of every run
// ---------------------------------------------------------------------------

async function refreshAccessToken() {
  console.log('=== OAuth Token Refresh ===');
  if (!ETSY_REFRESH_TOKEN) throw new Error('Missing env var: ETSY_REFRESH_TOKEN');
  if (!ETSY_API_KEY)       throw new Error('Missing env var: ETSY_API_KEY');

  var body = new URLSearchParams();
  body.append('grant_type',    'refresh_token');
  body.append('client_id',     ETSY_API_KEY);
  body.append('refresh_token', ETSY_REFRESH_TOKEN);

  var res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });

  var data;
  try { data = await res.json(); } catch(e) { data = {}; }

  if (!res.ok) {
    throw new Error('Token refresh failed (' + res.status + '): ' + JSON.stringify(data));
  }

  if (!data.access_token) {
    throw new Error('Token refresh response missing access_token: ' + JSON.stringify(data));
  }

  ACCESS_TOKEN = data.access_token;
  console.log('Access token refreshed successfully.');

  // Etsy rotates refresh tokens on each use -- log the new one prominently
  if (data.refresh_token) {
    ETSY_REFRESH_TOKEN = data.refresh_token;
    console.log('NEW_REFRESH_TOKEN: ' + data.refresh_token);
  } else {
    console.log('Note: Etsy did not return a new refresh_token (token may not rotate for this grant).');
  }

  if (data.expires_in) {
    console.log('Token expires in: ' + data.expires_in + ' seconds');
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function fetchShopId() {
  console.log('ETSY_SHOP_ID not set -- fetching from Etsy API...');
  var data = await retry(function() {
    return etsyFetch('/users/@me/shops');
  });
  var shops = data.results || (Array.isArray(data) ? data : []);
  if (shops.length === 0) throw new Error('No Etsy shops found for authenticated user');
  var id = String(shops[0].shop_id);
  console.log('Discovered Etsy Shop ID: ' + id);
  return id;
}

async function fetchAllActiveListings() {
  var allListings = [];
  var offset = 0;
  var limit = 100;
  while (true) {
    var data = await retry(function() {
      return etsyFetch('/shops/' + SHOP_ID + '/listings?state=active&limit=' + limit + '&offset=' + offset);
    });
    var results = data.results || [];
    allListings = allListings.concat(results);
    if (results.length < limit) break;
    offset += limit;
  }
  return allListings;
}

async function fetchListingStats(listingId) {
  var data = await retry(function() {
    return etsyFetch('/shops/' + SHOP_ID + '/listings/' + listingId + '/stats');
  });
  return data;
}

async function renewListing(listingId) {
  await retry(function() {
    return etsyFetch('/shops/' + SHOP_ID + '/listings/' + listingId + '/renew', { method: 'POST' });
  });
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function run() {
  if (!ETSY_API_KEY)       throw new Error('Missing env var: ETSY_API_KEY');
  if (!ETSY_REFRESH_TOKEN) throw new Error('Missing env var: ETSY_REFRESH_TOKEN');

  // Always get a fresh access token first -- never rely on the stored token being valid
  await refreshAccessToken();

  if (!SHOP_ID) { SHOP_ID = await fetchShopId(); }

  console.log('=== Etsy Listing Cleanup ===');
  console.log('Shop ID      : ' + SHOP_ID);
  console.log('Check window : ' + CHECK_WINDOW_MIN + '-' + CHECK_WINDOW_MAX + ' days old');
  console.log('');

  var listings = await fetchAllActiveListings();
  console.log('Total active listings fetched: ' + listings.length);
  console.log('');

  var now = Date.now();

  var totalChecked  = 0;
  var totalInWindow = 0;
  var totalRenewed  = 0;
  var totalExpire   = 0;

  for (var i = 0; i < listings.length; i++) {
    var listing   = listings[i];
    var listingId = listing.listing_id;

    var createdTs = listing.original_creation_tsz;
    if (!createdTs) {
      console.log('[' + listingId + '] SKIP -- no original_creation_tsz field');
      continue;
    }

    var ageDays = (now - createdTs * 1000) / (1000 * 60 * 60 * 24);
    totalChecked++;

    if (ageDays < CHECK_WINDOW_MIN) {
      console.log('[' + listingId + '] age=' + ageDays.toFixed(1) + 'd -> too-young (< ' + CHECK_WINDOW_MIN + 'd), ignored');
      continue;
    }

    if (ageDays > CHECK_WINDOW_MAX) {
      console.log('[' + listingId + '] age=' + ageDays.toFixed(1) + 'd -> too-old (> ' + CHECK_WINDOW_MAX + 'd), ignored');
      continue;
    }

    totalInWindow++;
    console.log('[' + listingId + '] age=' + ageDays.toFixed(1) + 'd -> IN WINDOW -- fetching stats...');

    var stats;
    try {
      stats = await fetchListingStats(listingId);
    } catch (err) {
      console.log('[' + listingId + '] ERROR fetching stats: ' + err.message + ' -- skipping');
      continue;
    }

    var views = (stats && stats.views != null) ? stats.views : 0;

    if (views < 10) {
      console.log('[' + listingId + '] age=' + ageDays.toFixed(1) + 'd views=' + views + ' -> SKIPPED (< 10 views, let expire)');
      totalExpire++;
    } else {
      console.log('[' + listingId + '] age=' + ageDays.toFixed(1) + 'd views=' + views + ' -> RENEWING...');
      try {
        await renewListing(listingId);
        console.log('[' + listingId + '] RENEWED successfully');
        totalRenewed++;
      } catch (err) {
        console.log('[' + listingId + '] ERROR renewing: ' + err.message);
      }
    }

    if (i < listings.length - 1) await sleep(500);
  }

  console.log('');
  console.log('=== Summary ===');
  console.log('Total listings checked     : ' + totalChecked);
  console.log('In check window (100-110d) : ' + totalInWindow);
  console.log('Renewed (views >= 10)      : ' + totalRenewed);
  console.log('Left to expire (views < 10): ' + totalExpire);
  console.log('');
  if (ETSY_REFRESH_TOKEN && ETSY_REFRESH_TOKEN !== process.env.ETSY_REFRESH_TOKEN) {
    console.log('=== ACTION REQUIRED ===');
    console.log('Etsy issued a new refresh token. Update your ETSY_REFRESH_TOKEN GitHub secret:');
    console.log('NEW_REFRESH_TOKEN: ' + ETSY_REFRESH_TOKEN);
  }
}

run().catch(function(err) {
  console.error('Fatal error: ' + err.message);
  process.exit(1);
});
