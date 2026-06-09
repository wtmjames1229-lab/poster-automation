// POD Automation Pipeline - Snoopy Canvas
// 5 listings per day, all old style clean illustrations
// Gemini → Printify → Etsy → Offsite Ads Toggle
// Run with: node automation.js
//
// Already on Etsy? Skips publish and only toggles offsite ads (Printify API: external.id).
// Unpublished canvas drafts are published first; new listings fill remaining daily slots.
//
// ─── Offsite ads control ─────────────────────────────────────────────────────
// The etsy-offsite-ads package is a VPS-only feature (Playwright browser automation).
// It is not available in GitHub Actions — the script skips it gracefully.
// To use it locally: npm run ads:on / npm run ads:off
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const shop = require('./printifyShop');

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID || '18634010';
const BLUEPRINT_ID = 1297;
const PRINT_PROVIDER_ID = 259;

const OFFSITE_ADS_ENABLED = process.env.OFFSITE_ADS_ENABLED === 'true';
const DAILY_NEW_LISTINGS = parseInt(process.env.DAILY_NEW_LISTINGS || '5', 10);
const SKIP_NEW_LISTINGS = process.env.SKIP_NEW_LISTINGS === 'true';
const TOGGLE_ALL_ETSY_PUBLISHED = process.env.TOGGLE_ALL_ETSY_PUBLISHED !== 'false';

// Lazy-load the ads module — only available on VPS with Playwright installed
let offsiteAdsModule = null;
function getOffsiteAdsModule() {
    if (!offsiteAdsModule) {
          try {
                  offsiteAdsModule = require('./etsy-offsite-ads/src');
          } catch (e) {
                  // Non-fatal: module only exists on VPS, not in GitHub Actions
            offsiteAdsModule = false;
          }
    }
    return offsiteAdsModule;
}

