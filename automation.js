// POD Automation Pipeline
// Gemini → Printify → Etsy
// Run with: node automation.js

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = '18634010';
const BLUEPRINT_ID = 1159;
const PRINT_PROVIDER_ID = 99; // Printify Choice

function calculatePrice(cost) {
  return Math.ceil(cost / 0.5);
}

const PROMPTS = [
  "Snoopy and Woodstock sitting together watching a sunset, warm golden sky",
  "Snoopy flying a kite with Woodstock sitting on top, blue sky and clouds",
  "Snoopy and Woodstock stargazing together on a hilltop at night",
  "Snoopy napping under a tree while Woodstock perches on a branch above",
  "Snoopy and Woodstock walking together through a field of sunflowers",
  "Snoopy and Woodstock sitting on a dock watching the water at sunset",
  "Snoopy reading a book outdoors while Woodstock sits nearby",
  "Snoopy and Woodstock dancing together in a field of flowers",
  "Snoopy and Woodstock sharing an umbrella in the rain",
  "Snoopy lying on top of his doghouse while Woodstock sits beside him",
  "Snoopy and Woodstock roasting marshmallows by a campfire at night",
  "Snoopy and Woodstock floating in the clouds on a sunny day",
  "Snoopy painting a picture on an easel while Woodstock watches",
  "Snoopy and Woodstock playing in autumn leaves, warm fall colors",
  "Snoopy and Woodstock looking at the moon together from a rooftop",
  "Snoopy and Woodstock in a hot air balloon over a colorful landscape",
  "Snoopy ice skating on a frozen pond with Woodstock on his head",
  "Snoopy and Woodstock gardening together, planting flowers",
  "Snoopy and Woodstock sitting in a cozy window watching it snow outside",
  "Snoopy playing guitar by a campfire while Woodstock listens",
  "Snoopy and Woodstock lying in a meadow looking up at the clouds",
  "Snoopy and Woodstock fishing together on a calm lake",
  "Snoopy and Woodstock sitting on a bench in a park in spring",
  "Snoopy and Woodstock building a sandcastle at the beach",
  "Snoopy and Woodstock watching fireworks light up the night sky",
  "Snoopy and Woodstock sledding down a snowy hill together",
  "Snoopy and Woodstock picking apples in an orchard in autumn",
  "Snoopy and Woodstock having a picnic on a sunny day",
  "Snoopy and Woodstock watching the sunrise from a hilltop",
  "Snoopy and Woodstock sitting on a crescent moon in the night sky",
  "Snoopy and Woodstock exploring a colorful garden in spring",
  "Snoopy and Woodstock swinging on a tire swing in summer",
  "Snoopy and Woodstock sitting by a cozy fireplace in winter",
  "Snoopy and Woodstock in a rowboat on a peaceful lake",
  "Snoopy and Woodstock playing in the snow making snowballs",
  "Snoopy and Woodstock sitting on a porch watching rain fall",
  "Snoopy and Woodstock chasing butterflies in a meadow",
  "Snoopy and Woodstock sitting on a mountain peak at sunrise",
  "Snoopy and Woodstock building a snowman together in winter",
  "Snoopy surfing a wave with Woodstock perched on his head",
  "Snoopy and Woodstock sitting in a treehouse among the leaves",
  "Snoopy and Woodstock lying on a blanket under the stars",
  "Snoopy and Woodstock playing in a sprinkler on a hot day",
  "Snoopy and Woodstock blowing dandelion seeds in the wind",
  "Snoopy and Woodstock sitting together in a colorful autumn forest",
  "Snoopy and Woodstock hiking through a scenic mountain trail",
  "Snoopy and Woodstock watching a rainbow after the rain",
  "Snoopy and Woodstock sitting in a field of lavender at dusk",
  "Snoopy and Woodstock floating lazily down a gentle river",
  "Snoopy and Woodstock decorating a Christmas tree together",
  "Snoopy cooking in a kitchen with Woodstock helping nearby",
  "Snoopy and Woodstock sitting on a lighthouse overlooking the ocean",
  "Snoopy and Woodstock collecting shells on a beach at sunset",
  "Snoopy and Woodstock sitting on a fence watching the countryside",
  "Snoopy and Woodstock walking through a snowy pine forest",
  "Snoopy and Woodstock sitting by a waterfall in a lush forest",
  "Snoopy and Woodstock watching hot air balloons rise at sunrise",
  "Snoopy and Woodstock sitting on a giant pumpkin in a fall field",
  "Snoopy and Woodstock skipping stones on a calm lake",
  "Snoopy and Woodstock playing in puddles after the rain",
  "Snoopy and Woodstock sitting together on a starry night beach",
  "Snoopy and Woodstock in a canoe on a misty morning lake",
  "Snoopy and Woodstock looking through a telescope at the stars",
  "Snoopy and Woodstock sitting on a swing at golden hour",
  "Snoopy and Woodstock flying paper airplanes in an open field",
  "Snoopy and Woodstock watching the northern lights in winter",
  "Snoopy and Woodstock sitting on a rooftop in a city at dusk",
  "Snoopy and Woodstock in a field of wildflowers at golden hour",
  "Snoopy and Woodstock splashing in the ocean waves",
  "Snoopy and Woodstock sitting on a log by a mountain stream",
  "Snoopy and Woodstock walking along a coastal cliff at sunset",
  "Snoopy and Woodstock playing in a pile of colorful leaves",
  "Snoopy and Woodstock sitting on a hammock between palm trees",
  "Snoopy and Woodstock exploring tide pools at the beach",
  "Snoopy and Woodstock watching a meteor shower in a dark sky",
  "Snoopy and Woodstock in a cozy cabin window with snow outside",
  "Snoopy and Woodstock sitting on a wooden bridge over a stream",
  "Snoopy and Woodstock in a rowboat surrounded by water lilies",
  "Snoopy and Woodstock sitting on a rooftop under a full moon",
  "Snoopy and Woodstock walking through a tunnel of blooming trees",
  "Snoopy and Woodstock sitting on a bale of hay in a field",
  "Snoopy and Woodstock watching the tide come in at the beach",
  "Snoopy and Woodstock sitting by a mountain lake reflection",
  "Snoopy and Woodstock in a garden at twilight with fireflies",
  "Snoopy and Woodstock having a snowball fight in winter",
  "Snoopy and Woodstock sitting on a pier watching boats",
  "Snoopy and Woodstock in a boat under a starry sky",
  "Snoopy and Woodstock sitting on a cliff edge watching the ocean",
  "Snoopy and Woodstock resting under a cherry blossom tree",
  "Snoopy and Woodstock sitting on a fence in a misty morning",
  "Snoopy and Woodstock watching ducks on a peaceful pond",
  "Snoopy and Woodstock sitting on a blanket in a lavender field",
  "Snoopy and Woodstock walking along a path in a foggy forest",
  "Snoopy and Woodstock sitting on a porch with hot drinks in winter",
  "Snoopy and Woodstock in a meadow with a rainbow in the background",
  "Snoopy and Woodstock sitting on a rock watching the river flow",
  "Snoopy and Woodstock in a sunflower field at peak summer",
  "Snoopy and Woodstock watching the sun rise over the mountains",
  "Snoopy and Woodstock sitting on a cloud above a colorful world",
];

