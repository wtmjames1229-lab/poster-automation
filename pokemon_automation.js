// Pokemon POD Automation Pipeline
// Gemini → Printify → Etsy
// Run with: node pokemon_automation.js

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = '27354436';
const BLUEPRINT_ID = 1159;
const PRINT_PROVIDER_ID = 99;

const PROMPTS = [
  // PIKACHU SCENES
  "Pikachu sitting on a hill watching a sunset, warm golden sky",
  "Pikachu and Eevee playing in a field of flowers",
  "Pikachu stargazing on a hilltop at night with stars glowing",
  "Pikachu napping under a tree on a sunny afternoon",
  "Pikachu and Snorlax sleeping together in a cozy meadow",
  "Pikachu surfing on a wave at the beach",
  "Pikachu in a hot air balloon over a colorful landscape",
  "Pikachu ice skating on a frozen pond in winter",
  "Pikachu and Eevee sharing an umbrella in the rain",
  "Pikachu watching fireworks light up the night sky",
  "Pikachu sledding down a snowy hill in winter",
  "Pikachu picking apples in an orchard in autumn",
  "Pikachu and Eevee having a picnic on a sunny day",
  "Pikachu sitting on a crescent moon in the night sky",
  "Pikachu exploring a colorful garden in spring",
  "Pikachu and Bulbasaur in a field of sunflowers",
  "Pikachu fishing by a calm lake at sunset",
  // EEVEE SCENES
  "Eevee and Flareon sitting by a cozy fireplace in winter",
  "Eevee running through autumn leaves, orange and red tones",
  "Eevee and Vaporeon swimming in turquoise ocean waters",
  "Eevee in a spring meadow with cherry blossoms falling",
  "Eevee and Jolteon watching lightning over a stormy ocean",
  "Eevee napping in a sunbeam on a cozy window seat",
  "Eevee and Espeon stargazing together on a hilltop",
  "Eevee and Umbreon watching the northern lights at night",
  "Eevee in a field of lavender at golden hour dusk",
  "Eevee and Glaceon in a winter frost forest, icy branches glowing",
  "Eevee and Leafeon in a bamboo forest at dawn",
  "Eevee playing in a sprinkler on a hot summer day",
  // LEGENDARY SCENES
  "Lugia flying over the ocean at sunset, majestic and peaceful",
  "Ho-Oh soaring over a rainbow after spring rain",
  "Mewtwo floating in a cosmic dreamscape of stars and planets",
  "Rayquaza soaring through storm clouds at night",
  "Articuno flying over a snowy mountain landscape",
  "Zapdos flying through a lightning storm over the ocean",
  "Moltres soaring over a volcano at golden hour",
  "Suicune running across a frozen lake at dawn",
    "Entei standing on a cliff overlooking a misty valley",
  "Raikou in a field of wildflowers on a windy day",
  "Celebi floating in an enchanted fairy tale forest",
  "Jirachi on a crescent moon surrounded by stars",
  "Latias and Latios flying together over a coastal city",
  "Kyogre swimming in a deep glowing ocean",
  "Groudon watching a volcano erupt at golden hour",
  // STARTER POKEMON SCENES
  "Charmander sitting by a campfire watching the stars",
  "Squirtle and Wartortle playing in ocean waves at sunset",
  "Bulbasaur in a flower garden with butterflies at spring",
  "Chikorita in a field of clover and bees on a sunny day",
  "Cyndaquil watching fireflies in a summer field at night",
  "Totodile splashing in a river rapids adventure",
  "Treecko climbing a giant redwood tree in a misty forest",
  "Torchic and Mudkip playing in puddles after the rain",
  "Turtwig in a moss garden after rain, peaceful morning",
  "Chimchar watching a sunset from a mountain peak",
  "Piplup and Empoleon on a frozen Antarctic coastline",
  "Snivy in a Japanese zen garden at golden hour",
  "Tepig roasting marshmallows by a campfire at night",
  "Oshawott on a sailboat in turquoise waters",
  "Fennekin reading a book in a cozy library with candles",
  "Froakie and Greninja on a rooftop watching city lights",
  "Chespin in a chestnut orchard in autumn",
  "Rowlet in a treehouse with string lights at night",
  "Litten curled up in a cozy cabin with snow falling outside",
  "Popplio performing in a magical underwater kingdom",
  // NATURE & LANDSCAPE SCENES
  "Venusaur in a tropical jungle garden at golden hour",
  "Torterra walking through an ancient redwood forest",
  "Tropius soaring over a tulip field in the Netherlands",
  "Flygon in a Moroccan desert with sand dunes at sunset",
  "Milotic swimming in a coral reef underwater scene",
  "Lapras floating on a calm misty mountain lake",
  "Dragonite flying over the Scottish highlands landscape",
  "Altaria floating through clouds above a misty valley",
  "Swellow soaring over a rocky coastline with waves crashing",
  "Skarmory flying through an alpine meadow with wildflowers",
  "Absol watching a tornado from a rocky cliff",
  "Ninetales running through a field of poppies in Tuscany",
  // COSMIC & SPACE SCENES
  "Clefairy and Clefable dancing on the moon with Earth in background",
  "Starmie glowing in a galaxy swirling with stars",
  "Deoxys floating beside a comet in outer space",
  "Jirachi floating in a colorful nebula",
  "Solrock and Lunatone on a glowing asteroid in deep space",
  "Elgyem discovering a new planet in outer space",
  "Sigilyph as retro space explorer above Mars",
  "Cleffa watching a meteor shower from a hilltop at night",
  "Minior falling through a cosmic dreamscape of stars",
  "Lunala soaring through a starry night sky",
  "Solgaleo watching a solar eclipse",
  "Cosmog floating in outer space surrounded by stardust",
  // COZY & COMFORT SCENES
  "Gengar and Mimikyu in a cozy haunted library with candles",
  "Sylveon and Togekiss in a cottage garden drinking tea",
  "Jigglypuff singing in a cozy attic studio at night",
  "Chansey in a morning kitchen with coffee and flowers",
  "Blissey in a greenhouse surrounded by colorful plants",
  "Snubbull wrapped in blankets watching the sunset",
  "Meowth in a reading nook with warm candles and books",
  "Espurr napping in a sunbeam on a window seat",
  "Persian in a treehouse with string lights at night",
  "Delcatty in a hammock between apple trees in summer",
  "Skitty playing in a field of wildflowers at dusk",
  "Sneasel in a cozy cabin with snow falling outside",
  // SEASONAL & WEATHER SCENES
  "Vulpix and Ninetales in a winter frost forest with glowing branches",
  "Dewgong watching northern lights in snowy tundra",
  "Froslass floating in a blizzard above a snowy mountain",
  "Abomasnow standing in a silent snowy midnight forest",
  "Castform changing forms through all four seasons collage",
  "Cherrim blooming in a spring meadow with cherry blossoms",
  "Sunflora in a field of sunflowers at peak summer",
  "Leafeon in a New England fall foliage landscape",
  "Marill splashing in a monsoon rain river adventure",
  "Politoed jumping in puddles after the rain on a sunny day",
  // HOLIDAY & CELEBRATION SCENES
  "Pikachu decorating a Christmas tree in the snow",
  "Gengar and Haunter in Halloween costumes trick or treating",
  "Jigglypuff celebrating New Year with confetti and fireworks",
  "Togepi at an Easter egg hunt in a spring garden",
  "Clefairy at a Valentine's Day picnic with hearts",
  "Snorlax celebrating Thanksgiving with a giant feast",
  "Pikachu at a Chinese New Year parade with dragon decorations",
  "Gardevoir at a summer solstice bonfire ceremony",
  "Celebi at a spring equinox flower festival",
  "Articuno at a winter solstice lantern ceremony in snow",
  // RETRO & VINTAGE STYLE SCENES
  "Pikachu and Charmander in a 1950s diner with retro neon signs",
  "Eevee and friends as 1960s hippies in a psychedelic flower field",
  "Mewtwo in retro space age style with rocket ships and stars",
  "Pikachu as vintage travel poster tourist",
  "Gengar in a 1920s art deco cityscape at night",
  "Pikachu in a 1960s pop art style with bold colors",
  "Eevee in a vintage circus poster style illustration",
  "Pikachu on a vintage postcard from Japan",
  "Charizard in a classic pulp magazine cover style",
  "Mewtwo in an old school tattoo flash art style",
  // ART STYLE VARIATIONS
  "Pikachu in watercolor painting style with loose washes",
  "Eevee in gouache painting style with bold colors",
  "Charizard in oil painting impressionist style",
  "Bulbasaur in linocut print style bold graphic design",
  "Snorlax in screen print style with limited colors",
  "Gengar in risograph print style with layered colors",
  "Mewtwo in mosaic tile art style",
  "Pikachu in stained glass illustration style",
  "Eevee in embroidery patch style illustration",
  "Jigglypuff in Victorian botanical illustration style",
  "Charizard in Art Nouveau flowing lines style",
  "Mewtwo in Bauhaus geometric design style",
  "Pikachu in ukiyo-e Japanese woodblock style",
  "Gengar in medieval illuminated manuscript style",
  // COLOR PALETTE THEMES
  "Pikachu and Eevee in a deep navy and gold color palette",
  "Vaporeon in a coral and turquoise tropical palette",
  "Leafeon in a forest green and rust autumn palette",
  "Sylveon in a lavender and cream palette",
  "Umbreon in a midnight blue and silver palette",
  "Flareon in a warm terracotta and sage palette",
  "Jolteon in a vibrant citrus color palette",
  "Espeon in a dusty pink and charcoal palette",
  "Glaceon in a soft mint and blush palette",
  "Pikachu in a bold primary colors palette",
  // FRIENDSHIP MOMENTS
  "Pikachu and Ash sharing a secret under a starry sky",
  "Pikachu and Eevee high-fiving after a big adventure",
  "Squirtle and Charmander falling asleep together under a tree",
  "Bulbasaur and Oddish finding treasure on a beach",
  "Pikachu and Togepi sharing an umbrella in the rain",
  "Eevee and all its evolutions watching shadows in golden light",
  "Pikachu and Mewtwo leaving footprints in fresh snow",
  "Ash and Pikachu watching the sun rise over the mountains",
  // MINIMALIST & GEOMETRIC
  "Pikachu as simple geometric shapes with bold colors",
  "Eevee as minimal line art on clean background",
  "Pokeball as abstract color block shapes minimalist",
  "Pikachu as negative space silhouette art",
  "Mewtwo as origami paper fold style illustration",
  "Gengar as monochrome ink brush strokes art",
  "Pikachu as flat vector illustration minimal style",
  "Charizard as watercolor washes with minimal detail",
  "Eevee as Scandinavian folk art motifs design",
  "Pikachu as minimalist mountain and moon design",
  // TRAVEL & ADVENTURE
  "Pikachu at the Eiffel Tower in Paris at night",
  "Snorlax at the Great Wall of China",
  "Pikachu and Eevee at the cherry blossom festival in Tokyo",
  "Lapras at Machu Picchu in Peru at sunrise",
  "Pikachu on a double-decker bus in London",
  "Mewtwo exploring ancient ruins in Greece",
  "Pikachu and Squirtle at a night market in Taiwan",
  "Charizard at the colosseum in Rome at sunset",
  "Pikachu in a cable car over Hong Kong at night",
  "Vaporeon watching the midnight sun in Alaska",
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
        contents: [{ parts: [{ text: "Based on this Pokemon art description: \"" + prompt + "\"\n\nGenerate an optimized Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n  \"title\": \"Etsy optimized title under 80 chars. Format: [Pokemon] [Scene] Canvas Print Pokemon Wall Decor. NO dashes, NO hyphens, NO special characters.\",\n  \"description\": \"3 engaging paragraphs about this specific Pokemon artwork scene, the canvas print quality, and who would love it as a gift.\",\n  \"tags\": [\"exactly 13 tags each under 20 characters no special characters focused on Pokemon and the specific scene. Examples: Pokemon wall art, Pikachu print, Pokemon gift, Pokemon canvas, Pokemon decor, kawaii wall art, anime wall art, kids room art, Pokemon fan gift, cute wall art, Pokemon poster, nursery art, Pokemon artwork\"]\n}" }] }],
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
    "Pokemon wall art",
    "Pikachu print",
    "Pokemon gift",
    "Pokemon canvas",
    "Pokemon decor",
    "kawaii wall art",
    "anime wall art",
    "kids room art",
    "Pokemon fan gift",
    "cute wall art",
    "Pokemon poster",
    "nursery art",
    "Pokemon artwork",
    "Pikachu decor",
    "anime canvas",
    "Pokemon lover",
    "Eevee print",
    "Charizard art",
    "Pokemon nursery",
    "kawaii canvas"
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
