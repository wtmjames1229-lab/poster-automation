// POD Automation Pipeline
// Gemini → Printify → Etsy
// Run with: node automation.js

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const PRINTIFY_EMAIL = process.env.PRINTIFY_EMAIL;
const PRINTIFY_PASSWORD = process.env.PRINTIFY_PASSWORD;
const SHOP_ID = '18634010';
const BLUEPRINT_ID = 1159;
const PRINT_PROVIDER_ID = 99;

const PROMPTS = [
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
  "Snoopy and Woodstock as 1940s jazz musicians in a smoky club",
  "Snoopy and Woodstock on vintage postcard from Paris",
  "Snoopy and Woodstock in a retro Japanese woodblock print style",
  "Snoopy and Woodstock on a vintage tin toy illustration",
  "Snoopy and Woodstock in a classic pulp magazine cover style",
  "Snoopy and Woodstock in a 1960s pop art style, bold colors",
  "Snoopy and Woodstock as vintage sailors on a tall ship",
  "Snoopy and Woodstock in a 1970s van life road trip illustration",
  "Snoopy and Woodstock in a retro holiday greeting card style",
  "Snoopy and Woodstock in a old school tattoo flash art style",
  "Collage of Snoopy and Woodstock through all four seasons",
  "Collage of Snoopy and Woodstock in different countries around the world",
  "Collage of Snoopy and Woodstock doing different sports",
  "Collage of Snoopy and Woodstock at different times of day",
  "Collage of Snoopy and Woodstock in different weather conditions",
  "Collage of tiny Snoopy and Woodstock scenes in a grid pattern",
  "Collage of Snoopy and Woodstock in different art styles",
  "Collage of Snoopy and Woodstock celebrating different holidays",
  "Collage of Snoopy and Woodstock silhouettes in colorful shapes",
  "Collage of Snoopy and Woodstock in vintage stamp style",
  "Collage of Snoopy and Woodstock as botanical illustrations",
  "Collage of Snoopy and Woodstock with patterns and geometric shapes",
  "Collage mosaic of Snoopy and Woodstock made from tiny scenes",
  "Collage of Snoopy and Woodstock in different decades fashion",
  "Snoopy and Woodstock on a cliff overlooking a misty valley",
  "Snoopy and Woodstock in a bamboo forest at dawn",
  "Snoopy and Woodstock on a volcanic island with lava flows",
  "Snoopy and Woodstock in a coral reef underwater scene",
  "Snoopy and Woodstock in an ancient redwood forest",
  "Snoopy and Woodstock in a tulip field in the Netherlands",
  "Snoopy and Woodstock in a Scottish highlands landscape",
  "Snoopy and Woodstock at the Grand Canyon watching sunrise",
  "Snoopy and Woodstock in a Japanese zen garden",
  "Snoopy and Woodstock in an African savanna at golden hour",
  "Snoopy and Woodstock in an Amazonian rainforest",
  "Snoopy and Woodstock on a rocky coastline with waves crashing",
  "Snoopy and Woodstock in a Nevada desert with giant cacti",
  "Snoopy and Woodstock in an alpine meadow with wildflowers",
  "Snoopy and Woodstock in a mangrove swamp at sunset",
  "Snoopy and Woodstock by a frozen waterfall in winter",
  "Snoopy and Woodstock in a field of poppies in Tuscany",
  "Snoopy and Woodstock watching geysers in Yellowstone",
  "Snoopy and Woodstock in a Moroccan desert with sand dunes",
  "Snoopy and Woodstock by the northern lights in Iceland",
  "Snoopy and Woodstock as astronauts floating in outer space",
  "Snoopy and Woodstock on the moon with Earth in background",
  "Snoopy and Woodstock surfing on Saturns rings",
  "Snoopy and Woodstock in a spaceship cockpit approaching a nebula",
  "Snoopy and Woodstock discovering a new planet",
  "Snoopy and Woodstock watching a meteor shower from a hilltop",
  "Snoopy and Woodstock floating beside a comet",
  "Snoopy and Woodstock as retro space explorers on Mars",
  "Snoopy and Woodstock in a galaxy swirling with stars",
  "Snoopy and Woodstock watching a solar eclipse",
  "Snoopy and Woodstock on a space station looking at Earth",
  "Snoopy and Woodstock in a cosmic dreamscape of stars and planets",
  "Snoopy and Woodstock chasing shooting stars across the sky",
  "Snoopy and Woodstock floating in a colorful nebula",
  "Snoopy and Woodstock on a glowing asteroid in deep space",
  "Snoopy as a chef and Woodstock as sous chef in a French kitchen",
  "Snoopy and Woodstock at an Italian pizza oven, tossing dough",
  "Snoopy and Woodstock at a Japanese sushi bar",
  "Snoopy and Woodstock at a Mexican street food stand",
  "Snoopy and Woodstock making a giant birthday cake",
  "Snoopy and Woodstock at a Parisian patisserie with croissants",
  "Snoopy and Woodstock in a candy factory Willy Wonka style",
  "Snoopy and Woodstock at an ice cream parlor with giant sundaes",
  "Snoopy and Woodstock making smores at a campfire",
  "Snoopy and Woodstock picking strawberries in a farm field",
  "Snoopy and Woodstock at a lemonade stand on a hot day",
  "Snoopy and Woodstock making pancakes on a Sunday morning",
  "Snoopy and Woodstock at a farmers market with colorful produce",
  "Snoopy and Woodstock in a cozy bakery making bread",
  "Snoopy and Woodstock at a BBQ cookout with smoke and flames",
  "Snoopy as a rock star with Woodstock as drummer on stage",
  "Snoopy and Woodstock in a jazz club with saxophone and bass",
  "Snoopy and Woodstock performing classical music in a concert hall",
  "Snoopy as DJ and Woodstock dancing at a music festival",
  "Snoopy and Woodstock playing folk music around a campfire",
  "Snoopy as a street musician with Woodstock in guitar case",
  "Snoopy and Woodstock at a vinyl record shop",
  "Snoopy and Woodstock playing reggae on a beach in Jamaica",
  "Snoopy and Woodstock in a recording studio making an album",
  "Snoopy painting a mural with Woodstock helping",
  "Snoopy and Woodstock at an art gallery opening night",
  "Snoopy as a graffiti artist with Woodstock holding spray paint",
  "Snoopy and Woodstock doing pottery together",
  "Snoopy and Woodstock at an outdoor sculpture park",
  "Snoopy and Woodstock performing in a street dance battle",
  "Snoopy and Woodstock surfing massive ocean waves",
  "Snoopy and Woodstock skiing down a snowy mountain",
  "Snoopy and Woodstock playing tennis on a clay court",
  "Snoopy and Woodstock rock climbing a granite cliff",
  "Snoopy and Woodstock doing yoga at sunrise on a beach",
  "Snoopy and Woodstock cycling through a mountain pass",
  "Snoopy and Woodstock kayaking through river rapids",
  "Snoopy and Woodstock playing basketball on a city court",
  "Snoopy and Woodstock doing martial arts in a dojo",
  "Snoopy and Woodstock skateboarding at a colorful skate park",
  "Snoopy and Woodstock playing soccer on a rainy field",
  "Snoopy and Woodstock doing archery in a forest",
  "Snoopy and Woodstock bungee jumping off a bridge",
  "Snoopy and Woodstock hang gliding over mountains",
  "Snoopy and Woodstock doing parkour in a city",
  "Snoopy and Woodstock playing frisbee on a sunny beach",
  "Snoopy and Woodstock in a marathon race through a city",
  "Snoopy and Woodstock bowling on a retro lane",
  "Snoopy and Woodstock at the Eiffel Tower in Paris at night",
  "Snoopy and Woodstock riding camels near the pyramids of Egypt",
  "Snoopy and Woodstock in a gondola in Venice Italy",
  "Snoopy and Woodstock at the Great Wall of China",
  "Snoopy and Woodstock watching the Northern Lights in Norway",
  "Snoopy and Woodstock on safari in Kenya",
  "Snoopy and Woodstock at the cherry blossom festival in Tokyo",
  "Snoopy and Woodstock in a tuk-tuk in Bangkok",
  "Snoopy and Woodstock at Machu Picchu in Peru",
  "Snoopy and Woodstock on a double-decker bus in London",
  "Snoopy and Woodstock exploring ancient ruins in Greece",
  "Snoopy and Woodstock at a night market in Taiwan",
  "Snoopy and Woodstock hiking in Patagonia",
  "Snoopy and Woodstock on a houseboat in Amsterdam",
  "Snoopy and Woodstock watching flamenco in Spain",
  "Snoopy and Woodstock in a rickshaw in India",
  "Snoopy and Woodstock at the colosseum in Rome at sunset",
  "Snoopy and Woodstock in a cable car over Hong Kong",
  "Snoopy and Woodstock watching the midnight sun in Alaska",
  "Snoopy and Woodstock in a cozy cabin with snow falling outside",
  "Snoopy and Woodstock reading books in a hammock",
  "Snoopy and Woodstock napping in a sunbeam on a window seat",
  "Snoopy and Woodstock in a treehouse with string lights at night",
  "Snoopy and Woodstock in a cozy library with towering bookshelves",
  "Snoopy and Woodstock in a hot tub watching stars",
  "Snoopy and Woodstock in a tent on a rainy camping night",
  "Snoopy and Woodstock wrapped in blankets watching the sunset",
  "Snoopy and Woodstock in a cottage garden drinking tea",
  "Snoopy and Woodstock in a cozy attic studio making art",
  "Snoopy and Woodstock in a greenhouse surrounded by plants",
  "Snoopy and Woodstock in a morning kitchen with coffee and toast",
  "Snoopy and Woodstock in a tiny house surrounded by nature",
  "Snoopy and Woodstock in a reading nook with a cat and candles",
  "Snoopy and Woodstock as wizards casting spells in a magic school",
  "Snoopy and Woodstock in an enchanted fairy tale forest",
  "Snoopy and Woodstock riding a dragon over a fantasy castle",
  "Snoopy and Woodstock as knights in shining armor",
  "Snoopy and Woodstock in a magical underwater kingdom",
  "Snoopy and Woodstock as forest spirits in a glowing grove",
  "Snoopy and Woodstock in a cloud kingdom above the clouds",
  "Snoopy and Woodstock discovering a portal to another world",
  "Snoopy and Woodstock in a candy kingdom sweet fantasy",
  "Snoopy and Woodstock riding a giant sea turtle underwater",
  "Snoopy and Woodstock in a crystal cave with glowing gems",
  "Snoopy and Woodstock as time travelers in ancient Egypt",
  "Snoopy and Woodstock in a dreamland with floating islands",
  "Snoopy and Woodstock as superheroes flying over a city",
  "Snoopy and Woodstock as simple geometric shapes bold colors",
  "Snoopy and Woodstock as minimal line art on white background",
  "Snoopy and Woodstock as negative space silhouettes",
  "Snoopy and Woodstock as origami paper fold style",
  "Snoopy and Woodstock as monochrome ink brush strokes",
  "Snoopy and Woodstock as flat vector illustrations",
  "Snoopy and Woodstock as watercolor washes with minimal detail",
  "Snoopy and Woodstock as Scandinavian folk art motifs",
  "Snoopy and Woodstock as constructivist bold shapes",
  "Snoopy and Woodstock as minimalist mountain and moon design",
  "Snoopy and Woodstock decorating for Christmas in snow",
  "Snoopy and Woodstock in Halloween costumes trick or treating",
  "Snoopy and Woodstock at a Fourth of July fireworks picnic",
  "Snoopy and Woodstock celebrating New Year with confetti",
  "Snoopy and Woodstock at an Easter egg hunt in spring garden",
  "Snoopy and Woodstock at a Valentines Day picnic with hearts",
  "Snoopy and Woodstock celebrating Thanksgiving with a feast",
  "Snoopy and Woodstock at a Hanukkah menorah lighting",
  "Snoopy and Woodstock at a Diwali festival with lanterns",
  "Snoopy and Woodstock at a Chinese New Year parade with dragons",
  "Snoopy and Woodstock at a summer solstice bonfire",
  "Snoopy and Woodstock at a harvest moon festival",
  "Snoopy and Woodstock at a winter solstice lantern ceremony",
  "Snoopy and Woodstock with a family of deer in a forest",
  "Snoopy and Woodstock swimming with dolphins in the ocean",
  "Snoopy and Woodstock with a majestic eagle soaring above",
  "Snoopy and Woodstock with baby ducks following in a line",
  "Snoopy and Woodstock with a wise old owl in a moonlit tree",
  "Snoopy and Woodstock with butterflies in a meadow",
  "Snoopy and Woodstock with a family of foxes at sunset",
  "Snoopy and Woodstock with fireflies in a summer evening",
  "Snoopy and Woodstock with a polar bear on an ice floe",
  "Snoopy and Woodstock with a penguin colony in Antarctica",
  "Snoopy and Woodstock with elephants in an African savanna",
  "Snoopy and Woodstock with wild horses running on plains",
  "Snoopy and Woodstock with a red fox in autumn forest",
  "Snoopy and Woodstock with a turtle on a tropical beach",
  "Snoopy and Woodstock laughing together under a blue sky",
  "Snoopy and Woodstock in a peaceful contemplative moment",
  "Snoopy and Woodstock in a joyful celebratory dance",
  "Snoopy and Woodstock sharing a quiet tender moment",
  "Snoopy and Woodstock in a dreamy hazy summer afternoon",
  "Snoopy and Woodstock in a nostalgic golden memory",
  "Snoopy and Woodstock in a serene meditative stillness",
  "Snoopy and Woodstock in a magical wonder-filled discovery",
  "Snoopy and Woodstock in a gentle loving friendship",
  "Snoopy and Woodstock in a deep navy and gold color palette",
  "Snoopy and Woodstock in a coral and turquoise tropical palette",
  "Snoopy and Woodstock in a forest green and rust palette",
  "Snoopy and Woodstock in a lavender and cream palette",
  "Snoopy and Woodstock in a midnight blue and silver palette",
  "Snoopy and Woodstock in a warm terracotta and sage palette",
  "Snoopy and Woodstock in a cherry red and cream palette",
  "Snoopy and Woodstock in a dusty pink and charcoal palette",
  "Snoopy and Woodstock in a vibrant citrus palette",
  "Snoopy and Woodstock in a soft mint and blush palette",
  "Snoopy and Woodstock in an earthy brown and amber palette",
  "Snoopy and Woodstock in a bold primary colors palette",
  "Snoopy and Woodstock in a pastel rainbow palette",
  "Snoopy and Woodstock in watercolor painting style loose washes",
  "Snoopy and Woodstock in gouache painting style bold colors",
  "Snoopy and Woodstock in oil painting impressionist style",
  "Snoopy and Woodstock in linocut print style bold graphic",
  "Snoopy and Woodstock in screen print style limited colors",
  "Snoopy and Woodstock in risograph print style layered colors",
  "Snoopy and Woodstock in mosaic tile art style",
  "Snoopy and Woodstock in stained glass illustration style",
  "Snoopy and Woodstock in embroidery patch style",
  "Snoopy and Woodstock in rubber stamp print style",
  "Snoopy and Woodstock in Victorian botanical illustration style",
  "Snoopy and Woodstock in Art Nouveau flowing lines style",
  "Snoopy and Woodstock in Bauhaus geometric design style",
  "Snoopy and Woodstock in ukiyo-e Japanese woodblock style",
  "Snoopy and Woodstock in a rooftop garden with city skyline",
  "Snoopy and Woodstock tending a rose garden in full bloom",
  "Snoopy and Woodstock in a succulent and cactus garden",
  "Snoopy and Woodstock in a tropical jungle garden",
  "Snoopy and Woodstock in a wildflower meadow at dusk",
  "Snoopy and Woodstock harvesting vegetables in a kitchen garden",
  "Snoopy and Woodstock making flower crowns in a meadow",
  "Snoopy and Woodstock in a herb garden on a sunny morning",
  "Snoopy and Woodstock with giant sunflowers towering above",
  "Snoopy and Woodstock in a lavender field at golden hour",
  "Snoopy and Woodstock on a sailboat in turquoise waters",
  "Snoopy and Woodstock exploring a sea cave at low tide",
  "Snoopy and Woodstock watching whales breach in the ocean",
  "Snoopy and Woodstock on a paddleboard at sunrise",
  "Snoopy and Woodstock collecting sea glass on a beach",
  "Snoopy and Woodstock watching bioluminescent waves at night",
  "Snoopy and Woodstock building an elaborate sandcastle",
  "Snoopy and Woodstock snorkeling in a coral reef",
  "Snoopy and Woodstock at a lighthouse during a storm",
  "Snoopy and Woodstock on a fire escape in New York City",
  "Snoopy and Woodstock in a cozy Tokyo alley at night",
  "Snoopy and Woodstock in a London telephone booth",
  "Snoopy and Woodstock at a Parisian sidewalk cafe",
  "Snoopy and Woodstock in a neon-lit Hong Kong street",
  "Snoopy and Woodstock in a Barcelona mosaic plaza",
  "Snoopy and Woodstock on a San Francisco cable car",
  "Snoopy and Woodstock in a Berlin street art alley",
  "Snoopy and Woodstock on a New Orleans jazz street corner",
  "Snoopy and Woodstock in a Marrakech spice market",
  "Snoopy and Woodstock in a Sydney harbor at sunset",
  "Snoopy and Woodstock on a rooftop with city lights below",
  "Snoopy and Woodstock sharing a secret under a starry sky",
  "Snoopy giving Woodstock a piggyback through a meadow",
  "Snoopy and Woodstock high-fiving after an adventure",
  "Snoopy and Woodstock falling asleep together under a tree",
  "Snoopy and Woodstock finding treasure on a beach",
  "Snoopy and Woodstock sharing an umbrella in a surprise rain",
  "Snoopy and Woodstock watching their shadows in golden light",
  "Snoopy and Woodstock leaving footprints in fresh snow",
  "Snoopy and Woodstock watching fireflies in a summer field",
  "Snoopy and Woodstock in a grove of glowing mushrooms",
  "Snoopy and Woodstock by a waterfall hidden in a forest",
  "Snoopy and Woodstock discovering a hidden mountain lake",
  "Snoopy and Woodstock watching migrating birds fly south",
  "Snoopy and Woodstock in a forest after a fresh snowfall",
  "Snoopy and Woodstock by a glowing evening campfire",
  "Snoopy and Woodstock in a swirling Van Gogh starry night",
  "Snoopy and Woodstock in Monets water lily garden",
  "Snoopy and Woodstock in a Matisse colorful cutout style",
  "Snoopy and Woodstock in a Keith Haring bold line style",
  "Snoopy and Woodstock in a Klimt gold leaf decorative style",
  "Snoopy and Woodstock in a Hokusai wave dramatic scene",
  "Snoopy and Woodstock in a Rousseau jungle naive style",
  "Snoopy and Woodstock in a Chagall floating dream style",
  "Snoopy and Woodstock as lighthouse keepers in a storm",
  "Snoopy and Woodstock as park rangers in a national forest",
  "Snoopy and Woodstock as beekeepers in a wildflower meadow",
  "Snoopy and Woodstock as mail carriers on a snowy route",
  "Snoopy and Woodstock as librarians in a magical library",
  "Snoopy and Woodstock as mapmakers on a mountain expedition",
  "Snoopy and Woodstock as night sky photographers in a desert",
  "Snoopy and Woodstock as bird watchers in a misty marsh",
  "Snoopy and Woodstock as cave explorers with lanterns",
  "Snoopy and Woodstock as river guides on a canyon expedition",
  "Snoopy and Woodstock as cloud watchers on a grassy hill",
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
        contents: [{ parts: [{ text: "Based on this Snoopy and Woodstock art description: \"" + prompt + "\"\n\nGenerate an optimized Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n  \"title\": \"Etsy-optimized title under 80 chars. Format: [Characters] [Scene] Canvas Print – Peanuts [Art Type] Wall Decor. Examples: Snoopy Woodstock Stargazing Canvas Print – Peanuts Night Sky Wall Decor. Snoopy Woodstock Beach Canvas Print – Peanuts Summer Art Wall Decor. NO the word Wall Art twice, NO commas, use a dash separator, keep it clean and specific.\",\n  \"description\": \"3 engaging paragraphs about this specific artwork scene, the canvas print quality, and who would love it as a gift.\",\n  \"tags\": [\"IMPORTANT: exactly 13 tags, each tag must be under 20 characters, no special characters, focused on Snoopy Peanuts and the specific scene. Examples of good tags: Snoopy wall art, Peanuts poster, Woodstock print, Snoopy gift, Peanuts decor, cartoon art print, Snoopy canvas, kids room art, Peanuts fan gift, Snoopy lover, beagle wall art, nursery art, Peanuts artwork\"]\n}" }] }],
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
    "Snoopy wall art",
    "Peanuts poster",
    "Woodstock print",
    "Snoopy gift",
    "Peanuts decor",
    "cartoon art print",
    "Snoopy canvas",
    "kids room art",
    "Peanuts fan gift",
    "Snoopy lover",
    "beagle wall art",
    "nursery art",
    "Peanuts artwork",
    "Snoopy print",
    "Peanuts wall art",
    "Snoopy home decor",
    "Woodstock art",
    "Peanuts gift",
    "cartoon canvas",
    "Snoopy art print"
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
        filtered.push("Snoopy art " + filtered.length);
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

async function enableOffsiteAdsPuppeteer(productId) {
  console.log("Launching stealth browser to enable offsite ads...");
  var puppeteer = require("puppeteer-extra");
  var StealthPlugin = require("puppeteer-extra-plugin-stealth");
  puppeteer.use(StealthPlugin());

  var browser = await puppeteer.launch({
    executablePath: require("puppeteer").executablePath(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--window-size=1280,800"]
  });

  try {
    var page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    console.log("Navigating to Printify login...");
    await page.goto("https://printify.com/app/login", { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 10000); });

    var inputDebug = await page.evaluate(function() {
      var inputs = document.querySelectorAll("input");
      var info = "Inputs: " + inputs.length + " | ";
      for (var i = 0; i < inputs.length; i++) {
        info += "[type=" + inputs[i].type + " name=" + inputs[i].name + "] ";
      }
      return info;
    });
    console.log(inputDebug);

    // Type into username field
    await page.evaluate(function(email) {
      var inputs = document.querySelectorAll("input");
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type === "text" || inputs[i].name === "username" || inputs[i].type === "email") {
          inputs[i].focus();
          inputs[i].value = email;
          inputs[i].dispatchEvent(new Event("input", { bubbles: true }));
          inputs[i].dispatchEvent(new Event("change", { bubbles: true }));
          break;
        }
      }
    }, PRINTIFY_EMAIL);

    await new Promise(function(r) { setTimeout(r, 500); });

    // Type into password field
    await page.evaluate(function(pass) {
      var inputs = document.querySelectorAll("input");
      for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].type === "password") {
          inputs[i].focus();
          inputs[i].value = pass;
          inputs[i].dispatchEvent(new Event("input", { bubbles: true }));
          inputs[i].dispatchEvent(new Event("change", { bubbles: true }));
          break;
        }
      }
    }, PRINTIFY_PASSWORD);

    await new Promise(function(r) { setTimeout(r, 500); });

    // Click submit
    await page.evaluate(function() {
      var buttons = document.querySelectorAll("button");
      for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].type === "submit" || buttons[i].textContent.toLowerCase().includes("log in") || buttons[i].textContent.toLowerCase().includes("sign in")) {
          buttons[i].click();
          return;
        }
      }
    });

    console.log("Login submitted, waiting...");
    await new Promise(function(r) { setTimeout(r, 12000); });

    var currentUrl = page.url();
    console.log("URL after login:", currentUrl);

    if (currentUrl.includes("login") || currentUrl.includes("auth")) {
      throw new Error("Login failed - Cloudflare may be blocking. URL: " + currentUrl);
    }

    console.log("Logged in! Navigating to product...");
    await page.goto("https://printify.com/app/store/products/1", { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 5000); });

    await page.goto("https://printify.com/app/product-details/" + productId + "?fromProductsPage=1", { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise(function(r) { setTimeout(r, 8000); });

    console.log("On product page:", page.url());

    var toggled = await page.evaluate(function() {
      var switches = document.querySelectorAll("button[role=switch]");
      for (var i = 0; i < switches.length; i++) {
        var btn = switches[i];
        var parent = btn.parentElement;
        for (var j = 0; j < 6; j++) {
          if (!parent) break;
          if (parent.innerText && (parent.innerText.toLowerCase().includes("off-site") || parent.innerText.toLowerCase().includes("offsite"))) {
            var isOn = btn.getAttribute("aria-checked") === "true";
            if (!isOn) { btn.click(); return "clicked"; }
            return "already-on";
          }
          parent = parent.parentElement;
        }
      }
      var info = "switches=" + switches.length + " bodyHasText=" + (document.body.innerText.toLowerCase().includes("off-site"));
      return "not-found:" + info;
    });

    console.log("Toggle result:", toggled);

    if (toggled === "clicked") {
      await new Promise(function(r) { setTimeout(r, 1500); });
      await page.evaluate(function() {
        var buttons = document.querySelectorAll("button");
        for (var i = 0; i < buttons.length; i++) {
          if (buttons[i].textContent.trim() === "Save as draft") { buttons[i].click(); return; }
        }
      });
      await new Promise(function(r) { setTimeout(r, 2000); });
      console.log("Offsite ads enabled and saved!");
    }

  } catch (err) {
    console.error("Puppeteer error:", err.message);
  } finally {
    await browser.close();
  }
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
  try { require("puppeteer-extra"); } catch (e) {
    require("child_process").execSync("npm install puppeteer-extra puppeteer-extra-plugin-stealth", { stdio: "inherit" });
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