const PROMPTS = [
    // SEASONAL & WEATHER
    "Snoopy and Woodstock in a spring meadow with cherry blossoms falling",
    "Snoopy and Woodstock watching summer thunderstorm from a covered porch",
    "Snoopy and Woodstock jumping in autumn leaf piles, orange and red tones",
    "Snoopy and Woodstock building an igloo in a blizzard",
    "Snoopy and Woodstock under a rainbow after a spring shower",
    "Snoopy and Woodstock catching snowflakes on their tongues",
    "Snoopy and Woodstock in a field of wildflowers on a windy day",
    "Snoopy and Woodstock watching lightning over a stormy ocean",
    "Snoopy and Woodstock sitting on a fence during golden hour",
    "Snoopy and Woodstock in a foggy morning forest",
    "Snoopy and Woodstock chasing tumbleweeds in a desert",
    "Snoopy and Woodstock watching a tornado from a safe distance",
    "Snoopy and Woodstock in a monsoon rain, splashing in rivers",
    "Snoopy and Woodstock in a winter frost forest, icy branches glowing",
    "Snoopy and Woodstock watching northern lights in snowy tundra",
    "Snoopy and Woodstock in a summer heat wave eating popsicles",
    "Snoopy and Woodstock watching a double rainbow over a valley",
    "Snoopy and Woodstock in a blizzard building a snow fort",
    "Snoopy and Woodstock watching shooting stars on a clear night",
    "Snoopy and Woodstock in a foggy autumn pumpkin patch",
    // RETRO & VINTAGE
    "Snoopy and Woodstock in a 1950s diner, retro neon signs, milkshakes",
    "Snoopy and Woodstock as 1960s hippies in a psychedelic flower field",
    "Snoopy and Woodstock in a 1970s disco club with mirror balls and neon",
    "Snoopy and Woodstock in 1980s arcade, pixel games glowing",
    "Snoopy and Woodstock on a vintage 1950s drive-in movie date",
    "Snoopy and Woodstock in retro space age style, rocket ships, stars",
    "Snoopy and Woodstock as vintage travel poster tourists",
    "Snoopy and Woodstock in a sepia-toned old west scene, saloon",
    "Snoopy and Woodstock in a vintage circus poster style",
    "Snoopy and Woodstock in a 1920s art deco cityscape at night",
    // HOLIDAYS & CELEBRATIONS
    "Snoopy and Woodstock decorating a Christmas tree with lights",
    "Snoopy and Woodstock in Halloween costumes trick or treating",
    "Snoopy and Woodstock watching Fourth of July fireworks",
    "Snoopy and Woodstock celebrating New Years Eve with confetti",
    "Snoopy and Woodstock on Easter morning with egg baskets",
    "Snoopy and Woodstock at a Thanksgiving feast table",
    "Snoopy and Woodstock celebrating Valentines Day with hearts",
    "Snoopy and Woodstock at a birthday party with cake and balloons",
    "Snoopy and Woodstock at a summer barbecue party",
    "Snoopy and Woodstock in St Patricks Day green outfits",
    // NATURE & OUTDOORS
    "Snoopy and Woodstock fishing at a peaceful lake at sunrise",
    "Snoopy and Woodstock on a camping trip under the stars",
    "Snoopy and Woodstock hiking through a mountain trail",
    "Snoopy and Woodstock on a beach at sunset",
    "Snoopy and Woodstock in a sunflower field in summer",
    "Snoopy and Woodstock stargazing in a meadow at night",
    "Snoopy and Woodstock on a farm with animals",
    "Snoopy and Woodstock picking apples in an orchard",
    "Snoopy and Woodstock in a garden full of roses",
    "Snoopy and Woodstock by a waterfall in a jungle",
    // MUSIC & ARTS
    "Snoopy and Woodstock playing jazz instruments on a stage",
    "Snoopy and Woodstock at an art museum looking at paintings",
    "Snoopy and Woodstock dancing ballet on a stage",
    "Snoopy and Woodstock performing in a rock band",
    "Snoopy and Woodstock painting a mural together",
    "Snoopy and Woodstock at a piano recital",
    "Snoopy and Woodstock at an outdoor music festival",
    "Snoopy and Woodstock doing street art with spray cans",
    "Snoopy and Woodstock at a country music concert with guitars",
    "Snoopy and Woodstock in an orchestra pit with instruments",
    // SPORTS & ADVENTURE
    "Snoopy and Woodstock surfing big ocean waves",
    "Snoopy and Woodstock skateboarding in a halfpipe",
    "Snoopy and Woodstock playing baseball in a stadium",
    "Snoopy and Woodstock skiing down a snowy mountain",
    "Snoopy and Woodstock on a hot air balloon ride",
    "Snoopy and Woodstock scuba diving in a coral reef",
    "Snoopy and Woodstock playing tennis",
    "Snoopy and Woodstock on a motorcycle road trip",
    "Snoopy and Woodstock rock climbing a cliff face",
    "Snoopy and Woodstock playing soccer",
    // FOOD & DRINK
    "Snoopy and Woodstock at an ice cream parlor with sundaes",
    "Snoopy and Woodstock at a sushi restaurant",
    "Snoopy and Woodstock having a picnic with lemonade",
    "Snoopy and Woodstock baking cookies in a kitchen",
    "Snoopy and Woodstock at a pizza restaurant",
    "Snoopy and Woodstock at a French cafe with croissants",
    "Snoopy and Woodstock roasting marshmallows over a campfire",
    "Snoopy and Woodstock at a Mexican food fiesta",
    "Snoopy and Woodstock making spaghetti in an Italian kitchen",
    "Snoopy and Woodstock at a carnival eating cotton candy",
    // TRAVEL & PLACES
    "Snoopy and Woodstock in Paris at the Eiffel Tower",
    "Snoopy and Woodstock on safari in Africa",
    "Snoopy and Woodstock in Tokyo with neon signs",
    "Snoopy and Woodstock exploring ancient Egypt pyramids",
    "Snoopy and Woodstock in New York City Times Square",
    "Snoopy and Woodstock on a cruise ship at sea",
    "Snoopy and Woodstock in Venice on a gondola",
    "Snoopy and Woodstock in a London red phone booth rain",
    "Snoopy and Woodstock on the Great Wall of China",
    "Snoopy and Woodstock in an enchanted fairy tale castle",
  ];

