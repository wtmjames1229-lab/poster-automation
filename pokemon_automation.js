// POD Automation Pipeline
// Gemini → Printify → Etsy
// Run with: node automation.js

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const PRINTIFY_EMAIL = process.env.PRINTIFY_EMAIL;
const PRINTIFY_PASSWORD = process.env.PRINTIFY_PASSWORD;
const SHOP_ID = '27356196';
const EBAY_SHOP_ID = '27315339';
const BLUEPRINT_ID = 1159;
const PRINT_PROVIDER_ID = 99;

const PROMPTS = [
  // PIKACHU - RETRO POSTER STYLE
  "Pikachu as the bold central figure in a vintage 1970s retro travel poster, electric yellow against deep navy blue, dramatic lightning bolts radiating outward, screen print style",
  "Pikachu front and center in a Japanese retro woodblock print style, cherry blossoms framing the composition, bold outlines, flat color blocks",
  "Pikachu in a bold 1950s Americana retro poster style, standing heroically on a hilltop at sunset, warm orange and red palette, thick graphic lines",
  "Pikachu close-up portrait in Andy Warhol pop art style, four-panel grid with bold contrasting colors, thick black outlines, iconic graphic design",
  "Pikachu in a vintage Soviet constructivist propaganda poster style, bold geometric shapes, red and gold palette, dramatic upward angle",
  "Pikachu in a retro 1980s neon arcade poster style, glowing neon outlines against dark background, cyberpunk aesthetic, bold typography space",
  "Pikachu as the star of a vintage circus poster, center stage with spotlights, ornate Victorian borders, bold yellows and reds",
  "Pikachu in a minimal retro Swiss design poster, bold yellow circle background, clean geometric composition, striking negative space",
  "Pikachu in a dramatic retro sci-fi movie poster style, rays of light emanating from behind, bold silhouette, deep space background",
  "Pikachu in a vintage 1960s psychedelic poster style, swirling rainbow patterns, bold outlines, trippy optical illusion background",
  // CHARIZARD - RETRO POSTER STYLE
  "Charizard as the dominant central figure in a bold vintage heavy metal concert poster, fire and smoke, dramatic dark background with orange flame bursts",
  "Charizard in a retro 1970s disaster movie poster style, soaring over a city skyline at sunset, dramatic orange and red sky, bold silhouette",
  "Charizard in a vintage Japanese woodblock print style, flames rendered as stylized orange and red patterns, mountain landscape, bold composition",
  "Charizard close-up portrait in bold graphic novel style, intense gaze filling the frame, fire breath illuminating the scene, dark dramatic palette",
  "Charizard in a retro sci-fi pulp magazine cover style, flying through a cosmic nebula, bold purple and orange palette, dramatic composition",
  "Charizard in a vintage 1950s monster movie poster style, looming large over tiny silhouetted figures, bold typography space at bottom",
  "Charizard in a bold Art Deco poster style, geometric fire patterns, gold and black palette, symmetrical heroic composition",
  "Charizard soaring in a bold retro aviation poster style, dramatic clouds, warm sunset palette, vintage travel poster aesthetic",
  "Charizard in a dramatic ukiyo-e Japanese woodblock style, surrounded by stylized waves of fire, bold outlines, flat color composition",
  "Charizard in a vintage 1980s cartoon intro poster style, explosive background colors, dynamic flying pose, bold primary colors",
  // EEVEE - RETRO POSTER STYLE
  "Eevee as the central figure in a soft vintage French poster style, surrounded by illustrated flowers, warm pastel palette, Art Nouveau flowing lines",
  "Eevee in a bold retro Japanese kawaii poster style, huge eyes filling the frame, pastel pink and cream background, minimal clean composition",
  "Eevee surrounded by all its evolutions in a vintage collector's poster style, grid layout, each rendered in their signature color, bold borders",
  "Eevee in a vintage 1960s mod poster style, geometric shapes, bold contrasting colors, psychedelic circular patterns in background",
  "Eevee close-up portrait in a bold graphic illustration style, soft fur rendered in warm browns, autumn maple leaves framing composition",
  "Eevee in a retro woodland fairy tale book illustration style, enchanted forest background, soft glowing light, vintage storybook aesthetic",
  "Eevee in a bold minimalist retro poster, single large silhouette against a striking sunset gradient, clean graphic composition",
  // MEWTWO - RETRO POSTER STYLE
  "Mewtwo as the dominant figure in a dramatic retro sci-fi film poster, floating in a cosmic void, purple energy swirling around, bold and mysterious",
  "Mewtwo in a vintage 1950s science fiction pulp novel cover style, dramatic laboratory setting, bold red and silver palette, retro futurism",
  "Mewtwo close-up portrait in a bold graphic art style, intense eyes filling the frame, deep purple aura, minimalist dark background",
  "Mewtwo in a retro propaganda poster style, monumental scale, rays of light behind the figure, bold and imposing composition",
  "Mewtwo in a vintage psychedelic poster style, geometric patterns radiating outward, purple and gold palette, trippy symmetrical design",
  // LEGENDARY BIRDS AND BEASTS
  "Articuno in a bold vintage natural history illustration poster style, wings fully spread as the central figure, icy blue and white palette, dramatic Arctic landscape",
  "Zapdos in a retro electric power company poster style, lightning bolts radiating from the central figure, bold yellow and black palette, graphic design aesthetic",
  "Moltres in a vintage Phoenix mythology poster style, flames forming a dramatic halo, bold red and gold palette, symmetrical heroic composition",
  "Lugia in a bold Japanese retro ocean poster style, emerging from stylized waves, silver and blue palette, woodblock print aesthetic",
  "Ho-Oh in a vintage rainbow mythological poster style, wings spread wide as the central figure, brilliant rainbow palette, gold accents",
  "Suicune in a retro nature conservation poster style, running across a frozen lake, bold blue and white palette, dramatic sweeping composition",
  "Entei in a bold vintage volcano mythology poster style, fire swirling around the central figure, deep red and gold palette, imposing scale",
  "Rayquaza in a dramatic retro celestial poster style, stretched vertically as the dominant figure, emerald green against star-filled sky",
  "Kyogre in a bold vintage nautical mythology poster, surrounded by stylized ocean waves, deep blue and red pattern, dramatic scale",
  "Groudon in a retro geological survey poster style, towering as the central figure above a volcanic landscape, bold red and brown palette",
  // STARTERS RETRO STYLE
  "Charmander in a bold vintage adventure poster style, small flame tail glowing against a dark blue night sky, dramatic scale contrast",
  "Squirtle in a retro surf culture poster style, riding a massive stylized wave, bold blue and white palette, 1960s beach poster aesthetic",
  "Bulbasaur in a vintage botanical illustration poster style, surrounded by lush illustrated plants, soft green palette, nature series aesthetic",
  "Gengar in a bold vintage Halloween poster style, huge grinning face filling the frame, deep purple and black palette, dramatic shadows",
  "Snorlax in a retro vintage tourism poster style, sleeping peacefully as the enormous central figure, soft pastel mountain landscape behind",
  "Dragonite in a bold retro aviation poster style, soaring through dramatic clouds, warm golden palette, vintage airline poster aesthetic",
  "Lapras in a vintage ocean liner poster style, gliding through calm waters, soft teal and gold palette, 1930s travel poster aesthetic",
  // ART MOVEMENT STYLES
  "Pikachu reimagined in bold Bauhaus design style, pure geometric shapes, primary colors only, centered composition, graphic design masterpiece",
  "Eevee in a vintage Art Nouveau poster, flowing organic lines forming the border, soft botanical details, Alphonse Mucha inspired style",
  "Charizard in a bold Soviet constructivist poster style, angular geometric shapes, bold red and black palette, dramatic diagonal composition",
  "Mewtwo in a De Stijl modernist composition, bold primary color blocks, black grid lines, Mondrian inspired abstract poster style",
  "Pikachu in a bold Pop Art poster in the style of Roy Lichtenstein, Ben-Day dots, bold black outlines, primary colors, comic book aesthetic",
  "Eevee in a Klimt-inspired gold leaf decorative poster, intricate gold patterns surrounding the central figure, rich jewel tones",
  "Charizard in a bold expressionist woodcut print style, raw angular lines, high contrast black and white with single accent color",
  "Pikachu in a vintage Ukiyo-e Japanese woodblock composition, Mt Fuji in background, bold outlines, flat color, Hokusai wave inspired",
  // SEASONAL RETRO
  "Pikachu in a vintage Christmas holiday poster style, bold red and green palette, retro ornament decorations, centered festive composition",
  "Eevee in a retro autumn harvest poster style, surrounded by bold graphic fall leaves, warm orange and brown palette, vintage seasonal aesthetic",
  "Articuno in a bold retro winter tourism ski poster style, mountain landscape, crisp blue and white palette, 1950s Swiss design inspired",
  "Charizard in a retro summer beach poster style, bold sun rays, warm orange and yellow palette, vintage coastal travel aesthetic",
  // DRAMATIC CLOSE-UP PORTRAITS
  "Pikachu extreme close-up portrait, huge expressive eyes filling the frame, bold graphic style, warm yellow palette, minimal background",
  "Charizard extreme close-up portrait, fierce eyes and fire breath, dramatic lighting, dark background, bold graphic illustration style",
  "Mewtwo extreme close-up portrait, intense glowing eyes filling the frame, deep purple aura, mysterious and powerful, minimal composition",
  "Eevee extreme close-up portrait, huge soft eyes filling the frame, warm fluffy fur, gentle expression, soft warm palette",
  "Gengar extreme close-up portrait, enormous grinning smile filling the frame, bold purple palette, playful and dramatic composition",
  "Snorlax extreme close-up portrait, peaceful sleeping face, soft round features, pastel blue and cream palette, cozy aesthetic",
  "Lugia extreme close-up portrait, wise gentle eyes, silver and blue tones, ethereal glow, serene and majestic composition",
];

