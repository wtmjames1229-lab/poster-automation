// Pokemon POD Automation Pipeline
// Gemini → Printify → Etsy
// Run with: node pokemon_automation.js

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = '27354436';
const BLUEPRINT_ID = 1159;
const PRINT_PROVIDER_ID = 99;

const PROMPTS = [
  // PIKACHU
  "Pikachu sitting on a hill watching a sunset, warm golden sky",
  "Pikachu and Eevee playing in a field of flowers",
  "Pikachu stargazing on a hilltop at night with stars glowing",
  "Pikachu napping under a tree on a sunny afternoon",
  "Pikachu surfing on a wave at the beach",
  "Pikachu in a hot air balloon over a colorful landscape",
  "Pikachu ice skating on a frozen pond in winter",
  "Pikachu watching fireworks light up the night sky",
  "Pikachu sledding down a snowy hill in winter",
  "Pikachu sitting on a crescent moon in the night sky",
  "Pikachu and Eevee having a picnic on a sunny day",
  "Pikachu decorating a Christmas tree in the snow",
  "Pikachu in a cozy cabin with snow falling outside",
  "Pikachu watching the northern lights in snowy tundra",
  "Pikachu at the cherry blossom festival in spring",
  "Pikachu in a field of sunflowers at golden hour",
  "Pikachu wrapped in blankets watching the sunset",
  "Pikachu in a cozy reading nook with warm candles",
  "Pikachu jumping in autumn leaves, orange and red tones",
  "Pikachu and Eevee sharing an umbrella in the rain",
  // CHARIZARD
  "Charizard flying over mountains at golden hour sunset",
  "Charizard soaring through storm clouds at night",
  "Charizard resting on a cliff overlooking a misty valley",
  "Charizard watching a volcano erupt at sunset",
  "Charizard flying over a colorful autumn forest",
  "Charizard sitting by a campfire watching the stars",
  "Charizard soaring over the ocean at sunrise",
  "Charizard in a retro space age style with rocket ships and stars",
  "Charizard flying through a cosmic dreamscape of stars and planets",
  "Charizard in watercolor painting style with loose washes",
  // EEVEE AND EVOLUTIONS
  "Eevee and Flareon sitting by a cozy fireplace in winter",
  "Eevee running through autumn leaves, orange and red tones",
  "Eevee and Vaporeon swimming in turquoise ocean waters",
  "Eevee in a spring meadow with cherry blossoms falling",
  "Eevee napping in a sunbeam on a cozy window seat",
  "Eevee and Espeon stargazing together on a hilltop",
  "Eevee and Umbreon watching the northern lights at night",
  "Eevee in a field of lavender at golden hour dusk",
  "Eevee and Glaceon in a winter frost forest glowing branches",
  "Eevee and Leafeon in a bamboo forest at dawn",
  "Sylveon in a lavender and cream color palette",
  "Espeon sitting on a rooftop watching city lights at night",
  "Umbreon and Espeon silhouetted against a blazing sunset",
  "Vaporeon swimming in a coral reef underwater scene",
  "Jolteon in a vibrant lightning storm over the ocean",
  // MEWTWO & LEGENDARY
  "Mewtwo floating in a cosmic dreamscape of stars and planets",
  "Mewtwo in a crystal cave with glowing gems",
  "Mewtwo in a retro Japanese woodblock print style",
  "Mewtwo silhouetted against a blazing purple sunset",
  "Lugia flying over the ocean at sunset majestic and peaceful",
  "Ho-Oh soaring over a rainbow after spring rain",
  "Rayquaza soaring through storm clouds at night",
  "Articuno flying over a snowy mountain landscape",
  "Zapdos flying through a lightning storm over the ocean",
  "Moltres soaring over a volcano at golden hour",
  "Suicune running across a frozen lake at dawn",
  "Entei standing on a cliff overlooking a misty valley",
  "Celebi floating in an enchanted fairy tale forest",
  "Jirachi on a crescent moon surrounded by stars",
  "Latias and Latios flying together over a coastal city at sunset",
  "Kyogre swimming in a deep glowing ocean at night",
  "Groudon watching a volcano erupt at golden hour",
  "Dialga and Palkia in a cosmic starry night sky",
  "Giratina in a dreamland with floating islands",
  "Arceus in a golden cloud kingdom above the clouds",
  "Reshiram soaring through a snowy tundra landscape",
  "Zekrom flying through a lightning storm at night",
  "Xerneas in an enchanted fairy tale forest glowing",
  "Yveltal soaring over a dark dramatic stormy sky",
  "Lunala soaring through a starry night sky",
  "Solgaleo watching a solar eclipse over mountains",
  "Necrozma floating in a colorful nebula in outer space",
  // BULBASAUR AND IVYSAUR
  "Bulbasaur in a flower garden with butterflies at spring",
  "Bulbasaur in a tropical jungle garden at golden hour",
  "Bulbasaur in a Japanese zen garden at golden hour",
  "Venusaur in an ancient redwood forest at dawn",
  "Ivysaur in a field of wildflowers on a windy day",
  // SQUIRTLE AND BLASTOISE
  "Squirtle and Wartortle playing in ocean waves at sunset",
  "Squirtle on a sailboat in turquoise waters",
  "Blastoise on a rocky coastline with waves crashing",
  "Squirtle building an elaborate sandcastle at the beach",
  "Squirtle watching bioluminescent waves at night on the beach",
  // GENGAR AND HAUNTER
  "Gengar and Mimikyu in a cozy haunted library with candles",
  "Gengar in Halloween style trick or treating at night",
  "Gengar floating in a starry night sky over a city",
  "Haunter floating in a foggy morning forest",
  "Gengar in a 1920s art deco cityscape at night",
  // SNORLAX
  "Snorlax sleeping in a cozy meadow on a sunny afternoon",
  "Snorlax napping under a giant cherry blossom tree",
  "Snorlax sleeping by a campfire watching the stars",
  "Snorlax wrapped in blankets in a cozy cabin in winter",
  "Snorlax sleeping in autumn leaves, orange and red tones",
  // MEOWTH AND PERSIAN
  "Meowth in a 1950s diner with retro neon signs and milkshakes",
  "Meowth sitting on a rooftop watching city lights at night",
  "Persian curled up in a cozy reading nook with candles",
  // PSYDUCK AND SLOWPOKE
  "Psyduck sitting by a calm lake watching the sunset",
  "Slowpoke sitting on a dock watching the water at sunset",
  "Psyduck in a cozy bathtub surrounded by bubbles and candles",
  // JIGGLYPUFF
  "Jigglypuff singing under a starry night sky",
  "Jigglypuff celebrating New Year with confetti and fireworks",
  "Jigglypuff in a cozy attic studio making art at night",
  // STARTER COLLECTIONS
  "Charmander sitting by a campfire watching the stars at night",
  "Chikorita in a field of clover and bees on a sunny day",
  "Cyndaquil watching fireflies in a summer field at night",
  "Totodile splashing in river rapids on an adventure",
  "Treecko climbing a giant redwood tree in a misty forest",
  "Mudkip playing in puddles after the rain on a sunny day",
  "Turtwig in a moss garden after rain peaceful morning",
  "Chimchar watching a sunset from a mountain peak",
  "Piplup on a frozen Antarctic coastline at golden hour",
  "Snivy in a Japanese zen garden at golden hour",
  "Tepig roasting marshmallows by a campfire at night",
  "Oshawott on a sailboat in turquoise waters at sunset",
  "Fennekin reading a book in a cozy library with candles",
  "Froakie on a rooftop watching city lights at dusk",
  "Chespin in a chestnut orchard in autumn",
  "Rowlet in a treehouse with string lights at night",
  "Litten curled up in a cozy cabin with snow falling outside",
  "Popplio performing in a magical underwater kingdom",
  // ART STYLES
  "Pikachu in watercolor painting style with loose washes",
  "Eevee in gouache painting style with bold colors",
  "Charizard in oil painting impressionist style",
  "Mewtwo in mosaic tile art style",
  "Pikachu in stained glass illustration style",
  "Gengar in risograph print style with layered colors",
  "Pikachu in ukiyo-e Japanese woodblock style",
  "Eevee in Art Nouveau flowing lines style",
  "Charizard in Bauhaus geometric design style",
  "Pikachu in screen print style with limited colors",
  "Mewtwo in Victorian botanical illustration style",
  "Pikachu as minimal line art on clean background",
  "Charizard as negative space silhouette art",
  "Eevee as origami paper fold style illustration",
  "Pikachu as flat vector illustration minimal style",
  // COLOR PALETTE THEMES
  "Pikachu and Eevee in a deep navy and gold color palette",
  "Vaporeon in a coral and turquoise tropical palette",
  "Leafeon in a forest green and rust autumn palette",
  "Sylveon in a lavender and cream color palette",
  "Umbreon in a midnight blue and silver color palette",
  "Flareon in a warm terracotta and sage color palette",
  "Jolteon in a vibrant citrus yellow color palette",
  "Espeon in a dusty pink and charcoal color palette",
  "Glaceon in a soft mint and blush color palette",
  "Pikachu in a bold primary colors palette",
  // SEASONAL
  "Pikachu and Eevee in a spring meadow with cherry blossoms",
  "Charizard watching summer thunderstorm from above",
  "Snorlax jumping in autumn leaf piles orange and red tones",
  "Pikachu and Eevee building an igloo in a blizzard",
  "Gengar watching lightning over a stormy ocean at night",
  "Articuno in a winter frost forest with icy glowing branches",
  "Jolteon in a monsoon rain splashing in rivers",
  "Suicune watching the northern lights in snowy tundra",
  // FRIENDSHIP MOMENTS
  "Pikachu and Eevee high-fiving after a big adventure",
  "Squirtle and Charmander falling asleep together under a tree",
  "Bulbasaur and Oddish finding treasure on a beach",
  "Pikachu and Togepi sharing an umbrella in the rain",
  "Eevee and all its evolutions watching shadows in golden light",
  "Pikachu and Mewtwo leaving footprints in fresh snow",
  "Pikachu and Eevee watching the sun rise over the mountains",
  "Pikachu and Snorlax napping together in a sunny meadow",
];

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
        contents: [{ parts: [{ text: "Based on this art description: \"" + prompt + "\"\n\nGenerate an optimized Etsy product listing. DO NOT use any character names, franchise names, brand names, or trademarked terms. Use only generic descriptive words. Respond with raw JSON only, no markdown, no backticks:\n{\n  \"title\": \"Etsy optimized title under 80 chars. Describe the scene and art style generically. Examples: Yellow Electric Creature Sunset Canvas Print Kawaii Wall Decor. Cute Anime Creature Forest Canvas Print Kawaii Wall Decor. NO character names, NO franchise names, NO dashes, NO special characters.\",\n  \"description\": \"3 engaging paragraphs describing the artwork scene generically without any character or franchise names, the canvas print quality, and who would love it as a gift.\",\n  \"tags\": [\"exactly 13 tags each under 20 characters no special characters. Use only generic terms like: kawaii wall art, anime wall art, cute creature art, fantasy art print, kids room art, nursery art, kawaii canvas, anime canvas, cute wall art, kawaii decor, anime poster, kawaii nursery, fantasy canvas\"]\n}" }] }],
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
    "kawaii wall art",
    "anime wall art",
    "cute creature art",
    "fantasy art print",
    "kids room art",
    "nursery art",
    "kawaii canvas",
    "anime canvas",
    "cute wall art",
    "kawaii decor",
    "anime poster",
    "kawaii nursery",
    "fantasy canvas",
    "cute anime art",
    "kawaii print",
    "anime wall decor",
    "cute fantasy art",
    "kawaii gift",
    "anime art gift",
    "cute kids decor"
  ];

  if (!listing.tags || !Array.isArray(listing.tags) || listing.tags.length === 0) {
    listing.tags = validTags.slice(0, 13);
  } else {
    var filtered = listing.tags.filter(function(t) { return t && t.length <= 20 && t.length > 0; });
    while (filtered.length < 13) {
      var fallback = validTags[filtered.length % validTags.length];
      if (filtered.indexOf(fallback) === -1) filtered.push(fallback);
      else filtered.push("Pokemon art " + filtered.length);
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
        contents: [{ parts: [{ text: prompt + " Generate as a tall vertical portrait poster artwork in 2:3 aspect ratio, taller than wide, fill the entire frame edge to edge with no white borders, no margins, suitable for canvas wall art print, flat design, minimalist illustration style, no text, no words, no letters." }] }],
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
  if (!data.id) throw new Error("Product creation failed: " + JSON.stringify(data));
  console.log("Product created, ID:", data.id);
  return data.id;
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
    if (statusCode === 200 || statusCode === 204) { console.log("Publish succeeded!"); break; }
    if (attempt < 3) {
      console.log("Waiting 20s before retry...");
      await new Promise(function(r) { setTimeout(r, 20000); });
    }
  }
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
      await publishToEtsy(productId);
      console.log("Listing " + (i + 1) + " live on Etsy!");
      if (i < 4) await new Promise(function(r) { setTimeout(r, 10000); });
    } catch (err) {
      console.error("Listing " + (i + 1) + " failed:", err.message);
    }
  }
  console.log("\nDone! All 5 Pokemon listings processed.");
}

run();