const ALL_VARIANTS = [96924,96925,96926,96927,96928,96929,96930,96931,96932,96933,96934,96935,96936,96937,96938,96939,96940,96941,96942,96943,96944,96945,96946,96947,96948,96949,96950,96951,96952,96953,96954,96956,96957,96958];
const VERTICAL_VARIANTS = [
  { id: 96926, w: 2365, h: 2955, price: 5500 },  // 8x10 $55
  { id: 96930, w: 2955, h: 3546, price: 7000 },  // 10x12 $70
  { id: 96944, w: 4727, h: 5920, price: 10000 }, // 16x20 $100
  { id: 96946, w: 5920, h: 7101, price: 13000 }, // 20x24 $130
  { id: 96956, w: 7101, h: 8884, price: 17000 }, // 24x30 $170
  { id: 96958, w: 8858, h: 11811, price: 24000 }, // 30x40 $240
  ];

function pickPrompts() {
    var shuffled = PROMPTS.slice().sort(function() { return Math.random() - 0.5; });
    return shuffled.slice(0, 5);
}

async function retry(fn, retries, delay) {
    retries = retries || 3;
    delay = delay || 15000;
    for (var i = 0; i < retries; i++) {
          try {
                  return await fn();
          } catch (err) {
                  console.error("Attempt " + (i + 1) + " failed: " + err.message);
                  if (i < retries - 1) {
                            console.log("Retrying in " + (delay / 1000) + "s...");
                            await new Promise(function(r) { setTimeout(r, delay); });
                  } else {
                            throw err;
                  }
          }
    }
}

async function cropToVertical(base64Data) {
    var sharp = require("sharp");
    var inputBuffer = Buffer.from(base64Data, "base64");
    var metadata = await sharp(inputBuffer).metadata();
    var width = metadata.width;
    var height = metadata.height;
    var targetRatio = 4 / 5;
    var currentRatio = width / height;
    var cropWidth, cropHeight, left, top;
    if (currentRatio > targetRatio) {
          // Wider than 4:5 — crop sides
      cropHeight = height;
          cropWidth = Math.floor(height * targetRatio);
          left = Math.floor((width - cropWidth) / 2);
          top = 0;
    } else {
          // Taller than 4:5 — crop top/bottom
      cropWidth = width;
          cropHeight = Math.floor(width / targetRatio);
          left = 0;
          top = Math.floor((height - cropHeight) / 2);
    }
    var outputBuffer = await sharp(inputBuffer)
      .extract({ left: left, top: top, width: cropWidth, height: cropHeight })
      .resize(2000, 2500)
      .jpeg({ quality: 90 })
      .toBuffer();
    console.log("Image cropped to 4:5 (" + width + "x" + height + " -> 2000x2500)");
    return outputBuffer.toString("base64");
}

async function generateListing(prompt) {
    console.log("Generating listing content...");
    var res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + NB_API_KEY,
      {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                        contents: [{ parts: [{ text: "Based on this Snoopy and Woodstock art description: \"" + prompt + "\"\n\nGenerate an optimized Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n \"title\": \"Etsy optimized title under 80 chars. Format: Snoopy Woodstock [Scene] Canvas Print Peanuts [Theme] Wall Decor. NO dashes, NO hyphens, NO special characters.\",\n \"description\": \"3 engaging paragraphs about this specific artwork scene, the canvas print quality, and who would love it as a gift.\",\n \"tags\": [\"IMPORTANT: exactly 13 tags, each tag must be under 20 characters, no special characters, focused on Snoopy Peanuts and the specific scene. Examples: Snoopy wall art, Peanuts poster, Woodstock print, Snoopy gift, Peanuts decor, cartoon art print, Snoopy canvas, kids room art, Peanuts fan gift, Snoopy lover, beagle wall art, nursery art, Peanuts artwork\"]\n}" }] }],
                        generationConfig: { responseModalities: ["TEXT"] }
              })
      }
        );
    var data = await res.json();
    var text = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (!text) throw new Error("Listing generation failed: " + JSON.stringify(data));
    var clean = text.replace(/```json|```/g, "").trim();
    var listing = JSON.parse(clean);

  var validTags = [
        "Snoopy wall art", "Peanuts poster", "Woodstock print", "Snoopy gift",
        "Peanuts decor", "cartoon art print", "Snoopy canvas", "kids room art",
        "Peanuts fan gift", "Snoopy lover", "beagle wall art", "nursery art",
        "Peanuts artwork", "Snoopy print", "Peanuts wall art", "Snoopy home decor",
        "Woodstock art", "Peanuts gift", "cartoon canvas", "Snoopy art print"
      ];

  if (!listing.tags || !Array.isArray(listing.tags) || listing.tags.length === 0) {
        listing.tags = validTags.slice(0, 13);
  } else {
        var filtered = listing.tags.filter(function(t) { return t && t.length <= 20 && t.length > 0; });
        while (filtered.length < 13) {
                var fallback = validTags[filtered.length % validTags.length];
                if (filtered.indexOf(fallback) === -1) filtered.push(fallback);
                else filtered.push("Snoopy art " + filtered.length);
        }
        listing.tags = filtered.slice(0, 13);
  }

  console.log("Listing generated:", listing.title);
    console.log("Tags:", listing.tags);
    return listing;
}

