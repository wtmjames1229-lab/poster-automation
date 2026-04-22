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

// Valid Etsy tags — all under 20 chars, no special chars
const TAG_POOL = [
  "Snoopy wall art",
  "Snoopy print",
  "Peanuts decor",
  "Peanuts wall art",
  "Woodstock print",
  "cartoon wall art",
  "canvas wall art",
  "nursery wall art",
  "kids room decor",
  "cute wall art",
  "whimsical art",
  "gallery wall art",
  "large wall art",
  "home decor print",
  "living room art",
  "bedroom wall art",
  "colorful wall art",
  "gift for kids",
  "Peanuts gift",
  "Snoopy gift",
  "wall art print",
  "canvas print",
  "stretched canvas",
  "ready to hang",
  "multiple sizes",
  "vintage cartoon",
  "retro wall art",
  "fun wall decor",
  "playful art",
  "dog wall art"
];

function pickTags() {
  var shuffled = TAG_POOL.slice().sort(function() { return Math.random() - 0.5; });
  return shuffled.slice(0, 13);
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
  // RETRO & VINTAGE STYLES
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
  // COLLAGE STYLES
  "Collage of Snoopy and Woodstock through all four seasons",
  "Collage of Snoopy and Woodstock in different countries around the world",
  "Collage of Snoopy and Woodstock doing different sports",
  "Collage of Snoopy and Woodstock at different times of day",
  "Collage of Snoopy and Woodstock in different weather conditions",
  "Collage of tiny Snoopy and Woodstock scenes in a grid pattern",
  "Collage of Snoopy and Woodstock emojis and icons",
  "Collage of Snoopy and Woodstock in different art styles",
  "Collage of Snoopy and Woodstock celebrating different holidays",
  "Collage of Snoopy and Woodstock silhouettes in colorful shapes",
  "Collage of Snoopy and Woodstock in vintage stamp style",
  "Collage of Snoopy and Woodstock as botanical illustrations",
  "Collage of Snoopy and Woodstock with patterns and geometric shapes",
  "Collage mosaic of Snoopy and Woodstock made from tiny scenes",
  "Collage of Snoopy and Woodstock in different decades fashion",
  // NATURE & LANDSCAPES
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
  // COSMIC & SPACE
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
  // FOOD & COOKING
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
  // MUSIC & ARTS
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
  // SPORTS & ACTIVITIES
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
  "Snoopy and Woodstock doing synchronized swimming",
  "Snoopy and Woodstock in a marathon race through a city",
  "Snoopy and Woodstock bowling on a retro lane",
  "Snoopy and Woodstock playing ping pong in a basement",
  // TRAVEL & ADVENTURE
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
  "Snoopy and Woodstock on a boat in Ha Long Bay Vietnam",
  "Snoopy and Woodstock at the colosseum in Rome at sunset",
  "Snoopy and Woodstock in a cable car over Hong Kong",
  "Snoopy and Woodstock watching the midnight sun in Alaska",
  // COZY & COMFORT
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
  "Snoopy and Woodstock in a boat cabin on a rainy lake",
  "Snoopy and Woodstock in a tiny house surrounded by nature",
  "Snoopy and Woodstock in a reading nook with a cat and candles",
  // FANTASY & MAGICAL
  "Snoopy and Woodstock as wizards casting spells in a magic school",
  "Snoopy and Woodstock in an enchanted fairy tale forest",
  "Snoopy and Woodstock riding a dragon over a fantasy castle",
  "Snoopy and Woodstock as knights in shining armor",
  "Snoopy and Woodstock in a magical underwater kingdom",
  "Snoopy and Woodstock as forest spirits in a glowing grove",
  "Snoopy and Woodstock in a cloud kingdom above the clouds",
  "Snoopy and Woodstock discovering a portal to another world",
  "Snoopy and Woodstock in a candy kingdom sweet fantasy",
  "Snoopy and Woodstock as fairy tale characters in a storybook",
  "Snoopy and Woodstock riding a giant sea turtle underwater",
  "Snoopy and Woodstock in a crystal cave with glowing gems",
  "Snoopy and Woodstock as time travelers in ancient Egypt",
  "Snoopy and Woodstock in a dreamland with floating islands",
  "Snoopy and Woodstock as superheroes flying over a city",
  // MINIMALIST & GEOMETRIC
  "Snoopy and Woodstock as simple geometric shapes bold colors",
  "Snoopy and Woodstock as minimal line art on white background",
  "Snoopy and Woodstock as abstract color block shapes",
  "Snoopy and Woodstock as negative space silhouettes",
  "Snoopy and Woodstock as origami paper fold style",
  "Snoopy and Woodstock as simple icons in a grid",
  "Snoopy and Woodstock as monochrome ink brush strokes",
  "Snoopy and Woodstock as flat vector illustrations",
  "Snoopy and Woodstock as watercolor washes with minimal detail",
  "Snoopy and Woodstock as bold graphic print patterns",
  "Snoopy and Woodstock as Scandinavian folk art motifs",
  "Snoopy and Woodstock as Swiss poster design style",
  "Snoopy and Woodstock as constructivist bold shapes",
  "Snoopy and Woodstock as Japanese mon crest design",
  "Snoopy and Woodstock as minimalist mountain and moon design",
  // HOLIDAY & CELEBRATIONS
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
  "Snoopy and Woodstock at a Mexican Dia de los Muertos celebration",
  "Snoopy and Woodstock at a summer solstice bonfire",
  "Snoopy and Woodstock at a harvest moon festival",
  "Snoopy and Woodstock at a spring equinox flower festival",
  "Snoopy and Woodstock at a winter solstice lantern ceremony",
  // ANIMALS & NATURE FRIENDS
  "Snoopy and Woodstock with a family of deer in a forest",
  "Snoopy and Woodstock swimming with dolphins in the ocean",
  "Snoopy and Woodstock with a majestic eagle soaring above",
  "Snoopy and Woodstock with baby ducks following in a line",
  "Snoopy and Woodstock with a wise old owl in a moonlit tree",
  "Snoopy and Woodstock with butterflies in a meadow",
  "Snoopy and Woodstock with a family of foxes at sunset",
  "Snoopy and Woodstock with fireflies in a summer evening",
  "Snoopy and Woodstock with a school of colorful fish",
  "Snoopy and Woodstock with a polar bear on an ice floe",
  "Snoopy and Woodstock with a penguin colony in Antarctica",
  "Snoopy and Woodstock with elephants in an African savanna",
  "Snoopy and Woodstock with wild horses running on plains",
  "Snoopy and Woodstock with a red fox in autumn forest",
  "Snoopy and Woodstock with a turtle on a tropical beach",
  // MOODS & EMOTIONS
  "Snoopy and Woodstock laughing together under a blue sky",
  "Snoopy and Woodstock in a peaceful contemplative moment",
  "Snoopy and Woodstock in a joyful celebratory dance",
  "Snoopy and Woodstock sharing a quiet tender moment",
  "Snoopy and Woodstock in a dreamy hazy summer afternoon",
  "Snoopy and Woodstock in a melancholy but beautiful rainy scene",
  "Snoopy and Woodstock in a nostalgic golden memory",
  "Snoopy and Woodstock in an energetic playful romp",
  "Snoopy and Woodstock in a serene meditative stillness",
  "Snoopy and Woodstock in a whimsical silly moment",
  "Snoopy and Woodstock in a brave adventurous spirit",
  "Snoopy and Woodstock in a cozy contented warmth",
  "Snoopy and Woodstock in a magical wonder-filled discovery",
  "Snoopy and Woodstock in a proud triumphant moment",
  "Snoopy and Woodstock in a gentle loving friendship",
  // COLOR PALETTE THEMES
  "Snoopy and Woodstock in a deep navy and gold color palette",
  "Snoopy and Woodstock in a coral and turquoise tropical palette",
  "Snoopy and Woodstock in a forest green and rust palette",
  "Snoopy and Woodstock in a lavender and cream palette",
  "Snoopy and Woodstock in a midnight blue and silver palette",
  "Snoopy and Woodstock in a warm terracotta and sage palette",
  "Snoopy and Woodstock in a cherry red and cream palette",
  "Snoopy and Woodstock in a dusty pink and charcoal palette",
  "Snoopy and Woodstock in a vibrant citrus palette",
  "Snoopy and Woodstock in a moody dark jewel tones palette",
  "Snoopy and Woodstock in a soft mint and blush palette",
  "Snoopy and Woodstock in an earthy brown and amber palette",
  "Snoopy and Woodstock in a bold primary colors palette",
  "Snoopy and Woodstock in a pastel rainbow palette",
  "Snoopy and Woodstock in a black and warm cream palette",
  // ART STYLE VARIATIONS
  "Snoopy and Woodstock in watercolor painting style loose washes",
  "Snoopy and Woodstock in gouache painting style bold colors",
  "Snoopy and Woodstock in oil painting impressionist style",
  "Snoopy and Woodstock in linocut print style bold graphic",
  "Snoopy and Woodstock in screen print style limited colors",
  "Snoopy and Woodstock in risograph print style layered colors",
  "Snoopy and Woodstock in mosaic tile art style",
  "Snoopy and Woodstock in stained glass illustration style",
  "Snoopy and Woodstock in tapestry weave pattern style",
  "Snoopy and Woodstock in embroidery patch style",
  "Snoopy and Woodstock in sticker sheet illustration style",
  "Snoopy and Woodstock in enamel pin badge illustration style",
  "Snoopy and Woodstock in rubber stamp print style",
  "Snoopy and Woodstock in cave painting primitive art style",
  "Snoopy and Woodstock in ancient fresco painting style",
  "Snoopy and Woodstock in Victorian botanical illustration style",
  "Snoopy and Woodstock in Art Nouveau flowing lines style",
  "Snoopy and Woodstock in Bauhaus geometric design style",
  "Snoopy and Woodstock in ukiyo-e Japanese woodblock style",
  "Snoopy and Woodstock in medieval illuminated manuscript style",
  // GARDENING & PLANTS
  "Snoopy and Woodstock in a rooftop garden with city skyline",
  "Snoopy and Woodstock tending a rose garden in full bloom",
  "Snoopy and Woodstock in a succulent and cactus garden",
  "Snoopy and Woodstock in a tropical jungle garden",
  "Snoopy and Woodstock in a formal French garden with topiaries",
  "Snoopy and Woodstock in a wildflower meadow at dusk",
  "Snoopy and Woodstock harvesting vegetables in a kitchen garden",
  "Snoopy and Woodstock in a bonsai garden",
  "Snoopy and Woodstock making flower crowns in a meadow",
  "Snoopy and Woodstock in a herb garden on a sunny morning",
  "Snoopy and Woodstock planting a tree sapling",
  "Snoopy and Woodstock in an orchard with fruit trees",
  "Snoopy and Woodstock in a moss garden after rain",
  "Snoopy and Woodstock with giant sunflowers towering above",
  "Snoopy and Woodstock in a lavender field at golden hour",
  // WATER & OCEAN
  "Snoopy and Woodstock on a sailboat in turquoise waters",
  "Snoopy and Woodstock exploring a sea cave at low tide",
  "Snoopy and Woodstock watching whales breach in the ocean",
  "Snoopy and Woodstock on a paddleboard at sunrise",
  "Snoopy and Woodstock in a mangrove kayak adventure",
  "Snoopy and Woodstock collecting sea glass on a beach",
  "Snoopy and Woodstock in a tide pool discovering sea creatures",
  "Snoopy and Woodstock watching bioluminescent waves at night",
  "Snoopy and Woodstock on a dock watching fishing boats return",
  "Snoopy and Woodstock building an elaborate sandcastle",
  "Snoopy and Woodstock snorkeling in a coral reef",
  "Snoopy and Woodstock on a ferry watching seagulls",
  "Snoopy and Woodstock in a sea cave with colored light",
  "Snoopy and Woodstock watching a ship disappear on the horizon",
  "Snoopy and Woodstock at a lighthouse during a storm",
  // CITY & URBAN
  "Snoopy and Woodstock on a fire escape in New York City",
  "Snoopy and Woodstock in a cozy Tokyo alley at night",
  "Snoopy and Woodstock in a London telephone booth",
  "Snoopy and Woodstock at a Parisian sidewalk cafe",
  "Snoopy and Woodstock in a neon-lit Hong Kong street",
  "Snoopy and Woodstock on a Chicago river architecture tour",
  "Snoopy and Woodstock in a Barcelona mosaic plaza",
  "Snoopy and Woodstock on a San Francisco cable car",
  "Snoopy and Woodstock in a Berlin street art alley",
  "Snoopy and Woodstock on a New Orleans jazz street corner",
  "Snoopy and Woodstock in a Marrakech spice market",
  "Snoopy and Woodstock at an Istanbul bazaar",
  "Snoopy and Woodstock in a Sydney harbor at sunset",
  "Snoopy and Woodstock in a Mumbai street festival",
  "Snoopy and Woodstock on a rooftop with city lights below",
  // FRIENDSHIP MOMENTS
  "Snoopy and Woodstock sharing a secret under a starry sky",
  "Snoopy giving Woodstock a piggyback through a meadow",
  "Snoopy and Woodstock high-fiving after an adventure",
  "Snoopy and Woodstock falling asleep together under a tree",
  "Snoopy and Woodstock finding treasure on a beach",
  "Snoopy and Woodstock helping each other up a steep hill",
  "Snoopy and Woodstock sharing an umbrella in a surprise rain",
  "Snoopy and Woodstock watching their shadows in golden light",
  "Snoopy and Woodstock leaving footprints in fresh snow",
  // ABSTRACT & ARTISTIC
  "Snoopy and Woodstock in a swirling Van Gogh starry night",
  "Snoopy and Woodstock in Monets water lily garden",
  "Snoopy and Woodstock in a Matisse colorful cutout style",
  "Snoopy and Woodstock in a Keith Haring bold line style",
  "Snoopy and Woodstock in a Klimt gold leaf decorative style",
  "Snoopy and Woodstock in a Hokusai wave dramatic scene",
  "Snoopy and Woodstock in a Rousseau jungle naive style",
  "Snoopy and Woodstock in a Chagall floating dream style",
  "Snoopy and Woodstock in a Miro colorful surreal shapes",
  // FINAL UNIQUE SCENES
  "Snoopy and Woodstock as lighthouse keepers in a storm",
  "Snoopy and Woodstock as park rangers in a national forest",
  "Snoopy and Woodstock as beekeepers in a wildflower meadow",
  "Snoopy and Woodstock as mail carriers on a snowy route",
  "Snoopy and Woodstock as librarians in a magical library",
  "Snoopy and Woodstock as mapmakers on a mountain expedition",
  "Snoopy and Woodstock as weather watchers at a hilltop station",
  "Snoopy and Woodstock as night sky photographers in a desert",
  "Snoopy and Woodstock as bird watchers in a misty marsh",
  "Snoopy and Woodstock as cave explorers with lanterns",
  "Snoopy and Woodstock as river guides on a canyon expedition",
  "Snoopy and Woodstock as cloud watchers on a grassy hill",
];

