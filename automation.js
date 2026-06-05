// POD Automation Pipeline - Snoopy Canvas
// 5 listings per day, all old style clean illustrations
// Gemini → Printify → Etsy → Offsite Ads Toggle
// Run with: node automation.js
//
// Already on Etsy? Skips publish and only toggles offsite ads (Printify API: external.id).
// Unpublished canvas drafts are published first; new listings fill remaining daily slots.
//
// ─── NEW: Offsite ads control ────────────────────────────────────────────────
// After each listing publishes to Etsy, this script automatically sets the
// "Etsy off-site ads" toggle inside Printify using Playwright browser automation.
// Set OFFSITE_ADS_ENABLED=true in .env for the full pipeline default, or use:
//   npm run ads:on   /  npm run ads:off   — Etsy-published products only
//   node automation.js --ads-on  |  --ads-off
// Etsy off-site ads: use the standalone package in ./etsy-offsite-ads (npm run toggle).
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

let offsiteAdsModule = null;
function getOffsiteAdsModule() {
  if (!offsiteAdsModule) {
    try {
      offsiteAdsModule = require('./etsy-offsite-ads/src');
    } catch (e) {
      console.warn('[automation] Etsy ads toggle: use ./etsy-offsite-ads package —', e.message);
      offsiteAdsModule = false;
    }
  }
  return offsiteAdsModule;
}