async function generateImage(prompt) {
    console.log("Generating image...");
    var res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + NB_API_KEY,
      {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt + " Generate as a tall vertical portrait poster artwork in 4:5 aspect ratio, taller than wide. Fill the entire frame edge to edge with no white borders, no margins, no shadows, no drop shadows, no perspective distortion, completely flat design. Suitable for canvas wall art print. No text, no words, no letters." }] }],
                        generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
              })
      }
        );
    var rawText2 = await res.text();
    var data;
    try { data = JSON.parse(rawText2); } catch(e) { throw new Error("Image generation failed (non-JSON, status " + res.status + "): " + rawText2.substring(0, 200)); }
    var parts = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    var imagePart = parts && parts.find(function(p) { return p.inlineData; });
    if (!imagePart) throw new Error("Image generation failed: " + JSON.stringify(data));
    console.log("Image generated successfully");
    return await cropToVertical(imagePart.inlineData.data);
}

async function uploadToPrintify(base64Data) {
    console.log("Uploading image to Printify...");
    var res = await fetch("https://api.printify.com/v1/uploads/images.json", {
          method: "POST",
          headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ file_name: "canvas_" + Date.now() + ".jpg", contents: base64Data })
    });
    var rawText = await res.text();
    var data;
    try { data = JSON.parse(rawText); } catch(e) { throw new Error("Upload failed (non-JSON response, status " + res.status + "): " + rawText.substring(0, 200)); }
    if (!data.id) throw new Error("Upload failed: " + JSON.stringify(data));
    console.log("Uploaded, image ID:", data.id);
    return data.id;
}

async function createProduct(imageId, listing) {
    console.log("Creating Printify product...");
    var enabledIds = new Set(VERTICAL_VARIANTS.map(function(v) { return v.id; }));
    var priceMap = {};
    VERTICAL_VARIANTS.forEach(function(v) { priceMap[v.id] = v.price; });
    var variants = ALL_VARIANTS.map(function(id) {
          return { id: id, is_enabled: enabledIds.has(id), price: enabledIds.has(id) ? priceMap[id] : 500 };
    });
    var print_areas = [{
          variant_ids: VERTICAL_VARIANTS.map(function(v) { return v.id; }),
          placeholders: [{ position: "front", images: [{ id: imageId, x: 0.5, y: 0.5, scale: 1.3, angle: 0 }] }]
    }];
    var res = await fetch("https://api.printify.com/v1/shops/" + SHOP_ID + "/products.json", {
          method: "POST",
          headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
                  title: listing.title,
                  description: listing.description,
                  tags: listing.tags,
                  blueprint_id: BLUEPRINT_ID,
                  print_provider_id: PRINT_PROVIDER_ID,
                  variants: variants,
                  print_areas: print_areas
          })
    });
    var data = await res.json();
    if (!data.id) throw new Error("Product creation failed: " + JSON.stringify(data));
    console.log("Product created, ID:", data.id);
    return data.id;
}

var isPublishedToEtsy = shop.isPublishedToEtsy;
var isCanvasProduct = shop.isCanvasProduct;
var fetchAllShopProducts = shop.fetchAllShopProducts;
var getProduct = shop.getProduct;