// Flat rate prices in cents
const VERTICAL_VARIANTS = [
  { id: 101413, w: 2400,  h: 3000,  price: 5142  },
  { id: 91641,  w: 3300,  h: 4200,  price: 6336  },
  { id: 91644,  w: 3600,  h: 5400,  price: 8420  },
  { id: 91647,  w: 4800,  h: 7200,  price: 10820 },
  { id: 91649,  w: 6000,  h: 7200,  price: 13200 },
  { id: 101411, w: 7200,  h: 9000,  price: 16966 },
  { id: 91654,  w: 9000,  h: 12000, price: 23762 },
  { id: 91655,  w: 9600,  h: 14400, price: 34684 },
  { id: 112955, w: 12000, h: 18000, price: 50026 },
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
  var targetRatio = 2 / 3;
  var currentRatio = width / height;
  var cropWidth, cropHeight, left, top;
  if (currentRatio > targetRatio) {
    cropHeight = height;
    cropWidth = Math.floor(height * targetRatio);
    left = Math.floor((width - cropWidth) / 2);
    top = 0;
  } else {
    cropWidth = width;
    cropHeight = Math.floor(width / targetRatio);
    left = 0;
    top = Math.floor((height - cropHeight) / 2);
  }
  var outputBuffer = await sharp(inputBuffer)
    .extract({ left: left, top: top, width: cropWidth, height: cropHeight })
    .resize(3000, 4500)
    .png()
    .toBuffer();
  console.log("Image cropped to 2:3 (" + width + "x" + height + " -> 3000x4500)");
  return outputBuffer.toString("base64");
}