const PROMPTS = [
  // SEASONAL & WEATHER
  "Snoopy and Woodstock in a spring meadow with cherry blossoms falling",
  "Snoopy and Woodstock watching summer thunderstorm from a covered porch",
  "Snoopy and Woodstock jumping in autumn leaf piles orange and red tones",
  "Snoopy and Woodstock building an igloo in a blizzard",
  "Snoopy and Woodstock under a rainbow after a spring shower",
  "Snoopy and Woodstock catching snowflakes on their tongues",
  "Snoopy and Woodstock in a field of wildflowers on a windy day",
  "Snoopy and Woodstock watching lightning over a stormy ocean",
  "Snoopy and Woodstock sitting on a fence during golden hour",
  "Snoopy and Woodstock in a foggy morning forest",
  "Snoopy and Woodstock chasing tumbleweeds in a desert",
  "Snoopy and Woodstock watching a tornado from a safe distance",
  "Snoopy and Woodstock in monsoon rain splashing in rivers",
  "Snoopy and Woodstock in a winter frost forest icy branches glowing",
  "Snoopy and Woodstock watching northern lights in snowy tundra",
  "Snoopy and Woodstock in a summer heat wave eating popsicles",
  "Snoopy and Woodstock watching a double rainbow over a valley",
  "Snoopy and Woodstock in a blizzard building a snow fort",
  "Snoopy and Woodstock watching shooting stars on a clear night",
  "Snoopy and Woodstock in a foggy autumn pumpkin patch",
  "Snoopy and Woodstock flying a kite on a breezy hilltop",
  "Snoopy and Woodstock splashing in puddles during a warm spring rain",
  "Snoopy and Woodstock watching a solar eclipse with special glasses",
  "Snoopy and Woodstock building a sandcastle as waves crash nearby",
  "Snoopy and Woodstock roasting marshmallows around a campfire in autumn",
  "Snoopy and Woodstock watching cherry blossoms fall on a Japanese bridge",
  "Snoopy and Woodstock in matching rain boots jumping in mud puddles",
  "Snoopy and Woodstock watching a thunderstorm roll in from a hilltop",
  "Snoopy and Woodstock making snow angels in a fresh snowfall",
  "Snoopy and Woodstock under a giant umbrella sharing a warm drink in the rain",
  // RETRO & VINTAGE
  "Snoopy and Woodstock in a 1950s diner retro neon signs milkshakes",
  "Snoopy and Woodstock as 1960s hippies in a psychedelic flower field",
  "Snoopy and Woodstock in a 1970s disco club with mirror balls and neon",
  "Snoopy and Woodstock in 1980s arcade pixel games glowing",
  "Snoopy and Woodstock on a vintage 1950s drive-in movie date",
  "Snoopy and Woodstock in retro space age style rocket ships stars",
  "Snoopy and Woodstock as vintage travel poster tourists",
  "Snoopy and Woodstock in a sepia-toned old west scene saloon",
  "Snoopy and Woodstock in a vintage circus poster style",
  "Snoopy and Woodstock in a 1920s art deco cityscape at night",
  "Snoopy and Woodstock at a 1960s drive-through burger stand",
  "Snoopy and Woodstock as 1940s jazz musicians in a smoky club",
  "Snoopy and Woodstock on a 1970s road trip in a VW van",
  "Snoopy and Woodstock at a 1950s sock hop dance",
  "Snoopy and Woodstock as old Hollywood movie stars on a red carpet",
  "Snoopy and Woodstock in a 1980s neon roller skating rink",
  "Snoopy and Woodstock watching a vintage black and white movie",
  "Snoopy and Woodstock at a 1960s space race launch",
  "Snoopy and Woodstock as Victorian-era explorers with maps and compasses",
  "Snoopy and Woodstock at a 1970s outdoor rock concert",
  "Snoopy and Woodstock in a 1950s convertible on a coastal highway",
  "Snoopy and Woodstock playing pinball in a vintage arcade",
  "Snoopy and Woodstock as 1920s bootleggers in a speakeasy",
  "Snoopy and Woodstock at a 1940s USO dance during wartime",
  "Snoopy and Woodstock on a vintage steam locomotive crossing mountains",
  // HOLIDAYS & CELEBRATIONS
  "Snoopy and Woodstock decorating a Christmas tree with colorful lights",
  "Snoopy and Woodstock carving jack-o-lanterns on Halloween",
  "Snoopy and Woodstock watching Fourth of July fireworks on a blanket",
  "Snoopy and Woodstock making Valentine cards with hearts and glitter",
  "Snoopy and Woodstock hunting Easter eggs in a sunny garden",
  "Snoopy and Woodstock celebrating New Years Eve with confetti",
  "Snoopy and Woodstock making a Thanksgiving feast together",
  "Snoopy and Woodstock decorating for Hanukkah with menorahs",
  "Snoopy and Woodstock at a birthday party with balloons and cake",
  "Snoopy and Woodstock trick-or-treating on Halloween night",
  "Snoopy and Woodstock in Mardi Gras parade with colorful beads",
  "Snoopy and Woodstock lighting Diwali oil lamps at dusk",
  "Snoopy and Woodstock wrapped in cozy blankets on Christmas morning",
  "Snoopy and Woodstock hanging stockings by a fireplace",
  "Snoopy and Woodstock watching a spectacular New Year countdown",
  "Snoopy and Woodstock making a giant gingerbread house",
  "Snoopy and Woodstock caroling in the snow at doorsteps",
  "Snoopy and Woodstock in St Patricks Day parade in green outfits",
  "Snoopy and Woodstock making Mothers Day breakfast in bed",
  "Snoopy and Woodstock at a Cinco de Mayo street festival",
  "Snoopy and Woodstock at a Lunar New Year parade with dragons",
  "Snoopy and Woodstock launching sky lanterns on New Years night",
  "Snoopy and Woodstock at a flower festival in spring",
  "Snoopy and Woodstock setting off sparklers at the beach at dusk",
  "Snoopy and Woodstock making a pinata at a birthday fiesta",
  // FOOD & COOKING
  "Snoopy and Woodstock baking a giant chocolate cake in a cozy kitchen",
  "Snoopy and Woodstock running an ice cream truck on a sunny street",
  "Snoopy and Woodstock making pizza from scratch throwing dough in the air",
  "Snoopy and Woodstock at a sushi restaurant using tiny chopsticks",
  "Snoopy and Woodstock picking strawberries in a farm field",
  "Snoopy and Woodstock cooking a big pot of spaghetti together",
  "Snoopy and Woodstock at a French bakery buying croissants",
  "Snoopy and Woodstock running a lemonade stand on a hot day",
  "Snoopy and Woodstock decorating sugar cookies with icing",
  "Snoopy and Woodstock at a taco street cart in Mexico",
  "Snoopy and Woodstock making fresh pasta by hand in an Italian kitchen",
  "Snoopy and Woodstock at a Japanese ramen shop slurping noodles",
  "Snoopy and Woodstock grilling burgers at a backyard BBQ",
  "Snoopy and Woodstock picking apples at an orchard",
  "Snoopy and Woodstock making homemade jam from fresh berries",
  "Snoopy and Woodstock at a farmers market buying vegetables",
  "Snoopy and Woodstock making smores over an outdoor fire pit",
  "Snoopy and Woodstock eating crepes on a Paris street corner",
  "Snoopy and Woodstock at a dim sum brunch with bamboo steamers",
  "Snoopy and Woodstock running a waffle stand at a weekend market",
  "Snoopy and Woodstock making homemade hot chocolate on a snowy night",
  "Snoopy and Woodstock at a churro cart in Spain",
  "Snoopy and Woodstock harvesting honey from a beehive in a garden",
  "Snoopy and Woodstock at a crawfish boil in Louisiana",
  "Snoopy and Woodstock making popcorn for movie night at home",
  "Snoopy and Woodstock at a clambake on a New England beach",
  "Snoopy and Woodstock pressing fresh apple cider at harvest time",
  "Snoopy and Woodstock at a Swiss fondue dinner in an alpine chalet",
  "Snoopy and Woodstock making tamales together in a Mexican kitchen",
  "Snoopy and Woodstock at a Brazilian churrascaria with skewers of meat",
  // SPORTS & ATHLETICS
  "Snoopy and Woodstock playing tennis on a clay court in the sun",
  "Snoopy and Woodstock surfing giant waves at sunrise",
  "Snoopy and Woodstock skiing down a snowy mountain slope",
  "Snoopy and Woodstock playing beach volleyball",
  "Snoopy and Woodstock racing go-karts on a colorful track",
  "Snoopy and Woodstock doing yoga poses in a peaceful garden",
  "Snoopy and Woodstock rock climbing a tall granite cliff",
  "Snoopy and Woodstock playing soccer in a stadium",
  "Snoopy and Woodstock ice skating on a frozen pond",
  "Snoopy and Woodstock kayaking through white water rapids",
  "Snoopy and Woodstock doing a marathon race with numbers on bibs",
  "Snoopy and Woodstock playing basketball doing a slam dunk",
  "Snoopy and Woodstock doing gymnastics on balance beams",
  "Snoopy and Woodstock fishing in a peaceful mountain lake",
  "Snoopy and Woodstock playing golf on a lush green course",
  "Snoopy and Woodstock doing archery in a misty forest",
  "Snoopy and Woodstock skateboarding at a colorful skate park",
  "Snoopy and Woodstock playing baseball on a sunny summer afternoon",
  "Snoopy and Woodstock doing karate in white gi uniforms",
  "Snoopy and Woodstock hang gliding over rolling green hills",
  "Snoopy and Woodstock doing a triathlon swim bike run",
  "Snoopy and Woodstock playing ping pong in a basement",
  "Snoopy and Woodstock snowboarding off a mountain jump",
  "Snoopy and Woodstock in a rowing boat race on a river",
  "Snoopy and Woodstock playing polo on horseback",
  "Snoopy and Woodstock doing synchronized swimming in a pool",
  "Snoopy and Woodstock competing in a sled dog race in Alaska",
  "Snoopy and Woodstock playing cricket on a British village green",
  "Snoopy and Woodstock doing a bouldering competition indoors",
  "Snoopy and Woodstock at a sumo wrestling match in Japan",
  // TRAVEL & ADVENTURE
  "Snoopy and Woodstock hiking through Patagonia glaciers",
  "Snoopy and Woodstock on a safari jeep in the African savanna",
  "Snoopy and Woodstock on a gondola in Venice canals",
  "Snoopy and Woodstock at the base of the Eiffel Tower Paris",
  "Snoopy and Woodstock exploring ancient ruins in Greece",
  "Snoopy and Woodstock on a bullet train in Japan countryside",
  "Snoopy and Woodstock hiking the Great Wall of China",
  "Snoopy and Woodstock on a camel in front of the pyramids of Egypt",
  "Snoopy and Woodstock watching the sun set over the Grand Canyon",
  "Snoopy and Woodstock in a hot air balloon over Tuscany Italy",
  "Snoopy and Woodstock exploring a night market in Bangkok Thailand",
  "Snoopy and Woodstock watching geysers erupt in Iceland",
  "Snoopy and Woodstock on a cruise ship in the Caribbean",
  "Snoopy and Woodstock exploring a cenote in Mexico",
  "Snoopy and Woodstock at Machu Picchu Peru in morning mist",
  "Snoopy and Woodstock on a motorcycle road trip through Route 66",
  "Snoopy and Woodstock in a rickshaw through Mumbai India",
  "Snoopy and Woodstock at the Colosseum in Rome at sunset",
  "Snoopy and Woodstock on a ferry crossing Norwegian fjords",
  "Snoopy and Woodstock exploring Angkor Wat temple in Cambodia",
  "Snoopy and Woodstock at a flamenco show in Seville Spain",
  "Snoopy and Woodstock walking across Abbey Road in London",
  "Snoopy and Woodstock on a double-decker bus in London",
  "Snoopy and Woodstock exploring Petra the rose city in Jordan",
  "Snoopy and Woodstock on a sleeper train through the Swiss Alps",
  "Snoopy and Woodstock exploring a floating market in Thailand",
  "Snoopy and Woodstock at the Taj Mahal at sunrise in India",
  "Snoopy and Woodstock on a tuk-tuk through the streets of Chiang Mai",
  "Snoopy and Woodstock watching the sunset over Santorini",
  "Snoopy and Woodstock at a night bazaar in Marrakech Morocco",
  // MUSIC & ARTS
  "Snoopy and Woodstock playing jazz guitar and trumpet on a city sidewalk",
  "Snoopy and Woodstock in a recording studio laying down tracks",
  "Snoopy and Woodstock painting a giant mural on a city wall",
  "Snoopy and Woodstock performing in a rock band on a big stage",
  "Snoopy and Woodstock at a classical orchestra Woodstock conducting",
  "Snoopy and Woodstock doing ballet on a grand stage with spotlights",
  "Snoopy and Woodstock at an outdoor music festival in summer",
  "Snoopy and Woodstock doing street breakdance in New York City",
  "Snoopy and Woodstock playing acoustic guitar around a campfire",
  "Snoopy and Woodstock sculpting clay pottery on a wheel",
  "Snoopy and Woodstock at a vinyl record store flipping through albums",
  "Snoopy and Woodstock doing tap dance in a Broadway show",
  "Snoopy and Woodstock painting watercolors by a river",
  "Snoopy and Woodstock at an art gallery opening night",
  "Snoopy and Woodstock making stained glass windows in a studio",
  "Snoopy and Woodstock in a mariachi band in Mexico",
  "Snoopy and Woodstock at a New Orleans second line parade",
  "Snoopy and Woodstock doing a piano duet in a concert hall",
  "Snoopy and Woodstock at a bluegrass jam on a porch in Appalachia",
  "Snoopy and Woodstock doing sand art on a beach at sunset",
  "Snoopy and Woodstock at a drum circle on a mountaintop",
  "Snoopy and Woodstock performing with puppets in a street show",
  "Snoopy and Woodstock at a flamenco dance studio in Seville",
  "Snoopy and Woodstock silk-screening posters in an art studio",
  "Snoopy and Woodstock at a folk music festival in Ireland",
  // SCIENCE & SPACE
  "Snoopy and Woodstock as astronauts floating in outer space",
  "Snoopy and Woodstock piloting a rocket ship to the moon",
  "Snoopy and Woodstock looking at planets through a giant telescope",
  "Snoopy and Woodstock discovering a new planet covered in crystals",
  "Snoopy and Woodstock in a submarine exploring deep ocean trenches",
  "Snoopy and Woodstock in a laboratory with colorful bubbling experiments",
  "Snoopy and Woodstock studying dinosaur fossils in a museum",
  "Snoopy and Woodstock launching weather balloons into stormy skies",
  "Snoopy and Woodstock building a robot together in a workshop",
  "Snoopy and Woodstock exploring a coral reef in scuba gear",
  "Snoopy and Woodstock planting experiments in a greenhouse",
  "Snoopy and Woodstock at a volcano observatory watching lava flows",
  "Snoopy and Woodstock chasing a meteor shower in a dark field",
  "Snoopy and Woodstock studying sea turtles on a tropical beach",
  "Snoopy and Woodstock doing a chemistry experiment with colorful smoke",
  "Snoopy and Woodstock exploring an ice cave in Antarctica",
  "Snoopy and Woodstock coding at a computer in a cool tech lab",
  "Snoopy and Woodstock discovering a hidden fossil in the desert",
  "Snoopy and Woodstock piloting a deep-sea submersible near vents",
  "Snoopy and Woodstock releasing butterflies after raising them",
  "Snoopy and Woodstock launching a model rocket in an open field",
  "Snoopy and Woodstock at an aurora borealis research station",
  "Snoopy and Woodstock growing vegetables in a space greenhouse",
  "Snoopy and Woodstock at a particle accelerator doing physics",
  "Snoopy and Woodstock at a bioluminescence lab making glowing art",
  // NATURE & ANIMALS
  "Snoopy and Woodstock in a sunflower field at golden hour",
  "Snoopy and Woodstock watching whales breach in the ocean",
  "Snoopy and Woodstock birdwatching in a tropical rainforest",
  "Snoopy and Woodstock at a butterfly garden among thousands of butterflies",
  "Snoopy and Woodstock feeding ducks by a tranquil pond",
  "Snoopy and Woodstock exploring tide pools at low tide",
  "Snoopy and Woodstock in a field of lavender in Provence France",
  "Snoopy and Woodstock camping under giant sequoia trees",
  "Snoopy and Woodstock watching elephants at a wildlife sanctuary",
  "Snoopy and Woodstock in a redwood forest on a misty trail",
  "Snoopy and Woodstock at a penguin colony in Antarctica",
  "Snoopy and Woodstock stargazing in the Atacama Desert",
  "Snoopy and Woodstock swimming with sea turtles in clear water",
  "Snoopy and Woodstock in a cherry blossom grove in Japan",
  "Snoopy and Woodstock watching a wild horse herd on open prairie",
  "Snoopy and Woodstock at a monarch butterfly migration",
  "Snoopy and Woodstock walking a mountain trail past a waterfall",
  "Snoopy and Woodstock watching baby sea turtles run to the ocean",
  "Snoopy and Woodstock at a field of tulips in the Netherlands",
  "Snoopy and Woodstock with baby ducks following them on a path",
  "Snoopy and Woodstock in a wildflower meadow at dawn",
  "Snoopy and Woodstock watching a murmuration of starlings at dusk",
  "Snoopy and Woodstock at a firefly meadow on a summer night",
  "Snoopy and Woodstock tending a beehive in a blooming orchard",
  "Snoopy and Woodstock at a hummingbird garden in spring",
  // CAREER & PROFESSIONS
  "Snoopy and Woodstock as firefighters rescuing a cat from a tree",
  "Snoopy and Woodstock as chefs in a busy five-star restaurant kitchen",
  "Snoopy and Woodstock as astronauts at NASA mission control",
  "Snoopy and Woodstock as construction workers building a skyscraper",
  "Snoopy and Woodstock as doctors in an emergency room",
  "Snoopy and Woodstock as teachers in a colorful classroom",
  "Snoopy and Woodstock as librarians organizing an enormous library",
  "Snoopy and Woodstock as pilots in a cockpit above the clouds",
  "Snoopy and Woodstock as park rangers on a mountaintop",
  "Snoopy and Woodstock as fashion designers backstage at a runway show",
  "Snoopy and Woodstock as journalists reporting live from the field",
  "Snoopy and Woodstock as archaeologists uncovering ancient treasure",
  "Snoopy and Woodstock as veterinarians caring for exotic animals",
  "Snoopy and Woodstock as lighthouse keepers in a storm",
  "Snoopy and Woodstock as florists arranging a giant bouquet",
  "Snoopy and Woodstock as sailors on a tall ship in the open sea",
  "Snoopy and Woodstock as bakers delivering fresh bread in the morning",
  "Snoopy and Woodstock as painters restoring an old cathedral",
  "Snoopy and Woodstock as radio DJs in a neon-lit broadcast booth",
  "Snoopy and Woodstock as bee farmers harvesting honey",
  "Snoopy and Woodstock as forest rangers counting wildlife at dawn",
  "Snoopy and Woodstock as oceanographers on a research vessel",
  "Snoopy and Woodstock as glassblowers making colorful sculptures",
  "Snoopy and Woodstock as cartographers mapping an uncharted island",
  "Snoopy and Woodstock as street performers juggling in a plaza",
  // HOBBIES & LEISURE
  "Snoopy and Woodstock reading books under a shady oak tree",
  "Snoopy and Woodstock doing a jigsaw puzzle by a rainy window",
  "Snoopy and Woodstock gardening and planting flowers in raised beds",
  "Snoopy and Woodstock doing origami at a crafting table",
  "Snoopy and Woodstock playing chess in a park",
  "Snoopy and Woodstock collecting seashells on a windy beach",
  "Snoopy and Woodstock doing a crossword puzzle over coffee",
  "Snoopy and Woodstock knitting matching sweaters by a fire",
  "Snoopy and Woodstock building model trains on a large table",
  "Snoopy and Woodstock writing in journals under a willow tree",
  "Snoopy and Woodstock making candles in a cozy craft room",
  "Snoopy and Woodstock doing a photo walk with vintage cameras",
  "Snoopy and Woodstock playing board games on a rainy afternoon",
  "Snoopy and Woodstock making friendship bracelets on a porch",
  "Snoopy and Woodstock birdwatching with binoculars at dawn",
  "Snoopy and Woodstock doing watercolor painting at an outdoor cafe",
  "Snoopy and Woodstock pressing flowers into a botanical journal",
  "Snoopy and Woodstock stargazing with a star chart on a hilltop",
  "Snoopy and Woodstock doing tie-dye t-shirts in a sunny backyard",
  "Snoopy and Woodstock building a birdhouse in a workshop",
  "Snoopy and Woodstock doing macrame plant hangers on a porch",
  "Snoopy and Woodstock collecting vintage postcards at a flea market",
  "Snoopy and Woodstock doing a paint-by-numbers by a window",
  "Snoopy and Woodstock making homemade paper lanterns",
  "Snoopy and Woodstock carving a wooden duck in a workshop",
  // FANTASY & IMAGINATION
  "Snoopy and Woodstock as medieval knights in shining armor",
  "Snoopy and Woodstock as wizards casting colorful spells",
  "Snoopy and Woodstock on a pirate ship searching for treasure",
  "Snoopy and Woodstock as superheroes flying over a city skyline",
  "Snoopy and Woodstock exploring an enchanted forest with glowing mushrooms",
  "Snoopy and Woodstock in a fairy tale castle at sunset",
  "Snoopy and Woodstock as time travelers in a Victorian time machine",
  "Snoopy and Woodstock underwater in a mermaid kingdom",
  "Snoopy and Woodstock in a giant library with floating books",
  "Snoopy and Woodstock flying on a magic carpet over desert dunes",
  "Snoopy and Woodstock as samurai in ancient Japan",
  "Snoopy and Woodstock as jungle explorers in a lost city",
  "Snoopy and Woodstock as ninjas on moonlit rooftops",
  "Snoopy and Woodstock in a steampunk airship over the clouds",
  "Snoopy and Woodstock in a candy land made of sweets and pastries",
  "Snoopy and Woodstock as gladiators in ancient Rome",
  "Snoopy and Woodstock as Viking explorers landing on an icy shore",
  "Snoopy and Woodstock as Egyptian pharaohs in a golden palace",
  "Snoopy and Woodstock as cowboys in a colorful wild west town",
  "Snoopy and Woodstock as astronauts exploring an alien jungle planet",
  "Snoopy and Woodstock as dragon tamers in a misty mountain kingdom",
  "Snoopy and Woodstock in a submarine made of coral and seashells",
  "Snoopy and Woodstock as fortune tellers in a mystical carnival tent",
  "Snoopy and Woodstock riding a giant friendly sea serpent in a bay",
  "Snoopy and Woodstock as tiny explorers in a giant garden",
  // CITY & URBAN LIFE
  "Snoopy and Woodstock hailing a yellow taxi in New York City rain",
  "Snoopy and Woodstock at a rooftop party overlooking a glittering skyline",
  "Snoopy and Woodstock at a busy subway station in Tokyo",
  "Snoopy and Woodstock at a street food cart in a busy city",
  "Snoopy and Woodstock in a cozy bookstore cafe on a rainy day",
  "Snoopy and Woodstock at a flea market finding vintage treasures",
  "Snoopy and Woodstock on a fire escape watching city sunsets",
  "Snoopy and Woodstock at a trendy coffee shop with latte art",
  "Snoopy and Woodstock at a flower market picking fresh bouquets",
  "Snoopy and Woodstock riding bikes through Amsterdam canals",
  "Snoopy and Woodstock at a rooftop garden growing vegetables",
  "Snoopy and Woodstock playing chess in Washington Square Park",
  "Snoopy and Woodstock at a pop-up art fair on a city street",
  "Snoopy and Woodstock on the Brooklyn Bridge at sunrise",
  "Snoopy and Woodstock at a midnight diner sharing pie",
  "Snoopy and Woodstock doing yoga in Central Park at dawn",
  "Snoopy and Woodstock at a jazz club in New Orleans",
  "Snoopy and Woodstock window shopping on a snowy city street at Christmas",
  "Snoopy and Woodstock at a night food market with colorful stalls",
  "Snoopy and Woodstock watching a street magician in a busy plaza",
  "Snoopy and Woodstock at a rooftop movie screening under the stars",
  "Snoopy and Woodstock at a Sunday farmers market in the park",
  "Snoopy and Woodstock at a community mural painting event",
  "Snoopy and Woodstock exploring a quiet alley full of street art",
  "Snoopy and Woodstock at a night parade with floats and fireworks",
  // BEACH & OCEAN
  "Snoopy and Woodstock building an elaborate sandcastle with moat",
  "Snoopy and Woodstock snorkeling in a crystal clear tropical lagoon",
  "Snoopy and Woodstock on a paddleboard watching a colorful sunset",
  "Snoopy and Woodstock finding treasure in a sea cave",
  "Snoopy and Woodstock roasting corn on a beach bonfire",
  "Snoopy and Woodstock playing in the surf at sunrise",
  "Snoopy and Woodstock on a sailboat in a turquoise bay",
  "Snoopy and Woodstock chasing crabs on a rocky beach",
  "Snoopy and Woodstock collecting colorful sea glass on shore",
  "Snoopy and Woodstock watching dolphins jump near their kayak",
  "Snoopy and Woodstock in a hammock between two palm trees",
  "Snoopy and Woodstock eating fish and chips on a British pier",
  "Snoopy and Woodstock watching a bioluminescent bay glow at night",
  "Snoopy and Woodstock on a glass-bottom boat over a coral reef",
  "Snoopy and Woodstock doing deep sea diving near a shipwreck",
  "Snoopy and Woodstock surfing at sunset with golden waves",
  "Snoopy and Woodstock in tide pools discovering starfish and anemones",
  "Snoopy and Woodstock parasailing over a turquoise sea",
  "Snoopy and Woodstock at a beach volleyball tournament",
  "Snoopy and Woodstock watching pelicans dive for fish at the pier",
  // COZY & HOME
  "Snoopy and Woodstock in a cozy cabin during a snowstorm",
  "Snoopy and Woodstock doing a puzzle by a roaring fireplace",
  "Snoopy and Woodstock baking cookies filling the house with warmth",
  "Snoopy and Woodstock napping in a hammock in a backyard garden",
  "Snoopy and Woodstock in matching pajamas on Christmas Eve",
  "Snoopy and Woodstock making hot soup on a cold rainy day",
  "Snoopy and Woodstock under a pile of autumn leaves napping",
  "Snoopy and Woodstock tending a window box of flowers in spring",
  "Snoopy and Woodstock wrapped in a quilt reading on a porch swing",
  "Snoopy and Woodstock watching rain from inside a warm kitchen",
  "Snoopy and Woodstock eating breakfast on a sunny back porch",
  "Snoopy and Woodstock tending a raised vegetable garden together",
  "Snoopy and Woodstock making a blanket fort indoors",
  "Snoopy and Woodstock planting bulbs in the garden for spring",
  "Snoopy and Woodstock watching fireflies from a porch on a summer night",
  "Snoopy and Woodstock making homemade granola on a Sunday morning",
  "Snoopy and Woodstock raking leaves together in the autumn yard",
  "Snoopy and Woodstock having a picnic in the backyard on a sunny day",
  "Snoopy and Woodstock stringing lights on the front porch for summer",
  "Snoopy and Woodstock making homemade lemonade from scratch",
  // AMERICAN SCENES
  "Snoopy and Woodstock at a county fair riding the Ferris wheel",
  "Snoopy and Woodstock at a drive-in movie with popcorn",
  "Snoopy and Woodstock at a diner on Route 66 at dawn",
  "Snoopy and Woodstock fishing off a wooden dock on a lake",
  "Snoopy and Woodstock at a small-town parade on Main Street",
  "Snoopy and Woodstock at a state fair eating deep-fried food",
  "Snoopy and Woodstock apple picking in a New England orchard",
  "Snoopy and Woodstock hiking in the Great Smoky Mountains at dawn",
  "Snoopy and Woodstock at a Nashville honky-tonk bar with live music",
  "Snoopy and Woodstock at a rodeo in Texas with lassos and horses",
  "Snoopy and Woodstock whale watching off Cape Cod",
  "Snoopy and Woodstock on a raft floating down the Mississippi River",
  "Snoopy and Woodstock hiking in Yellowstone near hot springs",
  "Snoopy and Woodstock at a California vineyard at harvest time",
  "Snoopy and Woodstock surfing in Hawaii with volcanic mountains behind them",
  "Snoopy and Woodstock at a lobster shack in Maine",
  "Snoopy and Woodstock at a blueberry farm in Michigan",
  "Snoopy and Woodstock at a Chicago hot dog stand",
  "Snoopy and Woodstock at a New Mexico chili cook-off",
  "Snoopy and Woodstock watching a hot rod car show on a summer evening",
];

