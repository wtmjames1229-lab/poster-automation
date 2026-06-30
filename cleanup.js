// cleanup.js -- Etsy listing renewal script
// Scans EXPIRED listings (state=expired); renews high-view ones (>= 10 views) back to active.
// Etsy v3 does NOT have a dedicated /renew endpoint.
// Renewal = PATCH /shops/{shop_id}/listings/{listing_id} with { state: "active" }.
// Listings expire automatically after 120 days. There is no supported way to renew early
// via the v3 API -- the only valid operation is to republish an already-expired listing.
// Run with: node cleanup.js

require('dotenv').config()

var ETSY_API_KEY         = process.env.ETSY_API_KEY;
var ETSY_SHARED_SECRET   = process.env.ETSY_SHARED_SECRET;
var ETSY_REFRESH_TOKEN   = process.env.ETSY_REFRESH_TOKEN;
// ETSY_SHOP_ID secret is NOT required -- shop ID is discovered automatically from the access token
var ACCESS_TOKEN         = process.env.ETSY_ACCESS_TOKEN; // fallback only; always refreshed at start

var SHOP_ID; // will be set by fetchShopId() every run

var BASE_URL   = 'https://openapi.etsy.com/v3/application';
var TOKEN_URL  = 'https://api.etsy.com/v3/public/oauth/token';

var MIN_VIEWS_TO_RENEW = 10; // renew expired listings that had this many views or more

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
    'x-api-key':     apiKeyValue,
    'Authorization': 'Bearer ' + ACCESS_TOKEN,
    'Content-Type':  'application/json'
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
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString()
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

// Extract the numeric user_id from the Etsy access token.
// Etsy access tokens are formatted as: {user_id}.{random_string}
// e.g. "960643483.LDyz7Bq68k5ywglm2efY..." => user_id = "960643483"
function extractUserIdFromToken(token) {
  if (!token) throw new Error('ACCESS_TOKEN is empty -- cannot extract user_id');
  var dotIndex = token.indexOf('.');
  if (dotIndex === -1) throw new Error('Unexpected access token format (no dot): ' + token.substring(0, 20));
  var userId = token.substring(0, dotIndex);
  if (!/^[0-9]+$/.test(userId)) throw new Error('Extracted user_id is not numeric: ' + userId);
  return userId;
}

async function fetchShopId() {
  var userId = extractUserIdFromToken(ACCESS_TOKEN);
  console.log('Extracted user_id from access token: ' + userId);
  console.log('Fetching shop list from /application/users/' + userId + '/shops ...');

  var data = await retry(function() {
    return etsyFetch('/users/' + userId + '/shops');
  });

  var shops = data.results || (Array.isArray(data) ? data : [data]);
  if (!shops || shops.length === 0) throw new Error('No Etsy shops found for user_id ' + userId);

  var id   = String(shops[0].shop_id);
  var name = shops[0].shop_name || '(unknown)';
  console.log('Discovered Etsy Shop ID: ' + id + ' (shop name: ' + name + ')');
  return id;
}

// Fetch all expired listings for the shop.
// Etsy v3 supports ?state=expired on the getListingsByShop endpoint.
// Expired listings are those that were previously active but passed day 120 without renewal.
async function fetchAllExpiredListings() {
  var allListings = [];
  var offset = 0;
  var limit  = 100;
  while (true) {
    var data = await retry(function() {
      return etsyFetch(
        '/shops/' + SHOP_ID + '/listings' +
        '?state=expired' +
        '&limit='  + limit +
        '&offset=' + offset
      );
    });
    var results = data.results || [];
    allListings = allListings.concat(results);
    if (results.length < limit) break;
    offset += limit;
  }
  return allListings;
}

// Renew (republish) an expired listing by PATCHing its state to "active".
// This is the ONLY documented way to renew a listing in Etsy v3.
// The old POST /shops/{id}/listings/{id}/renew endpoint does not exist in v3.
async function renewListing(listingId) {
  await retry(function() {
    return etsyFetch('/shops/' + SHOP_ID + '/listings/' + listingId, {
      method: 'PATCH',
      body:   JSON.stringify({ state: 'active' })
    });
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

  // Always discover shop ID from the access token -- no ETSY_SHOP_ID secret needed
  SHOP_ID = await fetchShopId();

  console.log('=== Etsy Listing Cleanup ===');
  console.log('Shop ID      : ' + SHOP_ID);
  console.log('Strategy     : renew expired listings with >= ' + MIN_VIEWS_TO_RENEW + ' views');
  console.log('');
  console.log('NOTE: Etsy v3 has no early-renewal endpoint. Active listings expire at day 120.');
  console.log('      This script republishes already-expired listings that had high engagement.');
  console.log('');

  var listings = await fetchAllExpiredListings();
  console.log('Total expired listings fetched: ' + listings.length);

  // Log fields on first listing for diagnostic purposes
  if (listings.length > 0) {
    var sample = listings[0];
    console.log('Sample expired listing fields (diagnostic): ' + JSON.stringify({
      listing_id:        sample.listing_id,
      state:             sample.state,
      created_timestamp: sample.created_timestamp,
      views:             sample.views,
      updated_timestamp: sample.updated_timestamp
    }));
  }
  console.log('');

  var totalChecked = 0;
  var totalRenewed = 0;
  var totalSkipped = 0; // expired but low-view, left alone

  for (var i = 0; i < listings.length; i++) {
    var listing   = listings[i];
    var listingId = listing.listing_id;

    // Use listing.views directly -- present on ShopListing object by default
    var views = (listing.views != null) ? listing.views : 0;

    totalChecked++;

    console.log('[' + listingId + '] state=expired views=' + views);

    if (views < MIN_VIEWS_TO_RENEW) {
      console.log('[' + listingId + '] -> SKIP (views=' + views + ' < ' + MIN_VIEWS_TO_RENEW + ', not worth renewing)');
      totalSkipped++;
    } else {
      console.log('[' + listingId + '] -> RENEWING (views=' + views + ' >= ' + MIN_VIEWS_TO_RENEW + ')...');
      try {
        await renewListing(listingId);
        console.log('[' + listingId + '] RENEWED successfully (state set to active)');
        totalRenewed++;
      } catch (err) {
        console.log('[' + listingId + '] ERROR renewing: ' + err.message + ' -- skipping');
        totalSkipped++;
      }
    }

    if (i < listings.length - 1) await sleep(500);
  }

  console.log('');
  console.log('=== Summary ===');
  console.log('Expired listings checked  : ' + totalChecked);
  console.log('Renewed (views >= ' + MIN_VIEWS_TO_RENEW + ')     : ' + totalRenewed);
  console.log('Skipped (low-view/error)  : ' + totalSkipped);
  console.log('');

  // Invariant check
  var accounted = totalRenewed + totalSkipped;
  if (accounted !== totalChecked) {
    console.log('WARNING: accounted (' + accounted + ') != totalChecked (' + totalChecked + ') -- bug!');
  } else {
    console.log('Check: ' + totalRenewed + ' renewed + ' + totalSkipped + ' skipped = ' + accounted + ' (matches ' + totalChecked + ' expired checked) OK');
  }
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