async function generateListing(prompt) {
  console.log("Generating listing content...");
  var res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=" + NB_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Based on this Pokémon art description: \"" + prompt + "\"\n\nGenerate an optimized Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n  \"title\": \"Etsy optimized title under 80 chars. Use the word Pokémon but NO specific character names. Format: Pokémon [Scene] Canvas Print [Style] Wall Decor. Examples: Pokémon Retro Sunset Canvas Print Vintage Wall Decor. Pokémon Winter Forest Canvas Print Kawaii Wall Decor. Pokémon Night Sky Canvas Print Anime Wall Decor. NO character names, NO dashes, NO special characters except the é in Pokémon.\",\n  \"description\": \"3 engaging paragraphs about this specific retro poster artwork, the bold eye-catching design, the canvas print quality, and who would love it as a gift.\",\n  \"tags\": [\"IMPORTANT: exactly 13 tags each under 20 characters no special characters. Examples: kawaii wall art, anime wall art, kids room art, nursery art, retro anime art, cute wall art, anime poster, kawaii decor, vintage anime art, retro wall decor, kawaii gift, anime art gift, cute room decor\"]\n}" }] }],
        generationConfig: { responseModalities: ["TEXT"] }
      })
    }
  );
  var data = await res.json();
  var text = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  if (!text) throw new Error("Listing generation failed: " + JSON.stringify(data));
  var clean = text.replace(/```json|```/g, "").trim();
  var listing = JSON.parse(clean);

  // Validate and fix tags - ensure all under 20 chars
  var validTags = [
    "kawaii wall art",
    "anime wall art",
    "kids room art",
    "nursery art",
    "kawaii canvas",
    "cute wall art",
    "anime poster",
    "kawaii decor",
    "fantasy art",
    "cute kids decor",
    "kawaii gift",
    "anime art gift",
    "cute room decor",
    "anime canvas",
    "kawaii nursery",
    "cute anime art",
    "kawaii print",
    "anime wall decor",
    "cute fantasy art",
    "kawaii home decor"
  ];

  if (!listing.tags || !Array.isArray(listing.tags) || listing.tags.length === 0) {
    listing.tags = validTags.slice(0, 13);
  } else {
    // Filter out any tags over 20 chars and replace with valid ones
    var filtered = listing.tags.filter(function(t) {
      return t && t.length <= 20 && t.length > 0;
    });
    while (filtered.length < 13) {
      var fallback = validTags[filtered.length % validTags.length];
      if (filtered.indexOf(fallback) === -1) {
        filtered.push(fallback);
      } else {
        filtered.push("kawaii art " + filtered.length);
      }
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
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=" + NB_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt + " Generate as a tall vertical portrait poster in 2:3 aspect ratio, taller than wide. The character must be the bold central focal point filling most of the frame. Retro poster style with flat graphic colors, bold outlines, striking composition. Fill the entire frame edge to edge with no white borders, no margins. Suitable for canvas wall art print. No text, no words, no letters." }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
      })
    }
  );
  var data = await res.json();
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
    body: JSON.stringify({ file_name: "canvas_" + Date.now() + ".png", contents: base64Data })
  });
  var data = await res.json();
  if (!data.id) throw new Error("Upload failed: " + JSON.stringify(data));
  console.log("Uploaded, image ID:", data.id);
  return data.id;
}

