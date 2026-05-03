// POD Automation Pipeline - Hybrid (Old Style + Retro Comic)
// Each run: 3 old-style listings (all 5 sizes) + 2 retro comic listings (3 larger sizes)
// Gemini → Printify → Etsy
// Run with: node automation.js

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const PRINTIFY_EMAIL = process.env.PRINTIFY_EMAIL;
const PRINTIFY_PASSWORD = process.env.PRINTIFY_PASSWORD;
const SHOP_ID = '18634010';
const EBAY_SHOP_ID = '27315339';
const BLUEPRINT_ID = 1297;
const PRINT_PROVIDER_ID = 259;

// =============================================================================
// OLD STYLE - clean illustrations, no text, all 5 canvas sizes
// =============================================================================

const OLD_PROMPTS = [
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

// Old style: all 5 sizes with new blueprint
const OLD_VARIANTS = [
  { id: 96926, w: 2365, h: 2955, price: 5038  }, // 8x10
  { id: 96930, w: 2955, h: 3546, price: 6669  }, // 10x12
  { id: 96944, w: 4727, h: 5920, price: 9915  }, // 16x20
  { id: 96946, w: 5920, h: 7101, price: 12095 }, // 20x24
  { id: 96956, w: 7101, h: 8884, price: 17164 }, // 24x30
];

// =============================================================================
// RETRO COMIC STYLE - vintage pulp covers with title text, 3 larger sizes
// =============================================================================

const BACKGROUND_COLORS = [
  "teal", "deep navy blue", "burnt orange", "cream", "hot pink", "lime green",
  "magenta", "aqua blue", "coral pink", "olive green", "rust orange",
  "avocado green", "harvest gold", "deep purple", "midnight blue",
  "charcoal grey", "pale mint green", "dusty pink", "periwinkle blue",
  "crimson red", "forest green", "mustard yellow", "brick red", "sage green",
  "lavender", "salmon", "ochre", "terracotta", "maroon", "powder blue",
  "buttercream yellow", "khaki", "warm beige", "burgundy", "plum purple",
  "robin egg blue", "mint green", "peach", "butter yellow", "soft coral",
  "chocolate brown", "muted gold", "olive drab", "deep teal", "dusty rose",
  "slate blue", "sand tan", "moss green", "cherry red", "tangerine orange",
  "denim blue", "cocoa brown", "watermelon pink", "honey gold", "deep emerald"
];

const TITLE_COLORS = [
  "mustard yellow", "golden yellow", "cream", "white", "hot pink", "turquoise",
  "lime green", "hot orange", "sage green", "salmon pink", "peach",
  "butter yellow", "crimson red", "black", "off-white", "lavender",
  "harvest gold", "brick red", "neon yellow", "coral", "rich gold",
  "ivory", "pale yellow", "fire-engine red", "electric blue", "magenta",
  "powder pink", "burnt sienna", "lemon yellow", "deep red", "tangerine"
];

const ACCENT_COLORS = [
  "brick red", "crimson red", "navy blue", "dark brown", "lemon yellow",
  "electric blue", "golden yellow", "deep brown", "olive", "warm brown",
  "mint green", "red", "mustard", "deep red", "white", "gold", "cream",
  "burnt orange", "forest green", "ochre", "rust", "burgundy", "indigo",
  "magenta", "lime", "aqua", "salmon", "peach", "lavender", "charcoal",
  "ivory", "wine red", "copper", "khaki", "teal"
];

const HIGHLIGHT_COLORS = [
  "cream", "off-white", "white", "pale yellow", "peach", "buttercream",
  "ivory", "soft mint", "powder pink", "light grey", "pearl white",
  "warm cream", "vanilla", "dusty white", "soft beige", "champagne",
  "pale gold", "linen", "eggshell", "dove grey"
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickPalette() {
  var bg = pickRandom(BACKGROUND_COLORS);
  var title = pickRandom(TITLE_COLORS);
  var accent = pickRandom(ACCENT_COLORS);
  var highlight = pickRandom(HIGHLIGHT_COLORS);
  return bg + " background with " + title + " title, " + accent + " accents, and " + highlight + " highlights";
}

function buildRetroStyleSuffix(palette) {
  return " in vintage 1960s pulp comic book cover style, aged paper texture, halftone dot shading, bold black ink outlines, color scheme: " + palette + ", slight registration offset like old print, weathered edges, dynamic action composition, bold colorful flat illustration. Render the title text and ribbon banner text exactly as quoted in the prompt, clearly legible and prominently displayed at the top.";
}

const RETRO_PROMPTS = [
  '"SNOOPY: FLYING ACE" arched block-letter title at top, "SCOURGE OF THE SKIES" yellow ribbon banner subtitle, Snoopy in goggles and red scarf piloting his red doghouse through clouds, biplanes and Woodstock wingmen circling around him',
  '"THE RED BARON RETURNS" arched block-letter title at top, "DOGFIGHT AT DAWN" yellow ribbon banner subtitle, Snoopy as Flying Ace shaking his fist at the sky, smoke trails and propellers swirling around him',
  '"BEAGLE SQUADRON" arched block-letter title at top, "NO MISSION TOO SMALL" yellow ribbon banner subtitle, Snoopy saluting in pilot gear, Woodstock co-pilot beside him, vintage airplane silhouettes in formation',
  '"CHAOS IN THE CLOUDS" arched block-letter title at top, "WORLDS OKAYEST ADVENTURERS" yellow ribbon banner subtitle, Snoopy with parachute and Woodstock falling through clouds, birds circling around them',
  '"DAWN PATROL" arched block-letter title at top, "EYES IN THE SKY" yellow ribbon banner subtitle, Snoopy in pilot gear scanning the horizon from the cockpit at sunrise',
  '"WINGS OF GLORY" arched block-letter title at top, "MEDAL OF HONOR" yellow ribbon banner subtitle, Snoopy in pilot uniform receiving a medal, Woodstock saluting beside him',
  '"ESCAPE FROM ENEMY LINES" arched block-letter title at top, "NO BEAGLE LEFT BEHIND" yellow ribbon banner subtitle, Snoopy and Woodstock crawling under barbed wire, searchlights overhead',
  '"MIDNIGHT MISSION" arched block-letter title at top, "STEALTH AND COURAGE" yellow ribbon banner subtitle, Snoopy in pilot gear sneaking past spotlights at night',
  '"PARACHUTE PANIC" arched block-letter title at top, "BAILOUT" yellow ribbon banner subtitle, Snoopy clutching parachute strings, Woodstock dangling beside him, tangled lines',
  '"BIPLANE BANDIT" arched block-letter title at top, "RIDER OF THE WIND" yellow ribbon banner subtitle, Snoopy doing a barrel roll on his doghouse plane, Woodstock holding on for dear life',
  '"WANTED" arched block-letter title at top, "DEAD OR ALIVE" yellow ribbon banner subtitle, Snoopy in cowboy hat and bandana, Woodstock as outlaw sidekick, desert cacti and wanted posters around them',
  '"THE GOOD THE BAD AND THE BEAGLE" arched block-letter title at top, "HIGH NOON" yellow ribbon banner subtitle, Snoopy as cowboy at a showdown, tumbleweeds and a setting sun behind him',
  '"OUTLAW BEAGLE" arched block-letter title at top, "LAST STAND" yellow ribbon banner subtitle, Snoopy with two pistols drawn, bandana over his snout, Woodstock with a tiny lasso',
  '"GUNSLINGER" arched block-letter title at top, "QUICK PAW" yellow ribbon banner subtitle, Snoopy in poncho squinting under his hat, dusty western town behind him',
  '"SHERIFF SNOOPY" arched block-letter title at top, "TOWN AINT BIG ENOUGH" yellow ribbon banner subtitle, Snoopy with a tin star badge standing in front of a saloon',
  '"MOON MISSION" arched block-letter title at top, "ONE SMALL PAW" yellow ribbon banner subtitle, Snoopy in astronaut helmet floating among planets, Woodstock in a tiny spacesuit beside him',
  '"COSMIC BEAGLE" arched block-letter title at top, "LOST IN THE STARS" yellow ribbon banner subtitle, Snoopy in retro spacesuit pointing at a comet, rockets and ringed planets surrounding him',
  '"SPACE INVADERS" arched block-letter title at top, "DEFEND THE GALAXY" yellow ribbon banner subtitle, Snoopy with a ray gun shooting at retro flying saucers, Woodstock in a bubble helmet',
  '"ROCKET RIDERS" arched block-letter title at top, "BLAST OFF" yellow ribbon banner subtitle, Snoopy and Woodstock launching in a vintage red rocket trailing flame',
  '"MARS OR BUST" arched block-letter title at top, "RED PLANET ADVENTURE" yellow ribbon banner subtitle, Snoopy planting a flag on Mars, retro rover and Woodstock astronaut behind him',
  '"SUPER SNOOPY" arched block-letter title at top, "DEFENDER OF THE DOGHOUSE" yellow ribbon banner subtitle, Snoopy in flowing red cape arms outstretched flying through clouds, comic action lines radiating outward',
  '"MASKED MARVEL" arched block-letter title at top, "BEWARE THE BEAGLE" yellow ribbon banner subtitle, Snoopy in a domino mask and cape striking a hero pose, Woodstock as sidekick at his feet',
  '"SECRET AGENT SNOOPY" arched block-letter title at top, "LICENSE TO SNIFF" yellow ribbon banner subtitle, Snoopy in trench coat and fedora holding a magnifying glass, silhouettes of suspects in shadow behind him',
  '"THE BEAGLE FILES" arched block-letter title at top, "CLASSIFIED" yellow ribbon banner subtitle, Snoopy as detective with a pipe, Woodstock in a tiny trench coat, foggy noir alley background',
  '"DRACULA BEAGLE" arched block-letter title at top, "THE BITE OF NIGHT" yellow ribbon banner subtitle, Snoopy in a black cape with vampire fangs, castle and bats in the background',
  '"CAPTAIN SNOOPY" arched block-letter title at top, "TERROR OF THE SEAS" yellow ribbon banner subtitle, Snoopy in pirate hat with eye patch holding a sword, Woodstock as parrot on his shoulder, ship and waves behind',
  '"INDIANA SNOOPY" arched block-letter title at top, "RAIDER OF THE LOST BONE" yellow ribbon banner subtitle, Snoopy in fedora and whip running from a giant boulder, ancient temple background',
  '"SNOOPY OF THE JUNGLE" arched block-letter title at top, "KING OF THE VINES" yellow ribbon banner subtitle, Snoopy swinging on a vine in a loincloth, Woodstock flying alongside, jungle leaves and parrots framing them',
  '"SLAMMIN SNOOPY" arched block-letter title at top, "HOME RUN HERO" yellow ribbon banner subtitle, Snoopy mid-baseball-swing in a vintage jersey, Woodstock as catcher, stadium lights and crowd silhouettes behind',
  '"SNOOPY ROCKS" arched block-letter title at top, "WORLD TOUR" yellow ribbon banner subtitle, Snoopy with electric guitar mid-jump, Woodstock on drums, stage lights and concert crowd silhouettes behind',
  '"JOE COOL" arched block-letter title at top, "TOO COOL FOR SCHOOL" yellow ribbon banner subtitle, Snoopy in black sunglasses leaning against a brick wall, Woodstock perched on his shoulder, retro starbursts framing him',
  '"DISCO INFERNO" arched block-letter title at top, "GET DOWN" yellow ribbon banner subtitle, Snoopy in a white suit pointing to the sky on a lit-up disco floor, Woodstock spinning a mirror ball',
  '"PARIS ADVENTURE" arched block-letter title at top, "VIVE LE BEAGLE" yellow ribbon banner subtitle, Snoopy with a beret and baguette, Eiffel Tower behind him, Woodstock balancing on a croissant',
  '"SAFARI ADVENTURE" arched block-letter title at top, "WILD AT HEART" yellow ribbon banner subtitle, Snoopy in pith helmet and binoculars, giraffes and elephants in the savanna behind',
  '"SNOOPYS BIG TOP" arched block-letter title at top, "GREATEST SHOW ON EARTH" yellow ribbon banner subtitle, Snoopy as ringmaster with top hat and red coat, Woodstock juggling beside him, circus tent background',
  '"LIGHTHOUSE KEEPER" arched block-letter title at top, "GUARDING THE COAST" yellow ribbon banner subtitle, Snoopy in a sailor cap shining a lantern from a lighthouse in a stormy night',
  '"FIREMAN BEAGLE" arched block-letter title at top, "HEROES IN RED" yellow ribbon banner subtitle, Snoopy in fireman gear holding a hose, Woodstock as dalmatian sidekick',
];

// Retro: tall narrow sizes 12x20, 16x30, 24x36
const RETRO_VARIANTS = [
  { id: 96940, w: 3546, h: 5920,  price: 9915  }, // 12x20
  { id: 96949, w: 4727, h: 8884,  price: 17164 }, // 16x30
  { id: 96957, w: 7101, h: 10656, price: 25000 }, // 24x36
];

// Disable smaller sizes for retro listings
const RETRO_DISABLED_VARIANT_IDS = [96926, 96930];

// =============================================================================
// PROMPT PICKERS
// =============================================================================

function pickPromptsForRun() {
  var oldShuffled = OLD_PROMPTS.slice().sort(function() { return Math.random() - 0.5; });
  var retroShuffled = RETRO_PROMPTS.slice().sort(function() { return Math.random() - 0.5; });
  var picks = [];
  for (var i = 0; i < 3; i++) picks.push({ style: 'old', prompt: oldShuffled[i] });
  for (var j = 0; j < 2; j++) picks.push({ style: 'retro', prompt: retroShuffled[j] });
  return picks.sort(function() { return Math.random() - 0.5; });
}

// =============================================================================
// SHARED HELPERS
// =============================================================================

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

// =============================================================================
// LISTING GENERATION (style-aware)
// =============================================================================

async function generateListing(prompt, style) {
  console.log("Generating listing content (" + style + " style)...");
  var styleDescription, titleFormat, tagsExample;
  if (style === 'retro') {
    styleDescription = "Snoopy and Woodstock retro vintage comic poster";
    titleFormat = "Snoopy Woodstock [Theme] Canvas Print Retro Comic Poster Vintage Wall Art";
    tagsExample = "Snoopy wall art, retro comic art, vintage Snoopy, Peanuts poster, comic book art, Snoopy gift, Woodstock print, vintage poster, Snoopy canvas, retro Peanuts, pulp comic art, Snoopy lover, beagle wall art";
  } else {
    styleDescription = "Snoopy and Woodstock art";
    titleFormat = "Snoopy Woodstock [Scene] Canvas Print Peanuts [Theme] Wall Decor";
    tagsExample = "Snoopy wall art, Peanuts poster, Woodstock print, Snoopy gift, Peanuts decor, cartoon art print, Snoopy canvas, kids room art, Peanuts fan gift, Snoopy lover, beagle wall art, nursery art, Peanuts artwork";
  }

  var res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=" + NB_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Based on this " + styleDescription + " description: \"" + prompt + "\"\n\nGenerate an optimized Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n  \"title\": \"Etsy optimized title under 80 chars. Format: " + titleFormat + ". NO dashes, NO hyphens, NO special characters.\",\n  \"description\": \"3 engaging paragraphs about this specific artwork, the canvas print quality, and who would love it as a gift.\",\n  \"tags\": [\"IMPORTANT: exactly 13 tags, each tag must be under 20 characters, no special characters. Examples: " + tagsExample + "\"]\n}" }] }],
        generationConfig: { responseModalities: ["TEXT"] }
      })
    }
  );
  var data = await res.json();
  var text = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  if (!text) throw new Error("Listing generation failed: " + JSON.stringify(data));
  var clean = text.replace(/```json|```/g, "").trim();
  var listing = JSON.parse(clean);

  var validTags = style === 'retro' ? [
    "Snoopy wall art", "retro comic art", "vintage Snoopy", "Peanuts poster",
    "comic book art", "Snoopy gift", "Woodstock print", "vintage poster",
    "Snoopy canvas", "retro Peanuts", "pulp comic art", "Snoopy lover",
    "beagle wall art", "Peanuts decor", "Peanuts fan gift", "comic poster art",
    "vintage wall art", "Snoopy print", "retro wall art", "Snoopy art print"
  ] : [
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

// =============================================================================
// IMAGE GENERATION (style-aware)
// =============================================================================

async function generateImage(prompt, style) {
  console.log("Generating image (" + style + " style)...");
  var fullPrompt;
  if (style === 'retro') {
    var palette = pickPalette();
    console.log("Using palette:", palette);
    fullPrompt = prompt + buildRetroStyleSuffix(palette) + " Generate as a tall vertical portrait poster artwork in 2:3 aspect ratio, taller than wide, fill the entire frame edge to edge with no white borders, no margins, suitable for canvas wall art print.";
  } else {
    fullPrompt = prompt + " Generate as a tall vertical portrait poster artwork in 2:3 aspect ratio, taller than wide. Fill the entire frame edge to edge with no white borders, no margins. Suitable for canvas wall art print. No text, no words, no letters.";
  }

  var res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=" + NB_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
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

// =============================================================================
// PRINTIFY UPLOAD + PRODUCT CREATE (style-aware)
// =============================================================================

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

async function createProduct(imageId, listing, style) {
  console.log("Creating Printify product (" + style + " style)...");
  var enabledVariants = style === 'retro' ? RETRO_VARIANTS : OLD_VARIANTS;

  var variants = enabledVariants.map(function(v) {
    return { id: v.id, is_enabled: true, price: v.price };
  });

  if (style === 'retro') {
    variants = variants.concat(RETRO_DISABLED_VARIANT_IDS.map(function(id) {
      return { id: id, is_enabled: false, price: 999 };
    }));
  }

  var print_areas = enabledVariants.map(function(v) {
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

// =============================================================================
// PUBLISH
// =============================================================================

async function enableOffsiteAdsPuppeteer(productId) {
  var PRINTIFY_BEARER = process.env.PRINTIFY_BEARER;
  if (!PRINTIFY_BEARER) { console.log("No PRINTIFY_BEARER token set, skipping offsite ads"); return; }
  try {
    var res = await fetch(
      "https://printify.com/api/v1/users/19310315/shops/" + SHOP_ID + "/products/" + productId,
      {
        method: "PUT",
        headers: { "Authorization": "Bearer " + PRINTIFY_BEARER, "Content-Type": "application/json", "Origin": "https://printify.com" },
        body: JSON.stringify({ sales_channel_properties: { etsy: { offsite_adds: 0.12 } } })
      }
    );
    console.log("Offsite ads response (status " + res.status + "):", (await res.text()).substring(0, 200));
  } catch (err) { console.log("Offsite ads error:", err.message); }
}

async function publishToEtsy(productId) {
  console.log("Waiting 45s for product images to fully process...");
  await new Promise(function(r) { setTimeout(r, 45000); });
  console.log("Publishing to Etsy...");
  var body = JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true });
  for (var attempt = 1; attempt <= 3; attempt++) {
    console.log("Publish attempt " + attempt + "...");
    var res = await fetch(
      "https://api.printify.com/v1/shops/" + SHOP_ID + "/products/" + productId + "/publish.json",
      { method: "POST", headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" }, body: body }
    );
    var statusCode = res.status;
    var text = await res.text();
    console.log("Publish response (status " + statusCode + "):", text);
    if (statusCode === 200 || statusCode === 204) { console.log("Publish succeeded!"); break; }
    if (attempt < 3) await new Promise(function(r) { setTimeout(r, 20000); });
  }
}

// =============================================================================
// MAIN RUN LOOP
// =============================================================================

async function run() {
  try { require("sharp"); } catch (e) {
    require("child_process").execSync("npm install sharp", { stdio: "inherit" });
  }

  var picks = pickPromptsForRun();
  console.log("Selected " + picks.length + " prompts: " +
    picks.filter(function(p) { return p.style === 'old'; }).length + " old-style + " +
    picks.filter(function(p) { return p.style === 'retro'; }).length + " retro comic");

  for (var i = 0; i < picks.length; i++) {
    var pick = picks[i];
    console.log("\n--- Listing " + (i + 1) + " of " + picks.length + " (" + pick.style + ") ---");
    console.log("Prompt:", pick.prompt);
    try {
      var listing = await retry(function() { return generateListing(pick.prompt, pick.style); });
      var base64Image = await retry(function() { return generateImage(pick.prompt, pick.style); });
      var imageId = await uploadToPrintify(base64Image);
      var productId = await createProduct(imageId, listing, pick.style);
      try { await enableOffsiteAdsPuppeteer(productId); } catch(e) { console.log("Offsite ads skipped:", e.message); }
      await publishToEtsy(productId);
      console.log("Listing " + (i + 1) + " complete!");
      if (i < picks.length - 1) await new Promise(function(r) { setTimeout(r, 10000); });
    } catch (err) {
      console.error("Listing " + (i + 1) + " failed:", err.message);
    }
  }
  console.log("\nDone! All " + picks.length + " listings processed.");
}

run();