const VERTICAL_VARIANTS = [
  { id: 101413, w: 2400,  h: 3000,  cost: 1288  },
  { id: 91641,  w: 3300,  h: 4200,  cost: 1610  },
  { id: 91644,  w: 3600,  h: 5400,  cost: 2208  },
  { id: 91647,  w: 4800,  h: 7200,  cost: 2857  },
  { id: 91649,  w: 6000,  h: 7200,  cost: 3538  },
  { id: 101411, w: 7200,  h: 9000,  cost: 4599  },
  { id: 91654,  w: 9000,  h: 12000, cost: 6361  },
  { id: 91655,  w: 9600,  h: 14400, cost: 9314  },
  { id: 112955, w: 12000, h: 18000, cost: 12721 },
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
        contents: [{ parts: [{ text: "Based on this art description: \"" + prompt + "\"\n\nGenerate an Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n  \"title\": \"catchy Etsy title under 140 chars with wall art canvas keywords\",\n  \"description\": \"3 paragraph Etsy product description, engaging and SEO friendly, mention canvas print, wall art, home decor, available in multiple sizes\",\n  \"tags\": [\"tag1\",\"tag2\",\"tag3\",\"tag4\",\"tag5\",\"tag6\",\"tag7\",\"tag8\",\"tag9\",\"tag10\",\"tag11\",\"tag12\",\"tag13\"]\n}" }] }],
        generationConfig: { responseModalities: ["TEXT"] }
      })
    }
  );
  var data = await res.json();
  var text = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  if (!text) throw new Error("Listing generation failed: " + JSON.stringify(data));
  var clean = text.replace(/```json|```/g, "").trim();
  var listing = JSON.parse(clean);
  console.log("Listing generated:", listing.title);
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
    return { id: v.id, is_enabled: true, price: calculatePrice(v.cost) };
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
  console.log("Waiting 30s for product images to fully process...");
  await new Promise(function(r) { setTimeout(r, 30000); });
  console.log("Publishing to Etsy...");

  var body = JSON.stringify({
    title: true,
    description: true,
    images: true,
    variants: true,
    tags: true,
    keyFeatures: true,
    shipping_template: true,
    offsite_ads: true
  });

  var res = await fetch(
    "https://api.printify.com/v1/shops/" + SHOP_ID + "/products/" + productId + "/publish.json",
    {
      method: "POST",
      headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" },
      body: body
    }
  );
  var text = await res.text();
  console.log("Publish response:", text);

  if (text === "{}" || text === "" || text === "null") {
    console.log("Publish returned empty, retrying after 20s...");
    await new Promise(function(r) { setTimeout(r, 20000); });
    var res2 = await fetch(
      "https://api.printify.com/v1/shops/" + SHOP_ID + "/products/" + productId + "/publish.json",
      {
        method: "POST",
        headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" },
        body: body
      }
    );
    var text2 = await res2.text();
    console.log("Publish retry response:", text2);
  }
}

async function run() {
  try { require("sharp"); } catch (e) {
    console.log("Installing sharp...");
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
  console.log("\nDone! All 5 listings processed.");
}

run();