// Flat rate prices in cents
const VERTICAL_VARIANTS = [
  { id: 101413, w: 2400,  h: 3000,  price: 5142  }, // 8x10
  { id: 91641,  w: 3300,  h: 4200,  price: 6336  }, // 11x14
  { id: 91644,  w: 3600,  h: 5400,  price: 8420  }, // 12x18
  { id: 91647,  w: 4800,  h: 7200,  price: 10820 }, // 16x24
  { id: 91649,  w: 6000,  h: 7200,  price: 13200 }, // 20x24
  { id: 101411, w: 7200,  h: 9000,  price: 16966 }, // 24x30
  { id: 91654,  w: 9000,  h: 12000, price: 23762 }, // 30x40
  { id: 91655,  w: 9600,  h: 14400, price: 34684 }, // 32x48
  { id: 112955, w: 12000, h: 18000, price: 50026 }, // 40x60
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
        contents: [{ parts: [{ text: "Based on this Snoopy and Woodstock art description: \"" + prompt + "\"\n\nGenerate an optimized Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n  \"title\": \"SEO-optimized Etsy title under 140 chars. Must include: Snoopy, canvas wall art or canvas print, and a keyword like home decor or nursery decor. Make it compelling and specific to the scene.\",\n  \"description\": \"3 engaging paragraphs. Paragraph 1: describe the artwork scene vividly. Paragraph 2: describe the quality - premium canvas print, gallery wrapped, ready to hang, vibrant colors. Paragraph 3: who this is perfect for as a gift, available in 9 sizes from 8x10 to 40x60.\"\n}" }] }],
        generationConfig: { responseModalities: ["TEXT"] }
      })
    }
  );
  var data = await res.json();
  var text = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  if (!text) throw new Error("Listing generation failed: " + JSON.stringify(data));
  var clean = text.replace(/```json|```/g, "").trim();
  var listing = JSON.parse(clean);
  // Always use our hardcoded valid tags instead of AI-generated ones
  listing.tags = pickTags();
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
  console.log("Launching browser to enable offsite ads...");
  var puppeteer = require("puppeteer");
  var browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });
  try {
    var page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    // Log in to Printify
    console.log("Logging into Printify...");
    await page.goto("https://printify.com/app/login", { waitUntil: "networkidle2" });
    await page.waitForSelector("input[type=email]", { timeout: 15000 });
    await page.type("input[type=email]", PRINTIFY_EMAIL, { delay: 50 });
    await page.type("input[type=password]", PRINTIFY_PASSWORD, { delay: 50 });
    await page.click("button[type=submit]");
    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 });
    console.log("Logged in, navigating to product...");

    // Navigate to product page
    var productUrl = "https://printify.com/app/product-details/" + productId + "?fromProductsPage=1";
    await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for and click offsite ads toggle
    console.log("Looking for offsite ads toggle...");
    await page.waitForSelector(".pricing-section", { timeout: 15000 }).catch(function() {});
    await new Promise(function(r) { setTimeout(r, 3000); });

    // Find the offsite ads toggle - it's near text "Etsy off-site ads"
    var toggled = await page.evaluate(function() {
      var labels = document.querySelectorAll("label, span, p");
      for (var i = 0; i < labels.length; i++) {
        if (labels[i].textContent && labels[i].textContent.includes("off-site ads")) {
          // Find nearby toggle/checkbox
          var parent = labels[i].closest("div");
          if (parent) {
            var toggle = parent.querySelector("input[type=checkbox], button[role=switch], .toggle, [class*=toggle]");
            if (toggle) {
              var isChecked = toggle.checked || toggle.getAttribute("aria-checked") === "true";
              if (!isChecked) {
                toggle.click();
                return "clicked";
              }
              return "already-on";
            }
          }
        }
      }
      return "not-found";
    });
    console.log("Toggle result:", toggled);

    if (toggled === "clicked" || toggled === "already-on") {
      // Click Save as draft
      await new Promise(function(r) { setTimeout(r, 1000); });
      var saved = await page.evaluate(function() {
        var buttons = document.querySelectorAll("button");
        for (var i = 0; i < buttons.length; i++) {
          if (buttons[i].textContent && buttons[i].textContent.trim() === "Save as draft") {
            buttons[i].click();
            return true;
          }
        }
        return false;
      });
      console.log("Saved:", saved);
      await new Promise(function(r) { setTimeout(r, 2000); });
    }
  } catch (err) {
    console.error("Puppeteer error:", err.message);
  } finally {
    await browser.close();
  }
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
    shipping_template: true
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
  try { require("puppeteer"); } catch (e) {
    console.log("Installing puppeteer...");
    require("child_process").execSync("npm install puppeteer", { stdio: "inherit" });
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
      await enableOffsiteAdsPuppeteer(productId);
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