async function createProduct(imageId, listing) {
  console.log("Creating Printify product...");
  var variants = VERTICAL_VARIANTS.map(function(v) {
    return { id: v.id, is_enabled: true, price: v.price };
  });
  var print_areas = VERTICAL_VARIANTS.map(function(v) {
    return {
      variant_ids: [v.id],
      placeholders: [{ position: "front", images: [{ id: imageId, x: 0.5, y: 0.5, scale: 1, angle: 0, print_area_width: v.w, print_area_height: v.h }] }]
    };
  });
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
  console.log("Product creation response (status " + res.status + "):", JSON.stringify(data).substring(0, 300));
  if (!data.id) throw new Error("Product creation failed: " + JSON.stringify(data));
  console.log("Product created, ID:", data.id);
  return data.id;
}

async function enableOffsiteAdsPuppeteer(productId) {
  var PRINTIFY_BEARER = process.env.PRINTIFY_BEARER;
  if (!PRINTIFY_BEARER) {
    console.log("No PRINTIFY_BEARER token set, skipping offsite ads");
    return;
  }
  console.log("Enabling offsite ads via bearer token...");
  try {
    var USER_ID = "19310315";
    var res = await fetch(
      "https://printify.com/api/v1/users/" + USER_ID + "/shops/" + SHOP_ID + "/products/" + productId,
      {
        method: "PUT",
        headers: {
          "Authorization": "Bearer " + PRINTIFY_BEARER,
          "Content-Type": "application/json",
          "Origin": "https://printify.com",
          "Referer": "https://printify.com/app/store/products/1"
        },
        body: JSON.stringify({ sales_channel_properties: { etsy: { offsite_adds: 0.12 } } })
      }
    );
    var text = await res.text();
    console.log("Offsite ads response (status " + res.status + "):", text.substring(0, 200));
  } catch (err) {
    console.log("Offsite ads error:", err.message);
  }
}