const VERTICAL_VARIANTS = [
  { id: 96926, w: 2365, h: 2955, price: 5038  }, // 8x10
  { id: 96930, w: 2955, h: 3546, price: 6669  }, // 10x12
  { id: 96944, w: 4727, h: 5920, price: 9915  }, // 16x20
  { id: 96946, w: 5920, h: 7101, price: 12095 }, // 20x24
  { id: 96956, w: 7101, h: 8884, price: 17164 }, // 24x30
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
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=" + NB_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Based on this Snoopy and Woodstock art description: \"" + prompt + "\"\n\nGenerate an optimized Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n  \"title\": \"Etsy optimized title under 80 chars. Format: Snoopy Woodstock [Scene] Canvas Print Peanuts [Theme] Wall Decor. NO dashes, NO hyphens, NO special characters.\",\n  \"description\": \"3 engaging paragraphs about this specific artwork scene, the canvas print quality, and who would love it as a gift.\",\n  \"tags\": [\"IMPORTANT: exactly 13 tags, each tag must be under 20 characters, no special characters, focused on Snoopy Peanuts and the specific scene. Examples: Snoopy wall art, Peanuts poster, Woodstock print, Snoopy gift, Peanuts decor, cartoon art print, Snoopy canvas, kids room art, Peanuts fan gift, Snoopy lover, beagle wall art, nursery art, Peanuts artwork\"]\n}" }] }],
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
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=" + NB_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt + " Generate as a tall vertical portrait poster artwork in 2:3 aspect ratio, taller than wide. Fill the entire frame edge to edge with no white borders, no margins, no shadows, no drop shadows, no perspective distortion, completely flat design. Suitable for canvas wall art print. No text, no words, no letters." }] }],
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

  console.log("Waiting 45s for product images to fully process...");
  await new Promise(function(r) { setTimeout(r, 45000); });
  console.log("Publishing to Etsy...");
  var body = JSON.stringify({
    title: true, description: true, images: true, variants: true,
    tags: true, keyFeatures: true, shipping_template: true
  });
  for (var attempt = 1; attempt <= 3; attempt++) {
    console.log("Publish attempt " + attempt + "...");
    var res = await fetch(
      "https://api.printify.com/v1/shops/" + SHOP_ID + "/products/" + productId + "/publish.json",
      { method: "POST", headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" }, body: body }
    );
    var statusCode = res.status;
    var text = await res.text();
    console.log("Publish response (status " + statusCode + "):", text);
    if (statusCode === 200 || statusCode === 204) { console.log("Publish succeeded!"); return true; }
    if (attempt < 3) await new Promise(function(r) { setTimeout(r, 20000); });
  }
  return false;
}