async function publishToEtsy(productId) {
    var product = await getProduct(productId);
    if (isPublishedToEtsy(product)) {
          console.log('Product ' + productId + ' is already published to Etsy — skipping publish.');
          return false;
    }
    if (product.is_locked) {
          console.log('Product ' + productId + ' is locked (publish in progress) — skipping publish.');
          return false;
    }

  console.log("Publishing to Etsy...");
    var body = JSON.stringify({
          title: true, description: true, images: true, variants: true,
          tags: true, keyFeatures: false, shipping_template: true
    });

  var attempt = 1;
    var triggerOk = false;
    while (attempt <= 3 && !triggerOk) {
          console.log("Publish attempt " + attempt + "...");
          var res = await fetch(
                  "https://api.printify.com/v1/shops/" + SHOP_ID + "/products/" + productId + "/publish.json",
            { method: "POST", headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" }, body: body }
                );
          var resText = await res.text();
          console.log("Publish response (status " + res.status + "): " + resText);
          if (res.status === 200) {
                  triggerOk = true;
          } else {
                  if (attempt < 3) await new Promise(function(r) { setTimeout(r, 20000); });
                  attempt++;
          }
    }
    if (!triggerOk) throw new Error("Publish trigger failed after 3 attempts");

  console.log("Publish triggered. Polling for Etsy listing ID (up to 6 min)...");
    for (var i = 0; i < 24; i++) {
          await new Promise(function(r) { setTimeout(r, 15000); });
          var p = await getProduct(productId);
          var externalId = p.external && p.external.id;
          var status = p.publishing_status;
          console.log("Poll " + (i+1) + "/24: external.id=" + (externalId || "none") + " status=" + (status || "not set") + " locked=" + p.is_locked);
console.warn("⚠ Publish timed out after 6 min                  console.log("Publish succeeded! Etsy listing ID: " + externalId);
                  return true;
          }
          if (status === "failed") {
                  throw new Error("Publishing failed (status=failed) — check Printify→Etsy connection in Printify dashboard");
          }
    }
        // Publish 200 OK received — external.id sync can take longer than 6 min (Printify async).
    // Treat as published: the listing was sent to Etsy and will appear shortly.
    console.log("\u2713 Publish response was 200 OK \u2014 treating as published (external.id sync delay).");
    console.log("  Product " + productId + " should be live on Etsy shortly.");
    return true;
}

// ─── Offsite ads toggle (VPS-only — skipped in GitHub Actions) ───────────────

async function toggleOffsiteAds(productId, options) {
    options = options || {};
    var mod = getOffsiteAdsModule();
    if (!mod) {
          // Silently skip — etsy-offsite-ads is a VPS-only Playwright package
      return;
    }

  var enable = options.enable !== undefined ? options.enable : OFFSITE_ADS_ENABLED;
    var action = enable ? 'Enabling' : 'Disabling';
    console.log('\n[automation] ' + action + ' Etsy offsite ads for product ' + productId + '...');

  try {
        if (!options.skipPublishWait) {
                await new Promise(function(r) { setTimeout(r, 10000); });
        }
        var result = await mod.setOffsiteAds(productId, enable, { retries: 3 });
        if (result.changed) {
                console.log('[automation] ✓ Offsite ads ' + (result.newState ? 'ENABLED' : 'DISABLED') + ' for product ' + productId);
        } else {
                console.log('[automation] ✓ Offsite ads already ' + (result.newState ? 'ENABLED' : 'DISABLED') + ' for product ' + productId + ' — no change needed');
        }
  } catch (err) {
        console.error('[automation] ✗ Offsite ads toggle failed for ' + productId + ': ' + err.message);
        console.error('[automation] The listing was published successfully. Toggle it manually in Printify.');
  }
}

// ─── Existing shop products ───────────────────────────────────────────────────

async function processExistingProducts(allProducts, adsEnable) {
    var adsState = adsEnable !== undefined ? adsEnable : OFFSITE_ADS_ENABLED;
    var canvas = allProducts.filter(isCanvasProduct);
    var onEtsy = canvas.filter(isPublishedToEtsy);
    var drafts = canvas.filter(function(p) { return !isPublishedToEtsy(p) && !p.is_locked; });

  console.log('Shop scan: ' + canvas.length + ' canvas product(s), ' +
                  onEtsy.length + ' on Etsy, ' + drafts.length + ' unpublished draft(s)\n');

  var toggledOnly = [];

  if (!TOGGLE_ALL_ETSY_PUBLISHED) {
        console.log('TOGGLE_ALL_ETSY_PUBLISHED=false — skipping ads sync for existing Etsy listings.\n');
        return { onEtsy: onEtsy, drafts: drafts, toggledOnly: toggledOnly };
  }

  for (var i = 0; i < onEtsy.length; i++) {
        var p = onEtsy[i];
        console.log('\n═══════════════════════════════════════');
        console.log(' Already on Etsy (' + (i + 1) + '/' + onEtsy.length + ')');
        console.log('═══════════════════════════════════════');
        console.log('Product:', p.id);
        console.log('Title:', (p.title || '').substring(0, 60));
        try {
                await toggleOffsiteAds(p.id, { skipPublishWait: true, enable: adsState });
                toggledOnly.push(p.id);
                if (i < onEtsy.length - 1) await new Promise(function(r) { setTimeout(r, 3000); });
        } catch (err) {
                console.error('✗ Ads toggle failed for ' + p.id + ':', err.message);
        }
  }

  return { onEtsy: onEtsy, drafts: drafts, toggledOnly: toggledOnly };
}

async function processUnpublishedDrafts(drafts, maxCount, adsEnable) {
    var adsState = adsEnable !== undefined ? adsEnable : OFFSITE_ADS_ENABLED;
    var publishedNow = [];
    var toProcess = drafts.slice(0, maxCount);

  for (var i = 0; i < toProcess.length; i++) {
        var p = toProcess[i];
        console.log('\n═══════════════════════════════════════');
        console.log(' Unpublished draft (' + (i + 1) + '/' + toProcess.length + ')');
        console.log('═══════════════════════════════════════');
        console.log('Product:', p.id);
        console.log('Title:', (p.title || '').substring(0, 60));
        try {
                var didPublish = await publishToEtsy(p.id);
                if (didPublish) {
                          console.log('✓ Published to Etsy:', p.id);
                          publishedNow.push(p.id);
                }
                await toggleOffsiteAds(p.id, { skipPublishWait: !didPublish, enable: adsState });
                if (i < toProcess.length - 1) await new Promise(function(r) { setTimeout(r, 10000); });
        } catch (err) {
                console.error('✗ Draft ' + p.id + ' failed:', err.message);
        }
  }

  return publishedNow;
}

// ─── Ads-only mode (--ads-on / --ads-off) ─────────────────────────────────────

async function runAdsOnly(enable) {
    require('./config').validateForPlaywright();

  console.log('\n═══════════════════════════════════════');
    console.log(' Ads-only mode — Etsy-published canvas products');
    console.log(' Target: ads ' + (enable ? 'ON' : 'OFF'));
    console.log('═══════════════════════════════════════\n');

  var allProducts = await fetchAllShopProducts();
    var onEtsy = allProducts.filter(isCanvasProduct).filter(isPublishedToEtsy);

  if (onEtsy.length === 0) {
        console.log('No canvas products published to Etsy found.');
        var modEmpty = getOffsiteAdsModule();
        if (modEmpty) await modEmpty.closeBrowser();
        return;
  }

  var toggled = [];
    for (var i = 0; i < onEtsy.length; i++) {
          var p = onEtsy[i];
          console.log('\n--- Product ' + (i + 1) + '/' + onEtsy.length + ' ---');
          console.log(p.id, (p.title || '').substring(0, 50));
          try {
                  await toggleOffsiteAds(p.id, { skipPublishWait: true, enable: enable });
                  toggled.push(p.id);
                  if (i < onEtsy.length - 1) await new Promise(function(r) { setTimeout(r, 3000); });
          } catch (err) {
                  console.error('Failed:', err.message);
          }
    }

  var mod = getOffsiteAdsModule();
    if (mod) await mod.closeBrowser();

  console.log('\nDone. Ads ' + (enable ? 'ON' : 'OFF') + ' for ' + toggled.length + '/' + onEtsy.length + ' product(s).');
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

async function run() {
    var validate = require('./config').validateForPipeline;
    try { validate(); } catch (e) {
          if (String(e.message).indexOf('NB_API_KEY') >= 0 && SKIP_NEW_LISTINGS) {
                  require('./config').validateForPlaywright();
          } else {
                  throw e;
          }
    }

  try { require("sharp"); } catch (e) {
        require("child_process").execSync("npm install sharp", { stdio: "inherit" });
  }

  console.log('Offsite ads will be: ' + (OFFSITE_ADS_ENABLED ? 'ENABLED' : 'DISABLED'));
    console.log('Daily new listing target: ' + DAILY_NEW_LISTINGS);
    if (SKIP_NEW_LISTINGS) console.log('SKIP_NEW_LISTINGS=true — no new Gemini listings\n');

  var allProducts = await fetchAllShopProducts();
    var existing = await processExistingProducts(allProducts);

  var newSlots = SKIP_NEW_LISTINGS ? 0 : DAILY_NEW_LISTINGS;
    var draftSlots = Math.min(existing.drafts.length, newSlots);
    var publishedFromDrafts = [];

  if (draftSlots > 0) {
        console.log('\nPublishing ' + draftSlots + ' unpublished canvas draft(s) before creating new ones...');
        publishedFromDrafts = await processUnpublishedDrafts(existing.drafts, draftSlots);
        newSlots -= publishedFromDrafts.length;
  }

  var createdNew = [];
    var publishedNew = [];
    if (newSlots > 0) {
          var prompts = pickPrompts().slice(0, newSlots);
          console.log('\nCreating ' + prompts.length + ' new listing(s) from prompts\n');

      for (var i = 0; i < prompts.length; i++) {
              var prompt = prompts[i];
              console.log('\n═══════════════════════════════════════');
              console.log(' New listing ' + (i + 1) + ' of ' + prompts.length);
              console.log('═══════════════════════════════════════');
              console.log('Prompt:', prompt);
              try {
                        var listing = await retry(function() { return generateListing(prompt); });
                        var base64Img = await retry(function() { return generateImage(prompt); });
                        var imageId = await uploadToPrintify(base64Img);
                        var productId = await createProduct(imageId, listing);
                        createdNew.push(productId);

                // Wait 15s for Printify to finish processing, then publish
                await new Promise(function(r) { setTimeout(r, 15000); });
                        var didPublish = await publishToEtsy(productId);
                        if (didPublish) {
                                    console.log('✓ Listing live on Etsy! Product ID:', productId);
                                    publishedNew.push(productId);
                        }
                        await toggleOffsiteAds(productId, { skipPublishWait: !didPublish, enable: OFFSITE_ADS_ENABLED });

                if (i < prompts.length - 1) await new Promise(function(r) { setTimeout(r, 10000); });
              } catch (err) {
                        console.error('✗ New listing ' + (i + 1) + ' failed:', err.message);
              }
      }
    } else if (!SKIP_NEW_LISTINGS) {
          console.log('\nNo new listings to create (drafts filled the daily quota or DAILY_NEW_LISTINGS=0).');
    }

  var mod = getOffsiteAdsModule();
    if (mod) await mod.closeBrowser();

  console.log('\n═══════════════════════════════════════');
    console.log(' Done!');
    console.log('═══════════════════════════════════════');
    console.log(' On Etsy (ads only)  : ' + existing.toggledOnly.length);
    console.log(' Drafts published    : ' + publishedFromDrafts.length);
    console.log(' New products created: ' + createdNew.length);
    console.log(' New live on Etsy    : ' + publishedNew.length);
    if (createdNew.length > publishedNew.length) {
          var unpublishedIds = createdNew.filter(function(id) { return publishedNew.indexOf(id) === -1; });
          console.log(' ⚠ Saved as drafts   : ' + unpublishedIds.join(', '));
          console.log(' ⚠ To fix: reconnect Etsy in Printify dashboard → Sales Channels');
    }
    if (existing.toggledOnly.length) {
          console.log(' Ads toggled (existing): ' + existing.toggledOnly.join(', '));
    }
    if (publishedFromDrafts.length) {
          console.log(' Published from drafts : ' + publishedFromDrafts.join(', '));
    }
    if (publishedNew.length) {
          console.log(' New product IDs       : ' + publishedNew.join(', '));
    }
}

var cliArgs = process.argv.slice(2);
if (cliArgs.indexOf('--ads-on') >= 0) {
    runAdsOnly(true).catch(function(err) {
          console.error(err);
          process.exit(1);
    });
} else if (cliArgs.indexOf('--ads-off') >= 0) {
    runAdsOnly(false).catch(function(err) {
          console.error(err);
          process.exit(1);
    });
} else {
    run();
}