async function createAndPublishEbay(etsyProductId) {
  console.log("Copying product to eBay store...");
  var res = await fetch(
    "https://api.printify.com/v1/shops/" + SHOP_ID + "/products/" + etsyProductId + "/duplicate.json",
    {
      method: "POST",
      headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ shop_id: parseInt(EBAY_SHOP_ID) })
    }
  );
  var data = await res.json();
  console.log("Copy response (status " + res.status + "):", JSON.stringify(data).substring(0, 200));
  if (!data.id) { console.log("eBay copy failed"); return; }
  console.log("eBay product copied, ID:", data.id);

  // Publish to eBay
  await new Promise(function(r) { setTimeout(r, 15000); });
  console.log("Publishing to eBay...");
  var pubRes = await fetch(
    "https://api.printify.com/v1/shops/" + EBAY_SHOP_ID + "/products/" + data.id + "/publish.json",
    {
      method: "POST",
      headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true })
    }
  );
  console.log("eBay publish response (status " + pubRes.status + "):", await pubRes.text());
}

function saveListing(printifyId, etsyListingId) {
  var fs = require('fs');
  var file = './listings.json';
  var listings = {};
  try {
    if (fs.existsSync(file)) listings = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {}
  listings[etsyListingId] = {
    printify_id: printifyId,
    created_at: new Date().toISOString(),
    auto_renew: false
  };
  fs.writeFileSync(file, JSON.stringify(listings, null, 2));
  console.log("Saved listing to tracker:", etsyListingId);
}

async function getEtsyListingId(printifyProductId) {
  await new Promise(function(r) { setTimeout(r, 5000); });
  var res = await fetch(
    "https://api.printify.com/v1/shops/" + SHOP_ID + "/products/" + printifyProductId + ".json",
    { headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY } }
  );
  var data = await res.json();
  if (data.external && data.external.id) {
    console.log("Etsy listing ID:", data.external.id);
    return data.external.id;
  }
  return null;
}

async function publishToEtsy(productId) {
  console.log("Waiting 45s for product images to fully process...");
  await new Promise(function(r) { setTimeout(r, 45000); });
  console.log("Publishing to Etsy...");

  var body = JSON.stringify({
    title: true,
    description: true,
    images: true,
    variants: true,
    tags: true,
    keyFeatures: true,
    shipping_template: true
  });

  // Try publishing up to 3 times
  for (var attempt = 1; attempt <= 3; attempt++) {
    console.log("Publish attempt " + attempt + "...");
    var res = await fetch(
      "https://api.printify.com/v1/shops/" + SHOP_ID + "/products/" + productId + "/publish.json",
      {
        method: "POST",
        headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" },
        body: body
      }
    );
    var statusCode = res.status;
    var text = await res.text();
    console.log("Publish response (status " + statusCode + "):", text);

    if (statusCode === 200 || statusCode === 204) {
      console.log("Publish succeeded!");
      break;
    }

    if (attempt < 3) {
      console.log("Waiting 20s before retry...");
      await new Promise(function(r) { setTimeout(r, 20000); });
    }
  }

  // Check actual product status
  await new Promise(function(r) { setTimeout(r, 5000); });
  var checkRes = await fetch(
    "https://api.printify.com/v1/shops/" + SHOP_ID + "/products/" + productId + ".json",
    { headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY } }
  );
  var product = await checkRes.json();
  console.log("Product publishing_status:", product.publishing_status);
  console.log("Product status:", product.status);
}

async function run() {
  try { require("sharp"); } catch (e) {
    require("child_process").execSync("npm install sharp", { stdio: "inherit" });
  }

  var prompts = pickPrompts();
  console.log("Selected 5 unique prompts for this run");

  for (var i = 0; i < 5; i++) {
    var prompt = prompts[i];
    console.log("\n--- Listing " + (i + 1) + " of 5 ---");
    console.log("Prompt:", prompt);
    try {
      var listing = await retry(function() { return generateListing(prompt); });
      var base64Image = await retry(function() { return generateImage(prompt); });
      var imageId = await uploadToPrintify(base64Image);
      var productId = await createProduct(imageId, listing);
      try { await enableOffsiteAdsPuppeteer(productId); } catch(e) { console.log("Offsite ads skipped:", e.message); }
      await publishToEtsy(productId);
      console.log("Listing " + (i + 1) + " live on Etsy!");
      if (i < 4) await new Promise(function(r) { setTimeout(r, 10000); });
    } catch (err) {
      console.error("Listing " + (i + 1) + " failed:", err.message);
    }
  }
  console.log("\nDone! All 5 listings processed.");
}

run();