async function toggleOffsiteAds(productId, options) {
  options = options || {};
  const mod = getOffsiteAdsModule();
  if (!mod) {
    console.warn('[automation] Skipping offsite ads toggle (module not available)');
    return;
  }

  var enable = options.enable !== undefined ? options.enable : OFFSITE_ADS_ENABLED;
  const action = enable ? 'Enabling' : 'Disabling';
  console.log(`\n[automation] ${action} Etsy offsite ads for product ${productId}...`);

  try {
    if (!options.skipPublishWait) {
      await new Promise(r => setTimeout(r, 10000));
    }
    const result = await mod.setOffsiteAds(productId, enable, { retries: 3 });
    if (result.changed) {
      console.log(`[automation] ✓ Offsite ads ${result.newState ? 'ENABLED' : 'DISABLED'} for product ${productId}`);
    } else {
      console.log(`[automation] ✓ Offsite ads already ${result.newState ? 'ENABLED' : 'DISABLED'} for product ${productId} — no change needed`);
    }
  } catch (err) {
    console.error(`[automation] ✗ Offsite ads toggle failed for ${productId}: ${err.message}`);
    console.error('[automation]   The listing was published successfully. Toggle it manually in Printify.');
  }
}

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
    console.log('  Already on Etsy (' + (i + 1) + '/' + onEtsy.length + ')');
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
    console.log('  Unpublished draft (' + (i + 1) + '/' + toProcess.length + ')');
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

async function runAdsOnly(enable) {
  require('./config').validateForPlaywright();

  console.log('\n═══════════════════════════════════════');
  console.log('  Ads-only mode — Etsy-published canvas products');
  console.log('  Target: ads ' + (enable ? 'ON' : 'OFF'));
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
  if (newSlots > 0) {
    var prompts = pickPrompts().slice(0, newSlots);
    console.log('\nCreating ' + prompts.length + ' new listing(s) from prompts\n');

    for (var i = 0; i < prompts.length; i++) {
      var prompt = prompts[i];
      console.log('\n═══════════════════════════════════════');
      console.log('  New listing ' + (i + 1) + ' of ' + prompts.length);
      console.log('═══════════════════════════════════════');
      console.log('Prompt:', prompt);
      try {
        var listing   = await retry(function() { return generateListing(prompt); });
        var base64Img = await retry(function() { return generateImage(prompt); });
        var imageId   = await uploadToPrintify(base64Img);
        var productId = await createProduct(imageId, listing);

        var didPublish = await publishToEtsy(productId);
        if (didPublish) {
          console.log('✓ Listing live on Etsy! Product ID:', productId);
        }
        createdNew.push(productId);
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
  console.log('  Done!');
  console.log('═══════════════════════════════════════');
  console.log('  On Etsy (ads only)     : ' + existing.toggledOnly.length);
  console.log('  Drafts published       : ' + publishedFromDrafts.length);
  console.log('  New listings created   : ' + createdNew.length);
  if (existing.toggledOnly.length) {
    console.log('  Ads toggled (existing) : ' + existing.toggledOnly.join(', '));
  }
  if (publishedFromDrafts.length) {
    console.log('  Published from drafts  : ' + publishedFromDrafts.join(', '));
  }
  if (createdNew.length) {
    console.log('  New product IDs        : ' + createdNew.join(', '));
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
