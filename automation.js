// POD Automation Pipeline - Snoopy Canvas
// 5 listings per day
// Gemini → Printify → Etsy → Offsite Ads Toggle
// Run with: node automation.js
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
        try { offsiteAdsModule = require('./etsy-offsite-ads/src'); }
        catch (e) { offsiteAdsModule = false; }
    }
    return offsiteAdsModule;
}

const PROMPTS = [
  // ── 200 CARTOON Snoopy and Woodstock with REALISTIC BACKGROUNDS ──
  "Cartoon Snoopy and Woodstock surfing a giant wave, cartoon characters with hyper-realistic crashing ocean realistic background",
  "Cartoon Snoopy and Woodstock hiking a mountain trail, cartoon characters with hyper-realistic alpine meadow realistic background",
  "Cartoon Snoopy and Woodstock camping under the stars, cartoon characters with hyper-realistic Milky Way wilderness realistic background",
  "Cartoon Snoopy and Woodstock kayaking through a sea cave, cartoon characters with hyper-realistic turquoise water realistic background",
  "Cartoon Snoopy and Woodstock fishing at sunrise, cartoon characters with hyper-realistic misty river and pine forest realistic background",
  "Cartoon Snoopy and Woodstock skiing powder snow, cartoon characters with hyper-realistic snow-dusted mountain realistic background",
  "Cartoon Snoopy and Woodstock in a hot air balloon, cartoon characters with hyper-realistic Cappadocia fairy chimneys realistic background",
  "Cartoon Snoopy and Woodstock on a gondola in Venice, cartoon characters with hyper-realistic golden canal at sunset realistic background",
  "Cartoon Snoopy and Woodstock at a Japanese cherry blossom picnic, cartoon characters with hyper-realistic pink petals realistic background",
  "Cartoon Snoopy and Woodstock cycling through Dutch tulip fields, cartoon characters with hyper-realistic colorful flower rows realistic background",
  "Cartoon Snoopy and Woodstock roasting marshmallows at a campfire, cartoon characters with hyper-realistic starry night forest realistic background",
  "Cartoon Snoopy and Woodstock sailing a tall ship, cartoon characters with hyper-realistic open ocean swells realistic background",
  "Cartoon Snoopy and Woodstock stargazing in the desert, cartoon characters with hyper-realistic Milky Way sky realistic background",
  "Cartoon Snoopy and Woodstock paragliding over Swiss Alps, cartoon characters with hyper-realistic green valley realistic background",
  "Cartoon Snoopy and Woodstock snorkeling in a coral reef, cartoon characters with hyper-realistic tropical fish and crystal water realistic background",
  "Cartoon Snoopy and Woodstock on a steam train through mountains, cartoon characters with hyper-realistic rocky canyon realistic background",
  "Cartoon Snoopy and Woodstock picking wildflowers in an alpine meadow, cartoon characters with hyper-realistic Swiss mountain realistic background",
  "Cartoon Snoopy and Woodstock dog sledding across the Arctic, cartoon characters with hyper-realistic ice and aurora realistic background",
  "Cartoon Snoopy and Woodstock building sandcastles at sunrise, cartoon characters with hyper-realistic golden beach realistic background",
  "Cartoon Snoopy and Woodstock rowing on a misty dawn lake, cartoon characters with hyper-realistic forest reflection realistic background",
  "Cartoon Snoopy and Woodstock skydiving above countryside, cartoon characters with hyper-realistic patchwork aerial view realistic background",
  "Cartoon Snoopy and Woodstock at a Hawaiian luau on the beach, cartoon characters with hyper-realistic tropical palms sunset realistic background",
  "Cartoon Snoopy and Woodstock birdwatching in a rainforest, cartoon characters with hyper-realistic exotic jungle realistic background",
  "Cartoon Snoopy and Woodstock making pasta in a rustic kitchen, cartoon characters with hyper-realistic Italian farmhouse realistic background",
  "Cartoon Snoopy and Woodstock at a Paris street cafe, cartoon characters with hyper-realistic Eiffel Tower morning realistic background",
  "Cartoon Snoopy and Woodstock stand-up paddleboarding, cartoon characters with hyper-realistic mountain lake reflection realistic background",
  "Cartoon Snoopy and Woodstock rock climbing a sea cliff, cartoon characters with hyper-realistic ocean waves below realistic background",
  "Cartoon Snoopy and Woodstock at a Provence lavender farm, cartoon characters with hyper-realistic purple fields realistic background",
  "Cartoon Snoopy and Woodstock ice skating on an alpine lake, cartoon characters with hyper-realistic snowy mountain realistic background",
  "Cartoon Snoopy and Woodstock reading under a cherry blossom tree, cartoon characters with hyper-realistic Japan spring realistic background",
  "Cartoon Snoopy and Woodstock zip-lining through a rainforest, cartoon characters with hyper-realistic jungle canopy realistic background",
  "Cartoon Snoopy and Woodstock making a snowman in a blizzard, cartoon characters with hyper-realistic New England street realistic background",
  "Cartoon Snoopy and Woodstock fly fishing in a Montana stream, cartoon characters with hyper-realistic crystal mountain water realistic background",
  "Cartoon Snoopy and Woodstock at a Greek island cafe, cartoon characters with hyper-realistic blue Aegean sea realistic background",
  "Cartoon Snoopy and Woodstock snowshoeing in a pine forest, cartoon characters with hyper-realistic winter blue light realistic background",
  "Cartoon Snoopy and Woodstock watching a Kenyan wildlife migration, cartoon characters with hyper-realistic dusty savanna realistic background",
  "Cartoon Snoopy and Woodstock at a Norwegian fjord, cartoon characters with hyper-realistic mirror water and cliff realistic background",
  "Cartoon Snoopy and Woodstock at a Vermont maple sugar shack, cartoon characters with hyper-realistic steam and winter forest realistic background",
  "Cartoon Snoopy and Woodstock on a camel trek in the Sahara, cartoon characters with hyper-realistic golden sand dunes realistic background",
  "Cartoon Snoopy and Woodstock at a Bali sunrise rice terrace, cartoon characters with hyper-realistic misty green layers realistic background",
  "Cartoon Snoopy and Woodstock on a Maldives overwater bungalow, cartoon characters with hyper-realistic turquoise lagoon realistic background",
  "Cartoon Snoopy and Woodstock whale watching from a boat, cartoon characters with hyper-realistic breaching humpback ocean realistic background",
  "Cartoon Snoopy and Woodstock at a Vietnamese floating market, cartoon characters with hyper-realistic river morning mist realistic background",
  "Cartoon Snoopy and Woodstock at a Korean cherry blossom festival, cartoon characters with hyper-realistic pink boulevard realistic background",
  "Cartoon Snoopy and Woodstock making coffee at a mountain hut, cartoon characters with hyper-realistic snowy alpine view realistic background",
  "Cartoon Snoopy and Woodstock photographing wildlife on safari, cartoon characters with hyper-realistic savanna dawn realistic background",
  "Cartoon Snoopy and Woodstock planting a garden in spring, cartoon characters with hyper-realistic cottage bloom realistic background",
  "Cartoon Snoopy and Woodstock riding bikes through autumn leaves, cartoon characters with hyper-realistic golden forest realistic background",
  "Cartoon Snoopy and Woodstock at a Scottish highland, cartoon characters with hyper-realistic heather and mist realistic background",
  "Cartoon Snoopy and Woodstock watching a lightning storm from a porch, cartoon characters with hyper-realistic dramatic sky realistic background",
  "Cartoon Snoopy and Woodstock releasing sky lanterns at a Thai festival, cartoon characters with hyper-realistic glowing night realistic background",
  "Cartoon Snoopy and Woodstock at a Kyoto tea ceremony garden, cartoon characters with hyper-realistic moss and stone realistic background",
  "Cartoon Snoopy and Woodstock canoeing in northern wilderness, cartoon characters with hyper-realistic calm lake and pine realistic background",
  "Cartoon Snoopy and Woodstock at a beach bonfire at night, cartoon characters with hyper-realistic glowing embers and dark waves realistic background",
  "Cartoon Snoopy and Woodstock playing in a pumpkin patch, cartoon characters with hyper-realistic autumn farm realistic background",
  "Cartoon Snoopy and Woodstock at a lavender harvest in France, cartoon characters with hyper-realistic purple rows and stone farmhouse realistic background",
  "Cartoon Snoopy and Woodstock feeding ducks by a cobblestone bridge, cartoon characters with hyper-realistic Dutch canal realistic background",
  "Cartoon Snoopy and Woodstock at a Colorado mountain lake at dawn, cartoon characters with hyper-realistic mirror reflection realistic background",
  "Cartoon Snoopy and Woodstock picking apples in an orchard, cartoon characters with hyper-realistic autumn harvest realistic background",
  "Cartoon Snoopy and Woodstock at a Santorini sunset, cartoon characters with hyper-realistic white dome and deep blue sea realistic background",
  "Cartoon Snoopy and Woodstock exploring tidal pools, cartoon characters with hyper-realistic rocky Pacific coast realistic background",
  "Cartoon Snoopy and Woodstock yoga on a mountain ledge, cartoon characters with hyper-realistic misty valley below realistic background",
  "Cartoon Snoopy and Woodstock playing frisbee on a summer beach, cartoon characters with hyper-realistic golden sand and surf realistic background",
  "Cartoon Snoopy and Woodstock at a Japanese bamboo forest, cartoon characters with hyper-realistic tall green stalks and light realistic background",
  "Cartoon Snoopy and Woodstock cooking over a campfire in the woods, cartoon characters with hyper-realistic firelit dark forest realistic background",
  "Cartoon Snoopy and Woodstock watching a hot air balloon festival, cartoon characters with hyper-realistic colorful balloons and field realistic background",
  "Cartoon Snoopy and Woodstock at a summer music festival, cartoon characters with hyper-realistic stage lights and crowd realistic background",
  "Cartoon Snoopy and Woodstock paddling in a sea kayak at dusk, cartoon characters with hyper-realistic orange horizon realistic background",
  "Cartoon Snoopy and Woodstock at a New Zealand sheep farm, cartoon characters with hyper-realistic green rolling hills realistic background",
  "Cartoon Snoopy and Woodstock making s'mores under a redwood tree, cartoon characters with hyper-realistic giant forest realistic background",
  "Cartoon Snoopy and Woodstock at a Paris bookstall by the Seine, cartoon characters with hyper-realistic river and cathedral realistic background",
  "Cartoon Snoopy and Woodstock sledding down a snowy hill, cartoon characters with hyper-realistic winter suburban street realistic background",
  "Cartoon Snoopy and Woodstock at a night market in Bangkok, cartoon characters with hyper-realistic neon and steam realistic background",
  "Cartoon Snoopy and Woodstock at a vineyard harvest in Tuscany, cartoon characters with hyper-realistic golden hill vineyard realistic background",
  "Cartoon Snoopy and Woodstock paddleboarding at golden hour, cartoon characters with hyper-realistic burning sky and calm water realistic background",
  "Cartoon Snoopy and Woodstock bird watching at a wetland, cartoon characters with hyper-realistic misty marsh at dawn realistic background",
  "Cartoon Snoopy and Woodstock feeding reindeer in Lapland, cartoon characters with hyper-realistic snowy birch forest realistic background",
  "Cartoon Snoopy and Woodstock on a cliff watching waves crash, cartoon characters with hyper-realistic dramatic sea spray realistic background",
  "Cartoon Snoopy and Woodstock at an Irish country pub exterior, cartoon characters with hyper-realistic green countryside realistic background",
  "Cartoon Snoopy and Woodstock playing guitar by a campfire, cartoon characters with hyper-realistic pine mountain night realistic background",
  "Cartoon Snoopy and Woodstock at the Grand Canyon at sunrise, cartoon characters with hyper-realistic layered canyon realistic background",
  "Cartoon Snoopy and Woodstock at a Mexican Day of the Dead market, cartoon characters with hyper-realistic marigold and candle realistic background",
  "Cartoon Snoopy and Woodstock surfing at sunset in Hawaii, cartoon characters with hyper-realistic volcanic coastline realistic background",
  "Cartoon Snoopy and Woodstock at a cherry orchard in bloom, cartoon characters with hyper-realistic pink orchard rows realistic background",
  "Cartoon Snoopy and Woodstock tubing down a forest river, cartoon characters with hyper-realistic summer green water realistic background",
  "Cartoon Snoopy and Woodstock at a lighthouse during a storm, cartoon characters with hyper-realistic dramatic churning sea realistic background",
  "Cartoon Snoopy and Woodstock making a snowboard trick in a halfpipe, cartoon characters with hyper-realistic snowy mountain park realistic background",
  "Cartoon Snoopy and Woodstock at a lakeside hammock in summer, cartoon characters with hyper-realistic sparkling water through trees realistic background",
  "Cartoon Snoopy and Woodstock foraging mushrooms in a misty forest, cartoon characters with hyper-realistic Pacific Northwest realistic background",
  "Cartoon Snoopy and Woodstock at a Scottish loch at fog time, cartoon characters with hyper-realistic brooding water and hills realistic background",
  "Cartoon Snoopy and Woodstock picking blueberries in summer, cartoon characters with hyper-realistic green wild meadow realistic background",
  "Cartoon Snoopy and Woodstock at a firefly meadow at dusk, cartoon characters with hyper-realistic glowing summer field realistic background",
  "Cartoon Snoopy and Woodstock river rafting through a canyon, cartoon characters with hyper-realistic rushing rapids and red walls realistic background",
  "Cartoon Snoopy and Woodstock making maple syrup in the snow, cartoon characters with hyper-realistic New England birch forest realistic background",
  "Cartoon Snoopy and Woodstock at a Peruvian salt pond terrace, cartoon characters with hyper-realistic Andes mountain realistic background",
  "Cartoon Snoopy and Woodstock watching a solar eclipse on a hill, cartoon characters with hyper-realistic corona and dark sky realistic background",
  "Cartoon Snoopy and Woodstock at a moose encounter in the forest, cartoon characters with hyper-realistic Canadian wilderness realistic background",
  "Cartoon Snoopy and Woodstock at a Japanese autumn maple temple, cartoon characters with hyper-realistic red and gold leaves realistic background",
  "Cartoon Snoopy and Woodstock stargazing from a desert rock, cartoon characters with hyper-realistic red rock and galaxy realistic background",
  "Cartoon Snoopy and Woodstock at a Croatian island harbor, cartoon characters with hyper-realistic terracotta roofs and turquoise sea realistic background",
  "Cartoon Snoopy and Woodstock at a spring tulip festival in Holland, cartoon characters with hyper-realistic windmill and vivid field realistic background",
  "Cartoon Snoopy and Woodstock at a winter farmers market, cartoon characters with hyper-realistic lantern-lit snow market realistic background",
  "Cartoon Snoopy and Woodstock sledding on a clear winter night, cartoon characters with hyper-realistic deep starry sky realistic background",
  "Cartoon Snoopy and Woodstock at a summer reading spot in the park, cartoon characters with hyper-realistic dappled sunlight realistic background",
  "Cartoon Snoopy and Woodstock at a Moroccan desert camp at night, cartoon characters with hyper-realistic bonfire and dunes realistic background",
  "Cartoon Snoopy and Woodstock at a Florida Keys sunset sailboat, cartoon characters with hyper-realistic pastel sky and mangroves realistic background",
  "Cartoon Snoopy and Woodstock at a forest waterfall plunge pool, cartoon characters with hyper-realistic fern gully realistic background",
  "Cartoon Snoopy and Woodstock at an Iceland hot spring at night, cartoon characters with hyper-realistic aurora and steam realistic background",
  "Cartoon Snoopy and Woodstock at a lake house dock at dawn, cartoon characters with hyper-realistic mist and loon call realistic background",
  "Cartoon Snoopy and Woodstock making a sand sculpture on the beach, cartoon characters with hyper-realistic teal ocean realistic background",
  "Cartoon Snoopy and Woodstock on a cliff in the Faroe Islands, cartoon characters with hyper-realistic dramatic fog and ocean realistic background",
  "Cartoon Snoopy and Woodstock at a Patagonia glacier lake, cartoon characters with hyper-realistic ice blue water realistic background",
  "Cartoon Snoopy and Woodstock on a kayak in a mangrove forest, cartoon characters with hyper-realistic green tunnel of roots realistic background",
  "Cartoon Snoopy and Woodstock at a midnight sun in Norway, cartoon characters with hyper-realistic golden Arctic sea realistic background",
  "Cartoon Snoopy and Woodstock flying a kite on a windswept beach, cartoon characters with hyper-realistic blue sky and dunes realistic background",
  "Cartoon Snoopy and Woodstock at a cherry blossom storm in the wind, cartoon characters with hyper-realistic pink blizzard park realistic background",
  "Cartoon Snoopy and Woodstock at an Alaskan glacier hike, cartoon characters with hyper-realistic crevasse blue ice realistic background",
  "Cartoon Snoopy and Woodstock at a bison field in Yellowstone, cartoon characters with hyper-realistic steam geothermal realistic background",
  "Cartoon Snoopy and Woodstock at a summer thunderstorm shelter, cartoon characters with hyper-realistic dramatic clouds and lightning realistic background",
  "Cartoon Snoopy and Woodstock on a coastal bike trail at sunrise, cartoon characters with hyper-realistic ocean cliffs and mist realistic background",
  "Cartoon Snoopy and Woodstock at a Portuguese fishing village, cartoon characters with hyper-realistic cobalt tiles and harbor realistic background",
  "Cartoon Snoopy and Woodstock at a wildfire lookout tower, cartoon characters with hyper-realistic endless forest canopy realistic background",
  "Cartoon Snoopy and Woodstock at a river delta at sunset, cartoon characters with hyper-realistic braided water and sky fire realistic background",
  "Cartoon Snoopy and Woodstock on a raft through a cave system, cartoon characters with hyper-realistic glowing stalactite realistic background",
  "Cartoon Snoopy and Woodstock at a bamboo forest in Kyoto, cartoon characters with hyper-realistic filtered light on green stems realistic background",
  "Cartoon Snoopy and Woodstock at a midnight beach bonfire, cartoon characters with hyper-realistic sparks and dark surf realistic background",
  "Cartoon Snoopy and Woodstock at a canyon arch hike at sunrise, cartoon characters with hyper-realistic red rock golden glow realistic background",
  "Cartoon Snoopy and Woodstock at a mountain wildflower bloom, cartoon characters with hyper-realistic carpet of color and peaks realistic background",
  "Cartoon Snoopy and Woodstock at a frozen waterfall ice climb, cartoon characters with hyper-realistic blue ice curtain realistic background",
  "Cartoon Snoopy and Woodstock at a cypress-lined road in Tuscany, cartoon characters with hyper-realistic warm evening light realistic background",
  "Cartoon Snoopy and Woodstock at a redwood forest cathedral, cartoon characters with hyper-realistic towering ancient trees realistic background",
  "Cartoon Snoopy and Woodstock at a Mongolian steppe on horseback, cartoon characters with hyper-realistic endless grassland and sky realistic background",
  "Cartoon Snoopy and Woodstock at a beach hammock under palm trees, cartoon characters with hyper-realistic Caribbean turquoise water realistic background",
  "Cartoon Snoopy and Woodstock at a French open-air market, cartoon characters with hyper-realistic summer village square realistic background",
  "Cartoon Snoopy and Woodstock at an autumn vineyard path, cartoon characters with hyper-realistic orange leaf canopy and vines realistic background",
  "Cartoon Snoopy and Woodstock at a Lake Tahoe ski slope, cartoon characters with hyper-realistic crystal mountain air and pine realistic background",
  "Cartoon Snoopy and Woodstock at a tide pool in Big Sur, cartoon characters with hyper-realistic dramatic California coast realistic background",
  "Cartoon Snoopy and Woodstock at a fall maple forest path, cartoon characters with hyper-realistic carpet of red and gold realistic background",
  "Cartoon Snoopy and Woodstock at a spring blossom path, cartoon characters with hyper-realistic dreamy soft focus petals realistic background",
  "Cartoon Snoopy and Woodstock on a rocky headland watching whales, cartoon characters with hyper-realistic Pacific fog realistic background",
  "Cartoon Snoopy and Woodstock at a summer lake rope swing, cartoon characters with hyper-realistic emerald water and sun dapple realistic background",
  "Cartoon Snoopy and Woodstock at a Himalayan base camp, cartoon characters with hyper-realistic prayer flags and snowy peak realistic background",
  "Cartoon Snoopy and Woodstock at a moonlit desert dune, cartoon characters with hyper-realistic star field and silver sand realistic background",
  "Cartoon Snoopy and Woodstock at a lake house in fall, cartoon characters with hyper-realistic orange reflection on glass water realistic background",
  "Cartoon Snoopy and Woodstock at a sea stack coast in Oregon, cartoon characters with hyper-realistic wild crashing surf realistic background",
  "Cartoon Snoopy and Woodstock at a Spanish olive grove at harvest, cartoon characters with hyper-realistic silver-leafed orchard realistic background",
  "Cartoon Snoopy and Woodstock at a Swedish meadow midsummer, cartoon characters with hyper-realistic wildflower field and birch realistic background",
  "Cartoon Snoopy and Woodstock at a Cape Cod lighthouse path, cartoon characters with hyper-realistic sea grass and ocean realistic background",
  "Cartoon Snoopy and Woodstock at a rainforest canopy walkway, cartoon characters with hyper-realistic emerald aerial jungle realistic background",
  "Cartoon Snoopy and Woodstock at a volcanic black sand beach, cartoon characters with hyper-realistic dramatic Iceland waves realistic background",
  "Cartoon Snoopy and Woodstock at a cherry blossom lantern festival, cartoon characters with hyper-realistic glowing night park realistic background",
  "Cartoon Snoopy and Woodstock on a riverboat through Amazon, cartoon characters with hyper-realistic dense jungle river realistic background",
  "Cartoon Snoopy and Woodstock at a winter birch forest on skis, cartoon characters with hyper-realistic white and gold forest realistic background",
  "Cartoon Snoopy and Woodstock at a summer cliffside pool, cartoon characters with hyper-realistic sparkling blue Mediterranean realistic background",
  "Cartoon Snoopy and Woodstock at a lake canoe at peak fall foliage, cartoon characters with hyper-realistic blazing color reflection realistic background",
  "Cartoon Snoopy and Woodstock at a desert Joshua tree sunrise, cartoon characters with hyper-realistic pink and purple dawn sky realistic background",
  "Cartoon Snoopy and Woodstock at a Great Barrier Reef dive, cartoon characters with hyper-realistic coral garden and light rays realistic background",
  "Cartoon Snoopy and Woodstock at a blue lagoon in Iceland, cartoon characters with hyper-realistic milky turquoise water and snow realistic background",
  "Cartoon Snoopy and Woodstock at a summer hammock between palms, cartoon characters with hyper-realistic golden beach and surf realistic background",
  "Cartoon Snoopy and Woodstock at a field of sunflowers at sunrise, cartoon characters with hyper-realistic golden light and blue sky realistic background",
  "Cartoon Snoopy and Woodstock at a rocky alpine stream crossing, cartoon characters with hyper-realistic crystal cold water realistic background",
  "Cartoon Snoopy and Woodstock at a night sky camping in Patagonia, cartoon characters with hyper-realistic jagged peaks and Milky Way realistic background",
  "Cartoon Snoopy and Woodstock at a seaside cliff walk in Cornwall, cartoon characters with hyper-realistic green headland and Atlantic realistic background",
  "Cartoon Snoopy and Woodstock at a mesa sunset in Arizona, cartoon characters with hyper-realistic deep red and purple sky realistic background",
  "Cartoon Snoopy and Woodstock at a wisteria tunnel in Japan, cartoon characters with hyper-realistic cascading purple bloom realistic background",
  "Cartoon Snoopy and Woodstock at a tropical waterfall swim, cartoon characters with hyper-realistic lush green jungle pool realistic background",
  "Cartoon Snoopy and Woodstock at a sunset on the Salt Flats, cartoon characters with hyper-realistic mirror reflection on white realistic background",
  "Cartoon Snoopy and Woodstock at a windswept Irish cliff, cartoon characters with hyper-realistic wild Atlantic and green grass realistic background",
  "Cartoon Snoopy and Woodstock at a Colorado aspen grove in fall, cartoon characters with hyper-realistic shaking gold leaves realistic background",
  "Cartoon Snoopy and Woodstock at a South African fynbos mountain, cartoon characters with hyper-realistic pink and orange protea realistic background",
  "Cartoon Snoopy and Woodstock at a Pacific coast fog morning, cartoon characters with hyper-realistic soft grey mist and redwoods realistic background",

"Cartoon Snoopy and Woodstock at a Tuscan hilltop village, cartoon characters with hyper-realistic stone streets and golden hour realistic background",
"Cartoon Snoopy and Woodstock at a tidal marsh at sunrise, cartoon characters with hyper-realistic pink sky and reeds realistic background",
"Cartoon Snoopy and Woodstock at a Swiss village in winter, cartoon characters with hyper-realistic snow-covered chalets realistic background",
"Cartoon Snoopy and Woodstock at a Japanese koi pond, cartoon characters with hyper-realistic mossy stones and clear water realistic background",
"Cartoon Snoopy and Woodstock at a Colorado red rock trail, cartoon characters with hyper-realistic sandstone arch and blue sky realistic background",
"Cartoon Snoopy and Woodstock at a Balinese jungle waterfall, cartoon characters with hyper-realistic mossy cliff and turquoise pool realistic background",
"Cartoon Snoopy and Woodstock at a North Carolina Blue Ridge sunset, cartoon characters with hyper-realistic layered purple mountain realistic background",
"Cartoon Snoopy and Woodstock at a Maine coastal village, cartoon characters with hyper-realistic lobster trap and dock realistic background",
"Cartoon Snoopy and Woodstock at a Polish mountain meadow, cartoon characters with hyper-realistic wildflower valley realistic background",
"Cartoon Snoopy and Woodstock at a Venice canal at blue hour, cartoon characters with hyper-realistic glowing lantern reflections realistic background",
"Cartoon Snoopy and Woodstock at a Tibetan monastery gateway, cartoon characters with hyper-realistic prayer flag mountain realistic background",
"Cartoon Snoopy and Woodstock at a Pacific Northwest forest trail, cartoon characters with hyper-realistic fern gully and cedar realistic background",
"Cartoon Snoopy and Woodstock at a Hawaiian volcano crater lake, cartoon characters with hyper-realistic mist and lava field realistic background",
"Cartoon Snoopy and Woodstock at an Icelandic lava field at dawn, cartoon characters with hyper-realistic orange sunrise and black rock realistic background",
"Cartoon Snoopy and Woodstock at a Scottish highland cattle farm, cartoon characters with hyper-realistic misty glen and long-haired cattle realistic background",
"Cartoon Snoopy and Woodstock at a Namibia desert sunrise, cartoon characters with hyper-realistic rust-red dunes and pale sky realistic background",
"Cartoon Snoopy and Woodstock at a Washington state wildfire lookout, cartoon characters with hyper-realistic green sea of forest realistic background",
"Cartoon Snoopy and Woodstock at a tropical fish market, cartoon characters with hyper-realistic glistening colorful catch realistic background",
"Cartoon Snoopy and Woodstock at a winter Bavarian castle, cartoon characters with hyper-realistic snow-covered towers and forest realistic background",
"Cartoon Snoopy and Woodstock at a Turkish hot air balloon sunrise over Cappadocia, cartoon characters with hyper-realistic balloon fleet and valleys realistic background",
"Cartoon Snoopy and Woodstock at a Yosemite valley floor, cartoon characters with hyper-realistic granite walls and falls realistic background",
"Cartoon Snoopy and Woodstock at a Portuguese azulejo tiled plaza, cartoon characters with hyper-realistic blue tile facade realistic background",
"Cartoon Snoopy and Woodstock at a Machu Picchu overlook, cartoon characters with hyper-realistic cloud forest and stone ruins realistic background",
"Cartoon Snoopy and Woodstock at an Everglades airboat, cartoon characters with hyper-realistic sawgrass and alligator country realistic background",
"Cartoon Snoopy and Woodstock at an Arctic polar bear encounter, cartoon characters with hyper-realistic frozen bay and white bear realistic background",
"Cartoon Snoopy and Woodstock at a Tuscany morning fog vineyard, cartoon characters with hyper-realistic mist rolling through vine rows realistic background",
"Cartoon Snoopy and Woodstock at a moonrise over the Sahara, cartoon characters with hyper-realistic silver dunes and stars realistic background",
"Cartoon Snoopy and Woodstock at a tide pool anemone close-up, cartoon characters with hyper-realistic crystal salt water realistic background",
"Cartoon Snoopy and Woodstock at a redwood coastal grove, cartoon characters with hyper-realistic fog drifting through giant trunks realistic background",
    // ── 200 ALL-CARTOON Snoopy and Woodstock activities ──
  "Cartoon Snoopy and Woodstock surfing a big cartoon wave in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock hiking up a cartoon mountain trail in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock camping under cartoon stars in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock kayaking down a cartoon river in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock fishing in a cartoon sunny pond in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock skiing down a cartoon snowy slope in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock riding in a cartoon hot air balloon in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock sailing a cartoon boat at sunset in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock roasting marshmallows at a cartoon campfire in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock having a cartoon picnic in a spring meadow in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock flying a cartoon kite on a breezy hill in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon soccer on a sunny field in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock building a cartoon snowman together in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock riding cartoon bikes through a park in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon tennis on a bright court in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing cartoon yoga in a sunny garden in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon drums at a music jam in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock cooking cartoon soup in a cozy kitchen in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock painting on cartoon canvas in a bright studio in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock reading cartoon books under a big tree in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock dancing at a cartoon street festival in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock gardening with cartoon vegetables in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon chess in a cozy den in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon lemonade stand in summer in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock chasing cartoon butterflies in a meadow in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock building a cartoon fort out of pillows in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock baking cartoon cookies in a cartoon kitchen in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon baseball on a sunny diamond in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock going on a cartoon train adventure in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock flying a cartoon paper airplane in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon ice cream cart in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing a cartoon dance-off in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon video games on a big couch in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon farmers market in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon catch in a backyard in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon carnival midway in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon snow angels in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock running a cartoon lemonade stand in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock jumping on a cartoon trampoline in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock exploring a cartoon haunted house in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon birthday party with balloons in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon arcade games in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon juice together in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock on a cartoon roller coaster in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock swimming in a cartoon pool with floaties in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon puppet show in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon basketball in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock on a cartoon merry-go-round in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon magic show in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making a cartoon birdhouse together in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon space adventure in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock riding a cartoon tandem bike in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon science fair in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing cartoon karate in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon pie-eating contest in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock on a cartoon camping adventure with tents in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon music with pots and pans in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon cloud-watching afternoon in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon mini golf in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon treasure hunt in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon paper boats in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon superhero day in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing a cartoon puzzle together in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon flower shop in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock going on a cartoon treasure island in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon bubbles in a backyard in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock riding a cartoon zip line in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon beach volleyball game in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making a cartoon kite together in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon autumn leaf pile in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon sandcastles at the beach in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon school science project in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock on a cartoon water slide in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock stargazing with a cartoon telescope in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon morning exercise routine in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock in a cartoon rowboat on a lake in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon silly faces in a mirror in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon storytelling circle in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon hopscotch in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon rainy day indoor fort in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon beach sunrise walk in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon badminton in a backyard in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon candy shop in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock on a cartoon snowy sled in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon homemade pizza in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon art gallery opening in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon drums and guitar together in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon morning cereal breakfast in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon snow ice cream in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon summer cookout in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon shuffleboard in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon spring planting day in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon car wash in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing a cartoon science experiment in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon costume party in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock on a cartoon forest nature walk in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon backyard movie night in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making a cartoon gingerbread house in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock on a cartoon ferry boat ride in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon leapfrog in a park in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon sock puppet theater in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon art with finger paint in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon morning newspaper in a cozy chair in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock on a cartoon hot cocoa night in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing a cartoon egg and spoon race in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon daydream on a cloud in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon origami together in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon freeze tag in a park in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon library storytime in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon bracelets together in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon nature scavenger hunt in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock on a cartoon sunset walk on the beach in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon pillow fight in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making a cartoon blanket fort in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon parade float in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing a cartoon campfire singalong in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon morning sunrise view in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon jam in a farmhouse kitchen in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon spring rain puddle jump in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock building cartoon block towers together in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon bowling in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon firefly catching at dusk in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon shadow puppets in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon harvest festival in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing a cartoon jumping jack contest in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon birdhouse painting day in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing cartoon tug of war in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon spring flower crown making in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock watching a cartoon meteor shower in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making a cartoon balloon animal in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon board game night in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon tie-dye shirt making day in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing a cartoon synchronized swim in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon country fair in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon friendship bracelets in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon pinecone bird feeder craft in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing a cartoon morning stretch routine in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon backyard astronomy night in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon farm animal feeding in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon leaf rubbings in autumn in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing a cartoon potato sack race in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon spring rain singing in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making a cartoon weather vane together in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon nature journaling session in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing a cartoon hula hoop contest in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon smoothie stand in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon summer hammock reading in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making a cartoon rainy day soup in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing cartoon aerobics in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon butterfly garden visit in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon holiday cards together in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon bedtime storytelling in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making a cartoon dream catcher in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon circus performance in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon banana pancakes in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon winter hot chocolate station in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making a cartoon paper lantern in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon end-of-summer bonfire in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing cartoon morning bird call listening in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making cartoon apple cider in autumn in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon winter igloo build in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock playing a cartoon ukulele on the porch in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon frog catching by a pond in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock making a cartoon autumn wreath in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock at a cartoon spring seed planting in a colorful cartoon world",
  "Cartoon Snoopy and Woodstock doing a cartoon cartwheel in the park in a colorful cartoon world",

"Cartoon Snoopy and Woodstock having a cartoon water balloon fight in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon telescope night in a colorful cartoon world",
"Cartoon Snoopy and Woodstock doing a cartoon somersault contest in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon apple pie baking in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon backyard bug hunt in a colorful cartoon world",
"Cartoon Snoopy and Woodstock making a cartoon volcano science experiment in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon turtle race in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon paper plane flying contest in a colorful cartoon world",
"Cartoon Snoopy and Woodstock doing a cartoon moonwalk dance in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon morning pancake breakfast in a colorful cartoon world",
"Cartoon Snoopy and Woodstock building a cartoon sandcastle competition in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon roller skating rink in a colorful cartoon world",
"Cartoon Snoopy and Woodstock doing a cartoon high jump in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon photo booth in a colorful cartoon world",
"Cartoon Snoopy and Woodstock making cartoon ice pops in summer in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon autumn pumpkin picking in a colorful cartoon world",
"Cartoon Snoopy and Woodstock doing a cartoon three-legged race in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon snowy owl visit in a colorful cartoon world",
"Cartoon Snoopy and Woodstock making cartoon paper snowflakes in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon marble run building in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon chalk art on the sidewalk in a colorful cartoon world",
"Cartoon Snoopy and Woodstock doing a cartoon sunrise stretch in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon wooden boat building in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon robot building day in a colorful cartoon world",
"Cartoon Snoopy and Woodstock making cartoon lollipops in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon snow globe shaking in a colorful cartoon world",
"Cartoon Snoopy and Woodstock doing a cartoon headstand in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon treasure map drawing in a colorful cartoon world",
"Cartoon Snoopy and Woodstock making cartoon sock puppets in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon moonlit dance in a colorful cartoon world",
"Cartoon Snoopy and Woodstock having a cartoon spelling bee in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon rainbow painting after rain in a colorful cartoon world",
"Cartoon Snoopy and Woodstock at a cartoon bug collection jar in a colorful cartoon world",
"Cartoon Snoopy and Woodstock doing a cartoon piggyback race in a colorful cartoon world",
    // ── 200 Snoopy and Woodstock in iconic paintings ──
  "Snoopy and Woodstock in The Starry Night by Van Gogh, iconic painting recreation with swirling blue sky",
  "Snoopy and Woodstock in American Gothic by Grant Wood, iconic painting recreation with farmhouse backdrop",
  "Snoopy and Woodstock in Water Lilies by Claude Monet, iconic painting recreation with soft pond reflections",
  "Snoopy and Woodstock in The Persistence of Memory by Salvador Dali, iconic painting recreation with melting clocks",
  "Snoopy and Woodstock in A Sunday on La Grande Jatte by Seurat, iconic painting recreation with pointillist park scene",
  "Snoopy and Woodstock in The Birth of Venus by Botticelli, iconic painting recreation with shell and sea",
  "Snoopy and Woodstock in The Last Supper by Leonardo da Vinci, iconic painting recreation with long table",
  "Snoopy and Woodstock in The Scream by Edvard Munch, iconic painting recreation with swirling orange sky",
  "Snoopy and Woodstock in Impression Sunrise by Claude Monet, iconic painting recreation with harbor fog",
  "Snoopy and Woodstock in The Kiss by Gustav Klimt, iconic painting recreation with gold mosaic embrace",
  "Snoopy and Woodstock in Girl with a Pearl Earring by Vermeer, iconic painting recreation with dark background",
  "Snoopy and Woodstock in The Great Wave off Kanagawa by Hokusai, iconic painting recreation with towering wave",
  "Snoopy and Woodstock in Las Meninas by Velazquez, iconic painting recreation with royal chamber scene",
  "Snoopy and Woodstock in Sunflowers by Vincent van Gogh, iconic painting recreation with yellow vase",
  "Snoopy and Woodstock in The Night Watch by Rembrandt, iconic painting recreation with dramatic torchlit group",
  "Snoopy and Woodstock in Liberty Leading the People by Delacroix, iconic painting recreation with flag and smoke",
  "Snoopy and Woodstock in The Creation of Adam by Michelangelo, iconic painting recreation with reaching hands",
  "Snoopy and Woodstock in Guernica by Pablo Picasso, iconic painting recreation with cubist war scene",
  "Snoopy and Woodstock in Christina's World by Andrew Wyeth, iconic painting recreation with dry field",
  "Snoopy and Woodstock in The Dance by Henri Matisse, iconic painting recreation with figures in a circle",
  "Snoopy and Woodstock in Nighthawks by Edward Hopper, iconic painting recreation with night diner",
  "Snoopy and Woodstock in The Hay Wain by John Constable, iconic painting recreation with English river cart",
  "Snoopy and Woodstock in Arrangement in Grey and Black by Whistler, iconic painting recreation with armchair",
  "Snoopy and Woodstock in Olympia by Edouard Manet, iconic painting recreation with white sheet and flowers",
  "Snoopy and Woodstock in The Luncheon on the Grass by Manet, iconic painting recreation with forest picnic",
  "Snoopy and Woodstock in Bedroom in Arles by Vincent van Gogh, iconic painting recreation with yellow room",
  "Snoopy and Woodstock in Bal du moulin de la Galette by Renoir, iconic painting recreation with festive dance",
  "Snoopy and Woodstock in The Raft of the Medusa by Gericault, iconic painting recreation with dramatic sea",
  "Snoopy and Woodstock in Portrait of Adele by Klimt, iconic painting recreation with shimmering gold",
  "Snoopy and Woodstock in Saturn Devouring His Son by Goya, iconic painting recreation with dark drama",
  "Snoopy and Woodstock in The Third of May by Goya, iconic painting recreation with lantern and fear",
  "Snoopy and Woodstock in The Sleeping Gypsy by Henri Rousseau, iconic painting recreation with lion and desert",
  "Snoopy and Woodstock in The Dream by Henri Rousseau, iconic painting recreation with jungle and recumbent figure",
  "Snoopy and Woodstock in Wanderer above the Sea of Fog by Friedrich, iconic painting recreation with misty peaks",
  "Snoopy and Woodstock in The Two Fridas by Frida Kahlo, iconic painting recreation with linked hearts",
  "Snoopy and Woodstock in Cafe Terrace at Night by Van Gogh, iconic painting recreation with starry Arles street",
  "Snoopy and Woodstock in Bridge over a Pond of Water Lilies by Monet, iconic painting recreation with arch reflection",
  "Snoopy and Woodstock in Blue Period Guitar by Picasso, iconic painting recreation with melancholy musician",
  "Snoopy and Woodstock in The Lady of Shalott by Waterhouse, iconic painting recreation with river tapestry boat",
  "Snoopy and Woodstock in Starry Night over the Rhone by Van Gogh, iconic painting recreation with harbor reflections",
  "Snoopy and Woodstock in The Gleaners by Jean-Francois Millet, iconic painting recreation with harvest field",
  "Snoopy and Woodstock in Broadway Boogie Woogie by Mondrian, iconic painting recreation with city grid",
  "Snoopy and Woodstock in Blue Nude by Henri Matisse, iconic painting recreation with cut-paper figure",
  "Snoopy and Woodstock in The Acrobats Family by Picasso, iconic painting recreation with circus family",
  "Snoopy and Woodstock in The Arnolfini Portrait by Jan van Eyck, iconic painting recreation with chandelier and green",
  "Snoopy and Woodstock in Madam X by John Singer Sargent, iconic painting recreation with dramatic black gown",
  "Snoopy and Woodstock in The Blue Boy by Thomas Gainsborough, iconic painting recreation with blue satin suit",
  "Snoopy and Woodstock in Self Portrait with Thorn Necklace by Frida Kahlo, iconic painting recreation with jungle",
  "Snoopy and Woodstock in The Balcony by Manet, iconic painting recreation with iron rail and figures",
  "Snoopy and Woodstock in Young Woman with a Water Jug by Vermeer, iconic painting recreation with window light",
  "Snoopy and Woodstock in The Ambassadors by Holbein, iconic painting recreation with lute and anamorphic skull",
  "Snoopy and Woodstock in Snow Storm at Sea by Turner, iconic painting recreation with vortex of white",
  "Snoopy and Woodstock in Rain Steam and Speed by Turner, iconic painting recreation with locomotive in rain",
  "Snoopy and Woodstock in The Oxbow by Thomas Cole, iconic painting recreation with Hudson Valley panorama",
  "Snoopy and Woodstock in Whistlejacket by George Stubbs, iconic painting recreation with rearing horse",
  "Snoopy and Woodstock in The Anatomy Lesson by Rembrandt, iconic painting recreation with examining figures",
  "Snoopy and Woodstock in The Jewish Bride by Rembrandt, iconic painting recreation with golden couple",
  "Snoopy and Woodstock in Self Portrait 1889 by Van Gogh, iconic painting recreation with blue swirl coat",
  "Snoopy and Woodstock in The Almond Blossom by Van Gogh, iconic painting recreation with white blossoms on blue",
  "Snoopy and Woodstock in Fishing Boats on the Beach by Van Gogh, iconic painting recreation with colorful boats",
  "Snoopy and Woodstock in Irises by Van Gogh, iconic painting recreation with purple flower field",
  "Snoopy and Woodstock in Noon Rest from Work by Van Gogh, iconic painting recreation with siesta in field",
  "Snoopy and Woodstock in The Olive Trees by Van Gogh, iconic painting recreation with gnarled silver trees",
  "Snoopy and Woodstock in The Potato Eaters by Van Gogh, iconic painting recreation with lamp-lit peasant table",
  "Snoopy and Woodstock in The Swing by Fragonard, iconic painting recreation with pink dress and garden",
  "Snoopy and Woodstock in The Fighting Temeraire by Turner, iconic painting recreation with sunset tug",
  "Snoopy and Woodstock in Blue Horses by Franz Marc, iconic painting recreation with expressionist animals",
  "Snoopy and Woodstock in Fate of the Animals by Franz Marc, iconic painting recreation with fractured forest",
  "Snoopy and Woodstock in The Sick Child by Munch, iconic painting recreation with bedside grief",
  "Snoopy and Woodstock in Summer Evening on the Skagen Beach by Kroyer, iconic painting recreation with twilight shore",
  "Snoopy and Woodstock in The Water Carrier of Seville by Velazquez, iconic painting recreation with terracotta jug",
  "Snoopy and Woodstock in Allegory of Spring Primavera by Botticelli, iconic painting recreation with dancing graces",
  "Snoopy and Woodstock in Judith Slaying Holofernes by Artemisia, iconic painting recreation with dramatic candlelit",
  "Snoopy and Woodstock in Watson and the Shark by Copley, iconic painting recreation with rowboat and sea terror",
  "Snoopy and Woodstock in The Return of the Prodigal Son by Rembrandt, iconic painting recreation with golden glow",
  "Snoopy and Woodstock in The Tower of Babel by Pieter Bruegel, iconic painting recreation with spiraling stone",
  "Snoopy and Woodstock in The Hunters in the Snow by Pieter Bruegel, iconic painting recreation with winter village",
  "Snoopy and Woodstock in Peasant Wedding by Pieter Bruegel, iconic painting recreation with long table feast",
  "Snoopy and Woodstock in The Milkmaid by Vermeer, iconic painting recreation with pouring light and jug",
  "Snoopy and Woodstock in The Orange Seller by Joaquin Sorolla, iconic painting recreation with vibrant market",
  "Snoopy and Woodstock in The Funeral at Ornans by Courbet, iconic painting recreation with stone and crowd",
  "Snoopy and Woodstock in Young Girl Reading by Renoir, iconic painting recreation with soft dappled light",
  "Snoopy and Woodstock in The Umbrellas by Renoir, iconic painting recreation with Paris rainy street",
  "Snoopy and Woodstock in Bathers at Asnieres by Seurat, iconic painting recreation with river bank figures",
  "Snoopy and Woodstock in The Circus by Seurat, iconic painting recreation with pointillist acrobat",
  "Snoopy and Woodstock in In the Greenhouse by Manet, iconic painting recreation with tropical plant light",
  "Snoopy and Woodstock in The Ploughman by Camille Pissarro, iconic painting recreation with rolling farm",
  "Snoopy and Woodstock in Red Room by Henri Matisse, iconic painting recreation with red walls and floral",
  "Snoopy and Woodstock in Music by Henri Matisse, iconic painting recreation with orange figures on blue",
  "Snoopy and Woodstock in I and the Village by Marc Chagall, iconic painting recreation with dreamlike faces",
  "Snoopy and Woodstock in Over the Town by Marc Chagall, iconic painting recreation with floating couple at night",
  "Snoopy and Woodstock in The Fiddler by Marc Chagall, iconic painting recreation with rooftop musician",
  "Snoopy and Woodstock in The Lovers by Magritte, iconic painting recreation with veiled faces",
  "Snoopy and Woodstock in Son of Man by Magritte, iconic painting recreation with bowler hat and apple",
  "Snoopy and Woodstock in The Human Condition by Magritte, iconic painting recreation with window and landscape",
  "Snoopy and Woodstock in Time Transfixed by Magritte, iconic painting recreation with locomotive in fireplace",
  "Snoopy and Woodstock in Self Portrait 1907 by Picasso, iconic painting recreation with proto-cubist face",
  "Snoopy and Woodstock in The Old Guitarist by Picasso, iconic painting recreation with blue period sorrow",
  "Snoopy and Woodstock in Girl Before a Mirror by Picasso, iconic painting recreation with fractured reflection",
  "Snoopy and Woodstock in Weeping Woman by Picasso, iconic painting recreation with fragmented grief",
  "Snoopy and Woodstock in Three Musicians by Picasso, iconic painting recreation with geometric performers",
  "Snoopy and Woodstock in The Merry Drinker by Frans Hals, iconic painting recreation with ruddy laughter",
  "Snoopy and Woodstock in Ophelia by Millais, iconic painting recreation with floating flowers and stream",
  "Snoopy and Woodstock in The Lady of Shalott in her tower by Waterhouse, iconic painting recreation with magical mirror",
  "Snoopy and Woodstock in The Annunciation by Fra Angelico, iconic painting recreation with golden light and angel",
  "Snoopy and Woodstock in The Vision after the Sermon by Gauguin, iconic painting recreation with red ground and wrestling Jacob",
  "Snoopy and Woodstock in Where Do We Come From by Gauguin, iconic painting recreation with Tahitian panorama",
  "Snoopy and Woodstock in The Yellow Christ by Gauguin, iconic painting recreation with Breton women and cross",
  "Snoopy and Woodstock in Still Life with Apples by Cezanne, iconic painting recreation with tabletop fruit",
  "Snoopy and Woodstock in Mont Sainte-Victoire by Cezanne, iconic painting recreation with geometric mountain",
  "Snoopy and Woodstock in The Card Players by Cezanne, iconic painting recreation with pipe and focus",
  "Snoopy and Woodstock in Large Bathers by Cezanne, iconic painting recreation with forest clearing figures",
  "Snoopy and Woodstock in Nude Descending a Staircase by Duchamp, iconic painting recreation with fragmented motion",
  "Snoopy and Woodstock in Composition VIII by Wassily Kandinsky, iconic painting recreation with geometric abstraction",
  "Snoopy and Woodstock in Blue Rider by Wassily Kandinsky, iconic painting recreation with loose bright horse",
  "Snoopy and Woodstock in Luncheon of the Boating Party by Renoir, iconic painting recreation with waterside cafe",
  "Snoopy and Woodstock in The Pink Nude by Matisse, iconic painting recreation with warm checkered background",
  "Snoopy and Woodstock in Poplar Trees by Claude Monet, iconic painting recreation with tall reflected columns",
  "Snoopy and Woodstock in The Japanese Bridge by Claude Monet, iconic painting recreation with willows and arch",
  "Snoopy and Woodstock in Rouen Cathedral at Sunset by Monet, iconic painting recreation with warm Gothic stone",
  "Snoopy and Woodstock in Stack of Wheat at Sunset by Monet, iconic painting recreation with warm harvest light",
  "Snoopy and Woodstock in Woman with a Parasol by Monet, iconic painting recreation with windswept hilltop",
  "Snoopy and Woodstock in Two Young Women at a Piano by Renoir, iconic painting recreation with warm interior",
  "Snoopy and Woodstock in Boating by Manet, iconic painting recreation with striped costume and bright water",
  "Snoopy and Woodstock in Breezing Up by Winslow Homer, iconic painting recreation with sailboat and boys",
  "Snoopy and Woodstock in The Fog Warning by Winslow Homer, iconic painting recreation with lone fisherman",
  "Snoopy and Woodstock in Washington Crossing the Delaware by Leutze, iconic painting recreation with icy river",
  "Snoopy and Woodstock in Snap the Whip by Winslow Homer, iconic painting recreation with boys in a field",
  "Snoopy and Woodstock in Automat by Edward Hopper, iconic painting recreation with lone coffee drinker",
  "Snoopy and Woodstock in Cape Cod Morning by Edward Hopper, iconic painting recreation with sun through panes",
  "Snoopy and Woodstock in Gas by Edward Hopper, iconic painting recreation with pumps at dusk",
  "Snoopy and Woodstock in New York Movie by Edward Hopper, iconic painting recreation with usherette in red",
  "Snoopy and Woodstock in Chop Suey by Edward Hopper, iconic painting recreation with restaurant window light",
  "Snoopy and Woodstock in Spring by Andrew Wyeth, iconic painting recreation with figure on a hill in thaw",
  "Snoopy and Woodstock in Wind from the Sea by Andrew Wyeth, iconic painting recreation with curtain lifting",
  "Snoopy and Woodstock in Fur Traders Descending the Missouri by Bingham, iconic painting recreation with misty river",
  "Snoopy and Woodstock in The Peaceable Kingdom by Edward Hicks, iconic painting recreation with lion and lamb",
  "Snoopy and Woodstock in Stag at Sharkeys by George Bellows, iconic painting recreation with boxing ring drama",
  "Snoopy and Woodstock in Cliff Dwellers by George Bellows, iconic painting recreation with tenement city life",
  "Snoopy and Woodstock in The Tornado by John Steuart Curry, iconic painting recreation with dark funnel and farm",
  "Snoopy and Woodstock in Daughters of Revolution by Grant Wood, iconic painting recreation with parlor figures",
  "Snoopy and Woodstock in Young Corn by Grant Wood, iconic painting recreation with rolling Iowa hills",
  "Snoopy and Woodstock in The Sower by Jean-Francois Millet, iconic painting recreation with twilight field",
  "Snoopy and Woodstock in Man with a Hoe by Jean-Francois Millet, iconic painting recreation with laborer at rest",
  "Snoopy and Woodstock in The Angelus by Jean-Francois Millet, iconic painting recreation with prayer in the field",
  "Snoopy and Woodstock in Oath of the Horatii by Jacques-Louis David, iconic painting recreation with Roman arches",
  "Snoopy and Woodstock in Napoleon Crossing the Alps by David, iconic painting recreation with rearing white horse",
  "Snoopy and Woodstock in The Coronation of Napoleon by David, iconic painting recreation with cathedral gold",
  "Snoopy and Woodstock in The Intervention of the Sabine Women by David, iconic painting recreation with battle halt",
  "Snoopy and Woodstock in The Lacemaker by Vermeer, iconic painting recreation with close window work",
  "Snoopy and Woodstock in View of Delft by Vermeer, iconic painting recreation with reflected canal city",
  "Snoopy and Woodstock in The Music Lesson by Vermeer, iconic painting recreation with harpsichord and mirror",
  "Snoopy and Woodstock in Officer and Laughing Girl by Vermeer, iconic painting recreation with light and shadow play",
  "Snoopy and Woodstock in The Mill at Wijk by Jacob van Ruisdael, iconic painting recreation with stormy windmill",
  "Snoopy and Woodstock in Wheat Field with Crows by Van Gogh, iconic painting recreation with dark brooding sky",
  "Snoopy and Woodstock in The Bedroom by Van Gogh, iconic painting recreation with wooden chair and yellow walls",
  "Snoopy and Woodstock in The Sower with Setting Sun by Van Gogh, iconic painting recreation with glowing horizon",
  "Snoopy and Woodstock in Portrait of Dr Gachet by Van Gogh, iconic painting recreation with foxglove and melancholy",
  "Snoopy and Woodstock in The Church at Auvers by Van Gogh, iconic painting recreation with cobalt sky and path",
  "Snoopy and Woodstock in At the Moulin Rouge by Toulouse-Lautrec, iconic painting recreation with gas-lit crowd",
  "Snoopy and Woodstock in Jane Avril Dancing by Toulouse-Lautrec, iconic painting recreation with red-haired dancer",
  "Snoopy and Woodstock in The Circus Fernando by Toulouse-Lautrec, iconic painting recreation with ring and horseback",
  "Snoopy and Woodstock in A Bar at the Folies Bergere by Manet, iconic painting recreation with mirror reflection",
  "Snoopy and Woodstock in The Execution of Maximilian by Manet, iconic painting recreation with firing squad drama",
  "Snoopy and Woodstock in The Thinker bronze scene by Rodin visualized, iconic painting recreation with seated figure",
  "Snoopy and Woodstock in Composition with Red Blue and Yellow by Mondrian, iconic painting recreation with black grid",
  "Snoopy and Woodstock in Number 31 by Jackson Pollock, iconic painting recreation with dripped action lines",
  "Snoopy and Woodstock in Campbell Soup Cans by Warhol, iconic painting recreation with pop art grid",
  "Snoopy and Woodstock in Marilyn Diptych by Andy Warhol, iconic painting recreation with screen-print repetition",
  "Snoopy and Woodstock in Flag by Jasper Johns, iconic painting recreation with encaustic stars and stripes",
  "Snoopy and Woodstock in Whaam by Roy Lichtenstein, iconic painting recreation with comic book explosion",
  "Snoopy and Woodstock in Drowning Girl by Roy Lichtenstein, iconic painting recreation with Ben-Day dot tears",
  "Snoopy and Woodstock in Large Interior with Palette by David Hockney, iconic painting recreation with LA light",
  "Snoopy and Woodstock in A Bigger Splash by David Hockney, iconic painting recreation with diving board and pool",
  "Snoopy and Woodstock in American Collectors by David Hockney, iconic painting recreation with couple and sculpture",
  "Snoopy and Woodstock in The False Mirror by Magritte, iconic painting recreation with eye reflecting clouds",
  "Snoopy and Woodstock in Golconda by Magritte, iconic painting recreation with raining bowler hat men",
  "Snoopy and Woodstock in The Garden of Earthly Delights by Hieronymus Bosch, iconic painting recreation with triptych fantasy",
  "Snoopy and Woodstock in The Ship of Fools by Hieronymus Bosch, iconic painting recreation with boat and revelers",
  "Snoopy and Woodstock in The Temptation of Saint Anthony by Bosch, iconic painting recreation with surreal creatures",
  "Snoopy and Woodstock in The Conversion of Saint Paul by Caravaggio, iconic painting recreation with fallen horse",
  "Snoopy and Woodstock in The Supper at Emmaus by Caravaggio, iconic painting recreation with shocked recognition",
  "Snoopy and Woodstock in Young Sick Bacchus by Caravaggio, iconic painting recreation with pale feverish youth",
  "Snoopy and Woodstock in The Fortune Teller by Caravaggio, iconic painting recreation with card reading scene",

"Snoopy and Woodstock in The Milkmaid by Vermeer second version, iconic painting recreation with warm window and kitchen detail",
"Snoopy and Woodstock in The Return of the Prodigal Son second version by Rembrandt, iconic painting recreation with warm embrace detail",
"Snoopy and Woodstock in Young Sick Bacchus by Caravaggio, iconic painting recreation with pale feverish youth and grapes",
"Snoopy and Woodstock in The Fortune Teller by Caravaggio, iconic painting recreation with candlelit card scene",
"Snoopy and Woodstock in The Supper at Emmaus by Caravaggio, iconic painting recreation with shocked recognition at table",
"Snoopy and Woodstock in Boys Eating Grapes by Murillo, iconic painting recreation with sunlit children and fruit",
"Snoopy and Woodstock in Two Women at a Window by Murillo, iconic painting recreation with leaning figures and lattice",
"Snoopy and Woodstock in The Laughing Cavalier by Frans Hals, iconic painting recreation with lace collar and wit",
"Snoopy and Woodstock in The Garden of Earthly Delights by Bosch, iconic painting recreation with triptych wonder and fantasy",
"Snoopy and Woodstock in Saint Jerome in the Wilderness by Leonardo, iconic painting recreation with rocky penitent scene",
"Snoopy and Woodstock in Madonna Litta by Leonardo, iconic painting recreation with tender nursing and arched window",
"Snoopy and Woodstock in Salvator Mundi by Leonardo, iconic painting recreation with orb and blessing gesture",
"Snoopy and Woodstock in The Virgin of the Rocks by Leonardo, iconic painting recreation with grotto and gentle light",
"Snoopy and Woodstock in Primavera garden detail by Botticelli, iconic painting recreation with orange grove and three graces",
"Snoopy and Woodstock in Pallas and the Centaur by Botticelli, iconic painting recreation with floral robe and creature",
"Snoopy and Woodstock in Lamentations over the Dead Christ by Mantegna, iconic painting recreation with foreshortened figure",
    // ── 200 Snoopy and Woodstock in different art style paintings ──
  "Snoopy and Woodstock at a summer picnic, watercolor art style painting with soft washes and blooming color",
  "Snoopy and Woodstock surfing a wave, bold oil painting art style painting with thick impasto texture",
  "Snoopy and Woodstock at a Paris cafe, impressionist art style painting with loose brushwork and golden light",
  "Snoopy and Woodstock hiking in mountains, pointillist art style painting with tiny dots of pure color",
  "Snoopy and Woodstock dancing at a festival, cubist art style painting with geometric fractured forms",
  "Snoopy and Woodstock under cherry blossoms, Japanese ukiyo-e woodblock art style painting with flat bold outlines",
  "Snoopy and Woodstock at a tea ceremony, Chinese ink wash art style painting with minimalist brushstrokes",
  "Snoopy and Woodstock in a garden, Art Nouveau art style painting with flowing organic lines and ornate border",
  "Snoopy and Woodstock on a travel adventure, Art Deco art style painting with geometric symmetry and rich gold",
  "Snoopy and Woodstock at a pop art gallery, pop art style painting with Ben-Day dots and flat bold color",
  "Snoopy and Woodstock on a beach at sunset, gouache art style painting with opaque richly saturated color",
  "Snoopy and Woodstock reading in a library, pencil sketch art style painting with fine cross-hatched detail",
  "Snoopy and Woodstock camping by a fire, charcoal art style painting with soft blended shadows",
  "Snoopy and Woodstock at a flower market, pastel art style painting with chalky soft bloom",
  "Snoopy and Woodstock sailing at sea, linocut art style painting with bold black and white cut lines",
  "Snoopy and Woodstock at a jazz club, screen print art style painting with flat overlapping color layers",
  "Snoopy and Woodstock stargazing, risograph art style painting with textured grain and limited palette",
  "Snoopy and Woodstock at a carnival, expressionist art style painting with vivid distorted emotion",
  "Snoopy and Woodstock in a forest, symbolist art style painting with dreamlike mysterious atmosphere",
  "Snoopy and Woodstock at a winter market, naive folk art style painting with flat simplified charm",
  "Snoopy and Woodstock at a mountain vista, panoramic oil painting art style painting with classical detail",
  "Snoopy and Woodstock on a road trip, retro illustration art style painting with mid-century palette",
  "Snoopy and Woodstock at a spring bloom, en plein air art style painting with luminous outdoor light",
  "Snoopy and Woodstock at a night sky, astronomer map art style painting with gold constellation overlay",
  "Snoopy and Woodstock baking together, cozy cottage art style painting with warm hearth tones",
  "Snoopy and Woodstock at a harbor, Dutch Golden Age art style painting with rich atmospheric depth",
  "Snoopy and Woodstock in the snow, Scandinavian folk art style painting with red and white patterns",
  "Snoopy and Woodstock at a vineyard, Fauvist art style painting with wild saturated unexpected colors",
  "Snoopy and Woodstock on a train journey, vintage travel poster art style painting with flat blocks of color",
  "Snoopy and Woodstock at a temple gate, East Asian lacquer art style painting with deep red and gold",
  "Snoopy and Woodstock fishing at dawn, tonalist art style painting with quiet grey misty mood",
  "Snoopy and Woodstock in a meadow, Barbizon art style painting with earthy naturalistic calm",
  "Snoopy and Woodstock at a river, Pre-Raphaelite art style painting with jewel tones and fine botanical detail",
  "Snoopy and Woodstock at a ballet performance, Degas-inspired art style painting with soft pastel movement",
  "Snoopy and Woodstock at a seaside, Sorolla-inspired art style painting with white light and sparkling water",
  "Snoopy and Woodstock at a Moroccan courtyard, orientalist art style painting with tile and arch detail",
  "Snoopy and Woodstock in a forest glade, Romantic era art style painting with dramatic light and shadow",
  "Snoopy and Woodstock at an autumn harvest, American regionalist art style painting with warm harvest tone",
  "Snoopy and Woodstock on a rooftop at night, ashcan school art style painting with urban grit and life",
  "Snoopy and Woodstock at a bookshop, Flemish still life art style painting with rich texture and candle glow",
  "Snoopy and Woodstock at a lakeside, luminism art style painting with glowing still water at dawn",
  "Snoopy and Woodstock at a mountain overlook, Hudson River School art style painting with sublime scale",
  "Snoopy and Woodstock at a bakery, Dutch domestic genre art style painting with warm interior and light",
  "Snoopy and Woodstock playing music, Baroque art style painting with dramatic chiaroscuro",
  "Snoopy and Woodstock at a spring garden, English Romantic watercolor art style painting with loose washes",
  "Snoopy and Woodstock cooking outdoors, plein air oil art style painting with broken brushwork",
  "Snoopy and Woodstock at a tropical lagoon, Gauguin-inspired art style painting with flat primitive color",
  "Snoopy and Woodstock at a carousel, Post-Impressionist art style painting with thick swirling color",
  "Snoopy and Woodstock in a rainstorm, Turneresque art style painting with white atmospheric blur",
  "Snoopy and Woodstock at a lively market, Bruegel-inspired art style painting with crowded folk scene",
  "Snoopy and Woodstock at a quiet studio, Vermeer-inspired art style painting with window light and calm",
  "Snoopy and Woodstock in a mountain village, Swiss naive art style painting with colorful flat charm",
  "Snoopy and Woodstock at a port at night, Nocturne art style painting with dark water and light reflections",
  "Snoopy and Woodstock at a meadow at dusk, Barbizon twilight art style painting with golden hour fields",
  "Snoopy and Woodstock at a forest path in autumn, American tonalist art style painting with deep earthy mood",
  "Snoopy and Woodstock at a children's party, vintage nursery rhyme illustration art style painting",
  "Snoopy and Woodstock at a cafe table, Belle Epoque art style painting with floral border and warm glow",
  "Snoopy and Woodstock at an ice skating rink, Victorian chromolithograph art style painting with holiday charm",
  "Snoopy and Woodstock at a Mexican fiesta, muralism art style painting with flat bold figures and bright color",
  "Snoopy and Woodstock at a moonlit garden, Symbolist night art style painting with blue and silver mystery",
  "Snoopy and Woodstock at a cottage window, stained glass art style painting with leaded color segments",
  "Snoopy and Woodstock playing cricket, English sporting print art style painting with classical frame",
  "Snoopy and Woodstock at a harvest supper, genre oil art style painting with warm candlelit scene",
  "Snoopy and Woodstock in the rain, Japanese shin-hanga art style painting with delicate modern print",
  "Snoopy and Woodstock under a willow, Chinese landscape ink wash art style painting with calligraphic strokes",
  "Snoopy and Woodstock at an autumn fair, American primitive art style painting with flat folk charm",
  "Snoopy and Woodstock on a bicycle, Toulouse-Lautrec art style painting with flat lithograph poster",
  "Snoopy and Woodstock at an abbey ruin, Romantic ruin art style painting with melancholy grandeur",
  "Snoopy and Woodstock at a flower field, Dutch floral still life art style painting with extreme botanical detail",
  "Snoopy and Woodstock at a shipyard, industrial realist art style painting with steel and steam",
  "Snoopy and Woodstock at a summer fair, Renoir-inspired art style painting with dappled light and joy",
  "Snoopy and Woodstock at a Persian garden, Persian miniature art style painting with intricate flat detail",
  "Snoopy and Woodstock at a winter village, Grandma Moses art style painting with naive snowy charm",
  "Snoopy and Woodstock at a medieval feast, illuminated manuscript art style painting with gold leaf",
  "Snoopy and Woodstock at a morning garden, Impressionist plein air art style painting with broken light",
  "Snoopy and Woodstock at a desert sunset, American West oil art style painting with ochre and violet sky",
  "Snoopy and Woodstock at a fishing village, marine realist art style painting with salt and grey ocean",
  "Snoopy and Woodstock in a jazz bar, social realist art style painting with gritty warm color",
  "Snoopy and Woodstock at a palace garden, Rococo art style painting with pastel and playful flourish",
  "Snoopy and Woodstock at a grape harvest, Spanish master art style painting with earthy realism",
  "Snoopy and Woodstock at a watermill, English pastoral oil art style painting with summer lush green",
  "Snoopy and Woodstock at an autumn bridge, Whistler Nocturne art style painting with dark harmony",
  "Snoopy and Woodstock in a forest at dawn, German Romantic art style painting with spiritual forest light",
  "Snoopy and Woodstock at a beach cove, Post-Impressionist mosaic art style painting with vivid tiles",
  "Snoopy and Woodstock at a rooftop garden, modern illustration art style painting with flat vector style",
  "Snoopy and Woodstock at a moonlit lake, Luminism art style painting with glowing sky reflection",
  "Snoopy and Woodstock at a strawberry farm, English pastoral watercolor art style painting with hedgerow",
  "Snoopy and Woodstock at a country barn, Pennsylvania Dutch folk art style painting with hex signs",
  "Snoopy and Woodstock at a cliffside cottage, Cornish School art style painting with rugged sea and light",
  "Snoopy and Woodstock at a riverside, French Barbizon art style painting with muted harmony and trees",
  "Snoopy and Woodstock at a morning cafe, Nabis art style painting with flat interior pattern",
  "Snoopy and Woodstock under pine trees, Sumi-e art style painting with minimal ink and white space",
  "Snoopy and Woodstock at a summer pond, American Impressionist art style painting with sparkle and warmth",
  "Snoopy and Woodstock at a winter cabin, Nordic romantic art style painting with soft snowbound warmth",
  "Snoopy and Woodstock at a harvest moon, Wyeth-inspired tempera art style painting with dry realist detail",
  "Snoopy and Woodstock at a country garden gate, Arts and Crafts art style painting with botanical pattern",
  "Snoopy and Woodstock on a city rooftop, Social Realist art style painting with cityscape and blue dusk",
  "Snoopy and Woodstock at a flea market, retro watercolor art style painting with warm muted nostalgia",
  "Snoopy and Woodstock at a tulip field, Impressionist Dutch art style painting with windmill and light",
  "Snoopy and Woodstock at a log cabin in winter, American folk art style painting with warm primitive scene",
  "Snoopy and Woodstock at an alpine meadow, German Romantic oil art style painting with crystal air",
  "Snoopy and Woodstock at a riverside village, Camille Pissarro-inspired art style painting with dappled rural scene",
  "Snoopy and Woodstock at a lighthouse, American marine oil art style painting with muscular waves",
  "Snoopy and Woodstock at an English garden party, Edwardian watercolor art style painting with white linen",
  "Snoopy and Woodstock at a seaside promenade, Belle Epoque illustration art style painting with fans and parasols",
  "Snoopy and Woodstock at a night cafe, Van Gogh-inspired expressionist art style painting with raw color",
  "Snoopy and Woodstock at a windmill, Dutch Realist art style painting with grey sky and flat land",
  "Snoopy and Woodstock at a mountain chapel, Caspar David Friedrich art style painting with spiritual vastness",
  "Snoopy and Woodstock at a country kitchen, Flemish genre oil art style painting with bread and daylight",
  "Snoopy and Woodstock at a tropical beach, Gauguin-inspired art style painting with flat lush paradise",
  "Snoopy and Woodstock at a harbor dawn, Turner-inspired atmospheric art style painting with hazy gold",
  "Snoopy and Woodstock at a botanical garden, Victorian engraving art style painting with precise line",
  "Snoopy and Woodstock at a butterfly garden, Art Nouveau enamel art style painting with cloisonne detail",
  "Snoopy and Woodstock at a spring fair, Austrian Secession art style painting with Klimt-like patterning",
  "Snoopy and Woodstock at a bamboo garden, Korean minhwa folk art style painting with flat cheerful color",
  "Snoopy and Woodstock at a candlelit study, Rembrandt-inspired art style painting with golden shadow",
  "Snoopy and Woodstock at a wheat field, Millet-inspired art style painting with peasant light and labor",
  "Snoopy and Woodstock at a cherry tree, Japanese nihonga art style painting with mineral pigment delicacy",
  "Snoopy and Woodstock at a flower stall, Edouard Vuillard art style painting with patterned domestic texture",
  "Snoopy and Woodstock at a swimming hole, Americana realist art style painting with Thomas Hart Benton curves",
  "Snoopy and Woodstock at a rainy afternoon, Impressionist wet pavement art style painting with Paris lights",
  "Snoopy and Woodstock at a vegetable garden, Dutch 17th century genre art style painting with rich texture",
  "Snoopy and Woodstock at a waterfall, Hudson River School sublime art style painting with mist and grandeur",
  "Snoopy and Woodstock at a country lane, John Constable-inspired art style painting with billowing clouds",
  "Snoopy and Woodstock at a Persian courtyard, Safavid tile art style painting with geometric blue and white",
  "Snoopy and Woodstock at a Venetian canal, Canaletto art style painting with architectural precision",
  "Snoopy and Woodstock at a winter field, Pieter Bruegel-inspired art style painting with bleak beauty",
  "Snoopy and Woodstock at a moonlit forest, Corot-inspired art style painting with silver light and stillness",
  "Snoopy and Woodstock at a hillside village, Italian macchiaioli art style painting with bright color blocks",
  "Snoopy and Woodstock at a coastal path, Edward Lear watercolor art style painting with natural wonder",
  "Snoopy and Woodstock at a summer storm, Romantic melodrama art style painting with churning clouds",
  "Snoopy and Woodstock at a mountain dawn, Albert Bierstadt art style painting with heavenly golden light",
  "Snoopy and Woodstock at a sea cave, Ivan Aivazovsky art style painting with luminous translucent waves",
  "Snoopy and Woodstock at a forest clearing, Theodore Rousseau art style painting with dappled serenity",
  "Snoopy and Woodstock at a winter field, Pyotr Konchalovsky art style painting with bold Russian color",
  "Snoopy and Woodstock at a summer festival, August Macke art style painting with bright transparent shapes",
  "Snoopy and Woodstock at a village square, Joaquin Sorolla art style painting with brilliant Spanish sun",
  "Snoopy and Woodstock at a foggy bay, Winslow Homer watercolor art style painting with fresh immediacy",
  "Snoopy and Woodstock at a brook, Theodore Robinson art style painting with Giverny impressionism",
  "Snoopy and Woodstock at a sunset beach, Martin Johnson Heade art style painting with luminous haystacks",
  "Snoopy and Woodstock at an autumn orchard, Gustave Courbet art style painting with earthy realist richness",
  "Snoopy and Woodstock at a tropical jungle, Henri Rousseau naive art style painting with flat lush fantasy",
  "Snoopy and Woodstock at a mountain stream, Frederic Church art style painting with botanical precision",
  "Snoopy and Woodstock at a desert oasis, orientalist oil art style painting with shimmering heat",
  "Snoopy and Woodstock at a village fete, Helen Allingham watercolor art style painting with cottage garden",
  "Snoopy and Woodstock at a harbor at dusk, Armand Guillaumin art style painting with vivid fauvist port",
  "Snoopy and Woodstock at a woodland stream, Arthur Rackham illustration art style painting with fairy tale ink",
  "Snoopy and Woodstock at a coastal cliff, Paul Nash art style painting with surrealist English landscape",
  "Snoopy and Woodstock at a city street at night, Giorgio de Chirico art style painting with metaphysical shadow",
  "Snoopy and Woodstock at a garden gate, William Morris art style painting with dense floral pattern",
  "Snoopy and Woodstock at a pine forest, Ivan Shishkin art style painting with deep Russian forest detail",
  "Snoopy and Woodstock at a lake at sunset, Isaac Levitan art style painting with lyrical melancholy",
  "Snoopy and Woodstock at an autumn river, Ilya Repin art style painting with epic naturalist sweep",
  "Snoopy and Woodstock at a dawn meadow, George Inness tonalist art style painting with trembling light",
  "Snoopy and Woodstock at a garden bench, Pierre Bonnard art style painting with chromatic vibration",
  "Snoopy and Woodstock at a summer afternoon, Childe Hassam art style painting with American flag impressionism",
  "Snoopy and Woodstock at a park, Mary Cassatt art style painting with intimate mother-child warmth",
  "Snoopy and Woodstock at a teahouse, Hiroshi Yoshida woodblock art style painting with precision and mist",
  "Snoopy and Woodstock at a New England autumn, John Singer Sargent watercolor art style painting with fluid wash",
  "Snoopy and Woodstock at a barn dance, Grant Wood art style painting with rolling stylized hills",
  "Snoopy and Woodstock at a harvest moon, Thomas Cole art style painting with poetic sublime",
  "Snoopy and Woodstock at a riverside mill, Camille Corot art style painting with silvery morning tone",
  "Snoopy and Woodstock at a Mediterranean sea, Paul Signac art style painting with mosaic pointillist tiles",
  "Snoopy and Woodstock at a city park, Maximilien Luce art style painting with pointillist worker scene",
  "Snoopy and Woodstock at a hilltop view, Neo-Impressionist art style painting with chromatic harmony",
  "Snoopy and Woodstock at a mountain pasture, Giovanni Segantini art style painting with Alpine divisionism",
  "Snoopy and Woodstock at a spring morning, Berthe Morisot art style painting with airy intimate brushstroke",
  "Snoopy and Woodstock at a festival street, Granville Redmond art style painting with California golden light",
  "Snoopy and Woodstock at a sand dune, John Marin watercolor art style painting with expressive fractured mark",
  "Snoopy and Woodstock at a canal at dusk, Lesser Ury art style painting with Berlin nocturne reflection",
  "Snoopy and Woodstock at a flower garden, Odilon Redon art style painting with dreamy pastel symbolism",
  "Snoopy and Woodstock at a bay sunrise, Fitz Henry Lane art style painting with luminous calm water",
  "Snoopy and Woodstock at a wheat field sunset, Jules Dupre art style painting with Barbizon storm drama",
  "Snoopy and Woodstock at a lily pond, Gustave Caillebotte art style painting with perspective and garden",
  "Snoopy and Woodstock at a harvest dawn, Jules Bastien-Lepage art style painting with naturalist field",
  "Snoopy and Woodstock at a coastal fog, George Bellows art style painting with bold American ocean",
  "Snoopy and Woodstock at a quiet farm, Andrew Wyeth art style painting with dry-brush tempera realism",
  "Snoopy and Woodstock at a summer lakehouse, Childe Hassam art style painting with sparkling New England",
  "Snoopy and Woodstock at a spring meadow, Emil Nolde art style painting with vivid expressionist colors",

"Snoopy and Woodstock at a mountain sunrise, Frederic Remington oil art style painting with western frontier drama",
"Snoopy and Woodstock at a fishing harbour, Paul Henry oil art style painting with Irish light and blue water",
"Snoopy and Woodstock at a rainy city street, Gustave Caillebotte art style painting with wet cobblestone perspective",
"Snoopy and Woodstock at a woodland, Akseli Gallen-Kallela art style painting with bold Finnish symbolism",
"Snoopy and Woodstock at a cliff walk, Nikolai Astrup art style painting with vivid Norwegian fjord color",
"Snoopy and Woodstock at a market day, Fritz von Uhde art style painting with natural light and folk warmth",
"Snoopy and Woodstock at a bridge in fog, Eugène Jansson art style painting with nocturne blue Stockholm",
"Snoopy and Woodstock at a snowy village, Leo Putz art style painting with luminous Bavarian snowscape",
"Snoopy and Woodstock at a quiet inlet, Emil Carlsen art style painting with still life marine calm",
"Snoopy and Woodstock at a park in autumn, Stanislaw Wyspianski art style painting with Art Nouveau Polish grace",
"Snoopy and Woodstock at a mountain chapel, Magnus von Wright art style painting with Finnish highland serenity",
"Snoopy and Woodstock at a morning lake, Peder Monsted art style painting with Scandinavian realist clarity",
"Snoopy and Woodstock at a beach at low tide, Henry Scott Tuke art style painting with dappled plein air light",
"Snoopy and Woodstock at a forge interior, Joseph Wright of Derby art style painting with dramatic artificial light",
"Snoopy and Woodstock at a misty river, Charles-Francois Daubigny art style painting with peaceful Barbizon dusk",
"Snoopy and Woodstock at a spring orchard, Mikhail Nesterov art style painting with spiritual Russian lyricism",
"Snoopy and Woodstock at a country lane at dusk, George Morland art style painting with rustic English pastoral",
"Snoopy and Woodstock at a garden party, Frits Thaulow art style painting with shimmering Norwegian water",
"Snoopy and Woodstock at an alpine lake, Edward Theodore Compton art style painting with crisp mountain air",
"Snoopy and Woodstock at a farmyard, Constant Troyon art style painting with cattle and pastoral warmth",
"Snoopy and Woodstock at a windswept headland, Peter Severin Kroyer art style painting with luminous Danish coast",
    // ── 200 Snoopy and Woodstock ICONIC POSTER designs ──
  "Snoopy and Woodstock surfing at sunset, iconic vintage surf poster design with bold graphic waves and warm palette",
  "Snoopy and Woodstock hiking a mountain summit, iconic WPA national park poster design with flat bold landscape",
  "Snoopy and Woodstock camping under the Milky Way, iconic retro camping poster design with deep midnight blue",
  "Snoopy and Woodstock fishing at dawn on a lake, iconic vintage fishing poster design with misty morning palette",
  "Snoopy and Woodstock skiing a powder run, iconic 1930s ski resort poster design with bold mountain graphic",
  "Snoopy and Woodstock in a hot air balloon over rolling hills, iconic travel poster design with pastel panoramic view",
  "Snoopy and Woodstock sailing at sea, iconic classic yacht racing poster design with strong nautical colors",
  "Snoopy and Woodstock kayaking through a dramatic canyon, iconic adventure poster design with rich ochre and blue",
  "Snoopy and Woodstock watching the aurora borealis, iconic Scandinavian travel poster design with green and violet sky",
  "Snoopy and Woodstock at a Japanese torii gate path, iconic Japanese travel poster design with bold red and mist",
  "Snoopy and Woodstock at a Swiss mountain chalet in winter, iconic vintage Alpine poster design with clean geometry",
  "Snoopy and Woodstock on a cliff overlooking the ocean, iconic 1940s seaside poster design with golden horizon",
  "Snoopy and Woodstock riding bikes through a sunflower field, iconic summer poster design with vivid yellow and green",
  "Snoopy and Woodstock at the Grand Canyon at sunrise, iconic WPA national park poster design with layered red mesas",
  "Snoopy and Woodstock on a steam locomotive journey, iconic railroad travel poster design with vintage industrial style",
  "Snoopy and Woodstock at a lighthouse on a rocky coast, iconic maritime poster design with bold striped beacon",
  "Snoopy and Woodstock on a gondola in Venice, iconic 1950s Italian travel poster design with warm canal palette",
  "Snoopy and Woodstock at a Parisian street scene, iconic Belle Epoque travel poster design with impressionist charm",
  "Snoopy and Woodstock stargazing in the desert, iconic space and nature poster design with deep indigo sky",
  "Snoopy and Woodstock snowshoeing through a pine forest, iconic winter wilderness poster design with deep green and white",
  "Snoopy and Woodstock at a Greek island village, iconic 1960s Mediterranean travel poster design with white and cobalt",
  "Snoopy and Woodstock on a mountain bike trail at sunset, iconic adventure sports poster design with dramatic silhouette",
  "Snoopy and Woodstock on a beach at sunrise, iconic 1950s beach vacation poster design with sherbet sky tones",
  "Snoopy and Woodstock paragliding over Swiss valleys, iconic extreme sports poster design with aerial green and blue",
  "Snoopy and Woodstock at a Moroccan market, iconic exotic travel poster design with vivid saffron and mosaic",
  "Snoopy and Woodstock whitewater rafting through rapids, iconic outdoor adventure poster design with rushing teal water",
  "Snoopy and Woodstock ice skating on a frozen pond, iconic vintage winter holiday poster design with festive color",
  "Snoopy and Woodstock at a Hawaiian beach with palms, iconic 1940s Hawaii travel poster design with turquoise water",
  "Snoopy and Woodstock rock climbing a sheer granite face, iconic bold adventure poster design with blue sky and stone",
  "Snoopy and Woodstock dog sledding across the tundra, iconic Arctic expedition poster design with icy horizon",
  "Snoopy and Woodstock at a Tuscany vineyard at harvest, iconic Italian travel poster design with warm golden rows",
  "Snoopy and Woodstock on a safari at golden hour, iconic African travel poster design with acacia silhouette",
  "Snoopy and Woodstock at a cherry blossom festival, iconic Japanese spring poster design with soft pink and white",
  "Snoopy and Woodstock at a Norway fjord, iconic Scandinavian travel poster design with dramatic mirror water",
  "Snoopy and Woodstock at a New Zealand beach, iconic southern hemisphere travel poster design with bold surf",
  "Snoopy and Woodstock riding horseback on Monument Valley, iconic American West poster design with mesa and sky",
  "Snoopy and Woodstock snorkeling on a tropical reef, iconic dive shop poster design with bright underwater palette",
  "Snoopy and Woodstock at a Scottish highland castle, iconic Celtic travel poster design with moody mist",
  "Snoopy and Woodstock zip-lining through a jungle canopy, iconic eco-adventure poster design with lush green",
  "Snoopy and Woodstock at a Bali rice terrace at dawn, iconic Southeast Asia travel poster design with misty green layers",
  "Snoopy and Woodstock on a paddle board at sunset, iconic coastal lifestyle poster design with orange horizon",
  "Snoopy and Woodstock at Yellowstone with geysers, iconic WPA national park poster design with steam and bison",
  "Snoopy and Woodstock at a lavender field in Provence, iconic French countryside poster design with purple rows",
  "Snoopy and Woodstock at the top of the Eiffel Tower, iconic Parisian souvenir poster design with night panorama",
  "Snoopy and Woodstock at a Canadian Rockies lake, iconic wilderness lodge poster design with turquoise reflection",
  "Snoopy and Woodstock on a treehouse deck in the rainforest, iconic ecotourism poster design with canopy green",
  "Snoopy and Woodstock at Patagonia with glaciers, iconic South America travel poster design with ice and peaks",
  "Snoopy and Woodstock at a Maldives overwater bungalow, iconic luxury resort poster design with teal lagoon",
  "Snoopy and Woodstock at the northern lights over a frozen lake, iconic Arctic travel poster design with aurora green",
  "Snoopy and Woodstock at a Dutch windmill in spring, iconic Netherlands travel poster design with tulip field",
  "Snoopy and Woodstock releasing sky lanterns at night, iconic festival poster design with warm glowing sky",
  "Snoopy and Woodstock on a Matterhorn ridge, iconic 1930s mountaineering poster design with stark alpine peak",
  "Snoopy and Woodstock at a Kyoto bamboo grove, iconic Japanese nature poster design with vertical green columns",
  "Snoopy and Woodstock at a Santorini sunset, iconic Greek island poster design with blue dome and gold sky",
  "Snoopy and Woodstock at a Nova Scotia lighthouse, iconic Canadian maritime poster design with red and white",
  "Snoopy and Woodstock at an Icelandic volcano landscape, iconic natural wonder poster design with raw terrain",
  "Snoopy and Woodstock at a Mexican Day of the Dead celebration, iconic folk art poster design with marigold color",
  "Snoopy and Woodstock at a Redwood National Park trail, iconic WPA national park poster design with giant trees",
  "Snoopy and Woodstock at a Taj Mahal reflecting pool, iconic India travel poster design with marble and garden",
  "Snoopy and Woodstock at a Pacific Coast Highway road trip, iconic California drive poster design with coastal bluffs",
  "Snoopy and Woodstock at a Colorado ski resort, iconic 1970s ski mountain poster design with retro bold type treatment",
  "Snoopy and Woodstock at a Yosemite meadow with El Capitan, iconic WPA national park poster design with granite dome",
  "Snoopy and Woodstock at a winter Christmas market, iconic vintage holiday poster design with lantern and snow",
  "Snoopy and Woodstock at a Serengeti sunset with giraffe silhouette, iconic African wildlife poster design",
  "Snoopy and Woodstock at a Polynesian island outrigger canoe, iconic South Pacific poster design with coral sea",
  "Snoopy and Woodstock at a Cape Cod clam shack, iconic New England travel poster design with navy and sand",
  "Snoopy and Woodstock at a Bavarian mountain lake, iconic German travel poster design with clean graphic style",
  "Snoopy and Woodstock at a Joshua Tree desert night, iconic American Southwest poster design with moon and cacti",
  "Snoopy and Woodstock at a Vietnamese rice paddy at sunrise, iconic Southeast Asia travel poster design with conical hats",
  "Snoopy and Woodstock at a Crater Lake overlook, iconic WPA national park poster design with deep sapphire water",
  "Snoopy and Woodstock at a Lake Como villa, iconic Italian Riviera travel poster design with cypress and blue water",
  "Snoopy and Woodstock at a Bryce Canyon hoodoo trail, iconic national park poster design with red spire silhouettes",
  "Snoopy and Woodstock at a Kerala backwater houseboat, iconic India travel poster design with lush green water",
  "Snoopy and Woodstock at a Maine lobster boat at dawn, iconic New England fishing poster design with mist and harbor",
  "Snoopy and Woodstock at a Peruvian Andes mountain village, iconic South America travel poster design with bright textiles",
  "Snoopy and Woodstock at a Galway coastal pub exterior, iconic Irish travel poster design with green and stone",
  "Snoopy and Woodstock at a Barcelona rooftop view, iconic Spanish travel poster design with mosaic and warm sky",
  "Snoopy and Woodstock at a Hungarian hot spring bath, iconic Central Europe spa poster design with ornate arch",
  "Snoopy and Woodstock at a Glacier National Park lake, iconic WPA national park poster design with mountain reflection",
  "Snoopy and Woodstock at a Zion Canyon slot canyon, iconic national park poster design with glowing orange light",
  "Snoopy and Woodstock at a Havana street scene, iconic Cuban travel poster design with bright pastel architecture",
  "Snoopy and Woodstock at a Stockholm archipelago island, iconic Nordic summer poster design with red cottage",
  "Snoopy and Woodstock at a Acadia National Park rocky shore, iconic WPA national park poster design with Atlantic coast",
  "Snoopy and Woodstock at a Blue Ridge Parkway overlook, iconic Appalachian travel poster design with layered ridge",
  "Snoopy and Woodstock at a Phuket sea cliff beach, iconic Thailand travel poster design with emerald water",
  "Snoopy and Woodstock at a Great Smoky Mountains trail, iconic WPA national park poster design with misty ridgeline",
  "Snoopy and Woodstock at a Welsh castle on a coast, iconic British heritage poster design with green and stone",
  "Snoopy and Woodstock at a Lake Bled island church, iconic Slovenian travel poster design with fairy tale reflection",
  "Snoopy and Woodstock at a Cinque Terre cliffside village, iconic Italian Riviera poster design with colorful facade",
  "Snoopy and Woodstock at a Lofoten Islands fishing village, iconic Norwegian travel poster design with red cabin and snow",
  "Snoopy and Woodstock at a Sequoia National Park giant, iconic WPA national park poster design with massive trunk",
  "Snoopy and Woodstock at an Outer Banks lighthouse, iconic North Carolina travel poster design with striped tower",
  "Snoopy and Woodstock at a Rio Carnival street scene, iconic Brazilian travel poster design with vivid feather colors",
  "Snoopy and Woodstock at a Yellowknife aurora camp, iconic Canadian north poster design with green sky shimmer",
  "Snoopy and Woodstock at a Death Valley dunes, iconic WPA national park poster design with stark sand and shadow",
  "Snoopy and Woodstock at a Croatian island sailboat, iconic Adriatic travel poster design with terracotta and blue",
  "Snoopy and Woodstock at an Olympic National Park rainforest, iconic WPA national park poster design with moss and fern",
  "Snoopy and Woodstock at a Marrakech rooftop at sunset, iconic North Africa travel poster design with warm orange",
  "Snoopy and Woodstock at a Banff winter ski slope, iconic Canadian Rockies poster design with bold peak and powder",
  "Snoopy and Woodstock at a Blue Lagoon Iceland geothermal spa, iconic Nordic poster design with milky teal water",
  "Snoopy and Woodstock at a Napa Valley vineyard harvest, iconic California wine country poster design with golden vines",
  "Snoopy and Woodstock at a Corcovado peak view in Rio, iconic Brazil travel poster design with jungle and bay",
  "Snoopy and Woodstock at a Dolomites mountain refuge hut, iconic Italian Alps poster design with stark rocky peaks",
  "Snoopy and Woodstock at a Florida Keys sunset bridge, iconic American road trip poster design with pastel sky",
  "Snoopy and Woodstock at a Newfoundland puffin colony, iconic Canadian wildlife poster design with sea cliffs",
  "Snoopy and Woodstock at a Kenya savanna with lion, iconic African safari poster design with warm horizon",
  "Snoopy and Woodstock at a Lake Baikal winter ice, iconic Russian natural wonder poster design with vast white",
  "Snoopy and Woodstock at a Faroe Islands cliff walk, iconic North Atlantic travel poster design with fog and green",
  "Snoopy and Woodstock at a Plitvice Lakes waterfall, iconic Croatian travel poster design with turquoise cascade",
  "Snoopy and Woodstock at an Edinburgh Castle hill, iconic Scottish travel poster design with dramatic skyline",
  "Snoopy and Woodstock at an Iguazu Falls overlook, iconic South America natural wonder poster design with rainforest mist",
  "Snoopy and Woodstock at an Arizona meteor crater, iconic American Southwest adventure poster design with vast bowl",
  "Snoopy and Woodstock at a South Island New Zealand fjord, iconic Kiwi travel poster design with mirror water",
  "Snoopy and Woodstock at a Kenai Fjords glacier calve, iconic Alaska travel poster design with ice and sea",
  "Snoopy and Woodstock at a Puglia trulli village in Italy, iconic Italian folk architecture poster design with whitewash",
  "Snoopy and Woodstock at a Cotopaxi volcano crater hike, iconic Ecuador mountain poster design with snow cap and plain",
  "Snoopy and Woodstock at a Laos Mekong river longboat, iconic Southeast Asia travel poster design with temple and mist",
  "Snoopy and Woodstock at a Trinidad Carnival costume parade, iconic Caribbean festival poster design with jewel colors",
  "Snoopy and Woodstock at a Madeira levada walk, iconic Portuguese island poster design with lush gorge and trail",
  "Snoopy and Woodstock at a Trans-Siberian railway winter window, iconic Russian rail travel poster design with taiga",
  "Snoopy and Woodstock at a Atacama Desert starfield, iconic Chile astronomy poster design with violet sky and telescope",
  "Snoopy and Woodstock at an Amalfi Coast cliff drive, iconic Italian coastal poster design with winding road and sea",
  "Snoopy and Woodstock at a Mekong Delta sampan boat, iconic Vietnam travel poster design with lotus and reflections",
  "Snoopy and Woodstock at a Salar de Uyuni mirror sky, iconic Bolivia salt flat poster design with perfect reflection",
  "Snoopy and Woodstock at a Pamukkale travertine pool, iconic Turkey natural wonder poster design with white terraces",
  "Snoopy and Woodstock at a Tbilisi old town balcony, iconic Georgian travel poster design with carved wood and vines",
  "Snoopy and Woodstock at a Torres del Paine trek, iconic Chilean Patagonia poster design with jagged granite towers",
  "Snoopy and Woodstock at a Quebec City winter carnival, iconic French Canadian poster design with ice palace",
  "Snoopy and Woodstock at a Luang Prabang monk parade, iconic Laos spiritual poster design with saffron at dawn",
  "Snoopy and Woodstock at a Kotor Bay Montenegro fortress, iconic Adriatic poster design with medieval walls and sea",
  "Snoopy and Woodstock at a Meteora cliff monastery, iconic Greek wonder poster design with rock spire and golden sky",
  "Snoopy and Woodstock at a Seville flamenco street, iconic Spanish culture poster design with red and warm shadow",
  "Snoopy and Woodstock at a Zhangjiajie avatar peak, iconic Chinese landscape poster design with floating pillar mist",
  "Snoopy and Woodstock at a Hallstatt lake village Austria, iconic Alpine village poster design with steeple reflection",
  "Snoopy and Woodstock at a Skeleton Coast shipwreck Namibia, iconic desert wilderness poster design with bleached hull",
  "Snoopy and Woodstock at a Trolltunga cliff Norway, iconic extreme hiking poster design with free-hanging rock",
  "Snoopy and Woodstock at a Colosseum Rome at dusk, iconic Italian ancient monument poster design with golden ruin",
  "Snoopy and Woodstock at an Angkor Wat sunrise Cambodia, iconic ancient temple poster design with lotus moat",
  "Snoopy and Woodstock at a Sahara camel caravan at sunrise, iconic North Africa travel poster design with dune shadows",
  "Snoopy and Woodstock at a Jordan Petra treasury at dusk, iconic Middle East ancient wonder poster design with rose stone",
  "Snoopy and Woodstock at a Havasupai blue waterfall, iconic Arizona hidden gem poster design with vivid turquoise",
  "Snoopy and Woodstock at a Reine Norway village at dawn, iconic Lofoten poster design with still harbour reflection",
  "Snoopy and Woodstock at a Waitomo glowworm cave, iconic New Zealand natural wonder poster design with blue starfield cave",
  "Snoopy and Woodstock at an Antelope Canyon light beam, iconic Arizona slot canyon poster design with warm sculpted walls",
  "Snoopy and Woodstock at a wave pool desert geological formation, iconic natural wonder poster design with swirling sandstone",
  "Snoopy and Woodstock at a Sossusvlei red dune climb at sunrise, iconic Namibia desert poster design with stark orange",
  "Snoopy and Woodstock at a Giant's Causeway coastal walk, iconic Northern Ireland natural wonder poster design",
  "Snoopy and Woodstock at a Cappadocia balloon sunrise, iconic Turkey travel poster design with stone formations below",
  "Snoopy and Woodstock at a Lake Atitlan Guatemala volcano sunrise, iconic Central America travel poster design",
  "Snoopy and Woodstock at a Bhutan Tiger's Nest monastery cliff, iconic Himalayan travel poster design with prayer flags",
  "Snoopy and Woodstock at a Mozambique coral island beach, iconic East Africa travel poster design with clear sea",
  "Snoopy and Woodstock at a Kamchatka volcano landscape Russia, iconic far east adventure poster design with geothermal",
  "Snoopy and Woodstock at a Borneo jungle canopy walkway, iconic Southeast Asia wildlife poster design with orangutan",
  "Snoopy and Woodstock at a Galápagos Islands sea turtle swim, iconic Ecuador wildlife poster design with pristine sea",
  "Snoopy and Woodstock at a Milford Sound fjord New Zealand, iconic southern fiord poster design with sheer cliff",
  "Snoopy and Woodstock at a Prince Edward Island red beach, iconic Maritime Canada poster design with green cliff",
  "Snoopy and Woodstock at a Namib desert oryx dawn, iconic African wildlife poster design with sand sea horizon",
  "Snoopy and Woodstock at an Outer Hebrides white beach, iconic Scottish island poster design with turquoise Atlantic",
  "Snoopy and Woodstock at a Svalbard polar expedition, iconic High Arctic poster design with polar bear and ice",
  "Snoopy and Woodstock at a Reunion Island volcanic beach, iconic French island travel poster design with black sand",
  "Snoopy and Woodstock at a Lencois Maranhenses white dune lagoon, iconic Brazil natural wonder poster design",
  "Snoopy and Woodstock at a Vanuatu volcanic island, iconic South Pacific adventure poster design with lava glow",
  "Snoopy and Woodstock at a Socotra island dragon blood tree, iconic Yemen natural wonder poster design with alien landscape",
  "Snoopy and Woodstock at a Hamnoy Norway red fishing hut, iconic Norwegian coastal poster design with aurora sky",
  "Snoopy and Woodstock at a Picos de Europa mountain Spain, iconic Spanish hiking poster design with limestone peaks",
  "Snoopy and Woodstock at a Sichuan panda reserve China, iconic wildlife conservation poster design with bamboo forest",
  "Snoopy and Woodstock at a Daintree Rainforest Australia, iconic Queensland natural wonder poster design with lush green",
  "Snoopy and Woodstock at a Mergui Archipelago Myanmar, iconic remote island poster design with jade water and karst",
  "Snoopy and Woodstock at a Tsingy de Bemaraha Madagascar, iconic African natural wonder poster design with stone forest",
  "Snoopy and Woodstock at a Silfra snorkeling Iceland tectonic rift, iconic Iceland adventure poster design with clear blue",
  "Snoopy and Woodstock at a Jiuzhaigou valley autumn China, iconic UNESCO natural park poster design with rainbow lakes",
  "Snoopy and Woodstock at a Rapa Nui Easter Island moai, iconic Pacific mystery poster design with stone figures at sunset",
  "Snoopy and Woodstock at a Guilin karst mountain river China, iconic Li River poster design with misty peaks",
  "Snoopy and Woodstock at a Dalmatian coast sailing Croatia, iconic Adriatic summer poster design with sailboat and islands",
  "Snoopy and Woodstock at a Black Hills Badlands South Dakota, iconic WPA national park poster design with eroded spires",
  "Snoopy and Woodstock at a Connemara wild Atlantic way Ireland, iconic Irish coastal poster design with drama and green",
  "Snoopy and Woodstock at a Samarkand Registan mosque Uzbekistan, iconic Silk Road travel poster design with mosaic dome",
  "Snoopy and Woodstock at a Phi Phi Island Thailand cliff view, iconic Thai travel poster design with emerald lagoon",
  "Snoopy and Woodstock at a Point Reyes National Seashore California, iconic coastal WPA poster design with lighthouse",
  "Snoopy and Woodstock at a South Downs England chalk cliff, iconic British coastal poster design with white face and sea",
  "Snoopy and Woodstock at a Loire Valley chateau France, iconic French heritage poster design with garden and turrets",
  "Snoopy and Woodstock at a Raja Ampat Indonesia coral island, iconic dive paradise poster design with aqua and green",
  "Snoopy and Woodstock at a Lapland reindeer sleigh at dusk, iconic winter fantasy poster design with golden trees and snow",
  "Snoopy and Woodstock at a Oia cliff sunset Santorini, iconic Greek island dusk poster design with warm orange dome",
  "Snoopy and Woodstock at a Big Sur ocean cliff California, iconic Pacific Coast Highway poster design with epic drop",
  "Snoopy and Woodstock at a Wadi Rum desert Jordan at night, iconic Middle East desert poster design with Mars-like landscape",
  "Snoopy and Woodstock at a Highlands lochan Scotland at dawn, iconic Scottish mist poster design with pink sky reflection",
  "Snoopy and Woodstock at a Shenandoah Valley spring bloom, iconic WPA national park poster design with dogwood blossom",
  "Snoopy and Woodstock at a Kauai Na Pali coast sea cliff, iconic Hawaii natural wonder poster design with jagged emerald ridge",
  "Snoopy and Woodstock at a Cinnabar Lake Montana, iconic Montana wilderness poster design with glassy alpine water",
  "Snoopy and Woodstock at a Channel Islands National Park sea cave, iconic WPA national park poster design with kelp forest blue",
  "Snoopy and Woodstock at a Great Sand Dunes Colorado, iconic WPA national park poster design with golden dune and mountain",
  "Snoopy and Woodstock at a Pinnacles National Park rock formation, iconic WPA national park poster design with volcanic spire",
  "Snoopy and Woodstock at a North Cascades glacier peak, iconic WPA national park poster design with jagged ice and forest",
  "Snoopy and Woodstock at a Guadalupe Mountains Texas high point, iconic WPA national park poster design with desert ridge",
  "Snoopy and Woodstock at a Cumberland Island wild horses Georgia, iconic WPA national park poster design with beach and horses",
  "Snoopy and Woodstock at a Dry Tortugas Fort Jefferson from the air, iconic WPA national park poster design with turquoise shallows",
  "Snoopy and Woodstock at a Lassen Volcanic Park boiling mudpot, iconic WPA national park poster design with steam and sky",
  "Snoopy and Woodstock at a Big Bend Texas river canyon, iconic WPA national park poster design with Santa Elena canyon walls",
  "Snoopy and Woodstock at a Voyageurs National Park night sky Minnesota, iconic WPA national park poster design with lake and stars",
];

const ALL_VARIANTS = [96924,96925,96926,96927,96928,96929,96930,96931,96932,96933,96934,96935,96936,96937,96938,96939,96940,96941,96942,96943,96944,96945,96946,96947,96948,96949,96950,96951,96952,96953,96954,96956,96957,96958];
const VERTICAL_VARIANTS = [
  { id: 96926, w: 2365, h: 2955, price: 5500 },
  { id: 96930, w: 2955, h: 3546, price: 7000 },
  { id: 96944, w: 4727, h: 5920, price: 10000 },
  { id: 96946, w: 5920, h: 7101, price: 13000 },
  { id: 96956, w: 7101, h: 8884, price: 17000 },
  { id: 96958, w: 8858, h: 11811, price: 24000 },
];

function pickPrompts() {
    var shuffled = PROMPTS.slice().sort(function() { return Math.random() - 0.5; });
    return shuffled.slice(0, 5);
}

async function retry(fn, retries, delay) {
    retries = retries || 3; delay = delay || 15000;
    for (var i = 0; i < retries; i++) {
        try { return await fn(); }
        catch (err) {
            console.error("Attempt " + (i+1) + " failed: " + err.message);
            if (i < retries-1) { console.log("Retrying in " + (delay/1000) + "s..."); await new Promise(function(r){setTimeout(r,delay);}); }
            else throw err;
        }
    }
}

async function cropToVertical(base64Data) {
    var sharp = require("sharp");
    var inputBuffer = Buffer.from(base64Data, "base64");
    var metadata = await sharp(inputBuffer).metadata();
    var width = metadata.width, height = metadata.height;
    var targetRatio = 4/5, currentRatio = width/height;
    var cropWidth, cropHeight, left, top;
    if (currentRatio > targetRatio) {
        cropHeight = height; cropWidth = Math.floor(height * targetRatio);
        left = Math.floor((width - cropWidth) / 2); top = 0;
    } else {
        cropWidth = width; cropHeight = Math.floor(width / targetRatio);
        left = 0; top = Math.floor((height - cropHeight) / 2);
    }
    // Output 2400x3000 — slightly larger than print area so image bleeds past edges, no white strip
    var outputBuffer = await sharp(inputBuffer)
        .extract({ left: left, top: top, width: cropWidth, height: cropHeight })
        .resize(2400, 3000)
        .jpeg({ quality: 92 })
        .toBuffer();
    console.log("Image cropped to 4:5 (" + width + "x" + height + " -> 2400x3000)");
    return outputBuffer.toString("base64");
}

async function generateListing(prompt) {
    console.log("Generating listing content...");
    var isAlbumPrompt = prompt.toLowerCase().includes("album cover");
    var copyrightNote = isAlbumPrompt
        ? "\n\nCRITICAL COPYRIGHT RULE: Do NOT include any real musician names, band names, or album titles anywhere in the title, description, or tags. Describe the scene generically (e.g. a famous music legend, an iconic rock crossing, a legendary concept album style) without naming the artist or album."
        : "";
    var res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + NB_API_KEY,
        {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Based on this Snoopy art description: \"" + prompt + "\"\n\nGenerate an optimized Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n \"title\": \"Etsy title under 80 chars. Format: Snoopy [Scene] Canvas Print Peanuts [Theme] Wall Decor. NO dashes, NO hyphens, NO special characters.\",\n \"description\": \"3 engaging paragraphs about this specific artwork scene, the canvas print quality, and who would love it as a gift.\",\n \"tags\": [\"exactly 13 tags, each under 20 characters, focused on Snoopy Peanuts and the specific scene\"]\n}\n\nCRITICAL RULE: Do NOT use the words 'Peanut', 'Peanuts', 'peanut', or 'peanuts' anywhere in the title, description, or tags. Instead use only generic terms like 'cartoon dog', 'cartoon characters', 'beagle', 'classic cartoon', or 'animated duo'." + copyrightNote }] }],
                generationConfig: { responseModalities: ["TEXT"] }
            })
        }
    );
    var data = await res.json();
    var text = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (!text) throw new Error("Listing generation failed: " + JSON.stringify(data));
    var clean = text.replace(/```json|```/g, "").trim();
    var listing = JSON.parse(clean);
        // Post-processing: strip/replace any peanut/peanuts references (case-insensitive)
        var peanutRe = /peanuts?/gi;
        var peanutReplace = 'classic cartoon';
        if (listing.title) listing.title = listing.title.replace(peanutRe, peanutReplace);
        if (listing.description) listing.description = listing.description.replace(peanutRe, peanutReplace);
        if (Array.isArray(listing.tags)) {
                    listing.tags = listing.tags.map(function(tag) { return tag.replace(peanutRe, peanutReplace); });
        }
    var validTags = ["Snoopy wall art","Peanuts poster","Woodstock print","Snoopy gift","Peanuts decor","cartoon art print","Snoopy canvas","kids room art","Peanuts fan gift","Snoopy lover","beagle wall art","nursery art","Peanuts artwork","Snoopy print","Peanuts wall art","Snoopy home decor","Woodstock art","Peanuts gift","cartoon canvas","Snoopy art print"];
    if (!listing.tags || !Array.isArray(listing.tags) || listing.tags.length === 0) {
        listing.tags = validTags.slice(0, 13);
    } else {
        var filtered = listing.tags.filter(function(t){ return t && t.length <= 20 && t.length > 0; });
        while (filtered.length < 13) {
            var fallback = validTags[filtered.length % validTags.length];
            if (filtered.indexOf(fallback) === -1) filtered.push(fallback);
            else filtered.push("Snoopy art " + filtered.length);
        }
        listing.tags = filtered.slice(0, 13);
    }
    console.log("Listing generated:", listing.title);
    return listing;
}

async function generateImage(prompt) {
    console.log("Generating image...");
    var isCartoonRealBg = prompt.startsWith("Cartoon Snoopy and Woodstock") && prompt.toLowerCase().includes("realistic background");
    var isAllCartoon    = prompt.startsWith("Cartoon Snoopy and Woodstock") && prompt.toLowerCase().includes("cartoon world");
    var isPainting      = prompt.toLowerCase().includes("iconic painting");
    var isArtStyle      = prompt.toLowerCase().includes("art style painting");
    var isPoster        = prompt.toLowerCase().includes("poster design");
    var suffix;
    if (isCartoonRealBg) {
        suffix = " Generate as a tall vertical 4:5 artwork. "
            + "Snoopy and Woodstock must be drawn in a clean, expressive cartoon illustration style — bold outlines, flat colors, classic Peanuts character feel. "
            + "The background must be a fully hyper-realistic photographic scene with cinematic lighting, rich detail, and natural depth. "
            + "The cartoon characters should be composited naturally into the realistic environment. "
            + "Fill the ENTIRE frame edge to edge — zero white space, zero borders. No text, no words, no letters.";
    } else if (isAllCartoon) {
        suffix = " Generate as a tall vertical 4:5 cartoon illustration. "
            + "Everything — characters AND background — must be in a fun, colorful, expressive cartoon style. "
            + "Bright saturated colors, clean bold outlines, playful composition, fully cartoon world. "
            + "Fill the ENTIRE frame edge to edge — zero white space, zero borders. No text, no words, no letters.";
    } else if (isPainting) {
        suffix = " Generate as a tall 4:5 vertical fine art painting. "
            + "Faithfully recreate this famous painting in the original artist's exact style, brushwork, color palette, and composition. "
            + "Replace the original human figures or central subject with Snoopy and Woodstock inserted naturally into the scene. "
            + "Preserve all other details — background, lighting, mood, texture — as close to the original as possible. "
            + "Fill the ENTIRE frame edge to edge. No text, no words, no letters, no signatures.";
    } else if (isArtStyle) {
        suffix = " Generate as a tall 4:5 vertical artwork in the specified art style. "
            + "Apply the named art style's authentic technique, color palette, texture, and compositional conventions with accuracy. "
            + "Snoopy and Woodstock are the central subjects rendered completely in that style. "
            + "Fill the ENTIRE frame edge to edge. No text, no words, no letters.";
    } else if (isPoster) {
        suffix = " Generate as a tall vertical 4:5 iconic poster. "
            + "Design in the style of a legendary vintage poster — think WPA national park posters, classic 1930s-1960s travel posters, or iconic adventure prints. "
            + "Bold, graphic composition with a strong focal point, rich colors, flat color areas, and a dramatic sense of place. "
            + "Snoopy and Woodstock are integrated naturally as the heroes of the scene. "
            + "Fill the ENTIRE frame edge to edge. ABSOLUTELY NO TEXT, no words, no title, no letters, no numbers anywhere.";
    } else {
        suffix = " Generate as a tall vertical portrait artwork in 4:5 aspect ratio. "
            + "Fill the ENTIRE frame edge to edge. No text, no words, no letters.";
    }
    var res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + NB_API_KEY,
        {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt + suffix }] }],
                generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
            })
        }
    );
    var rawText2 = await res.text();
    var data;
    try { data = JSON.parse(rawText2); } catch(e) { throw new Error("Image generation failed (non-JSON, status " + res.status + "): " + rawText2.substring(0, 200)); }
    var parts = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    var imagePart = parts && parts.find(function(p){ return p.inlineData; });
    if (!imagePart) throw new Error("Image generation failed: " + JSON.stringify(data));
    console.log("Image generated successfully");
    return await cropToVertical(imagePart.inlineData.data);
}

async function uploadToPrintify(base64Data) {
    console.log("Uploading image to Printify...");
    var res = await fetch("https://api.printify.com/v1/uploads/images.json", {
        method: "POST", headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ file_name: "canvas_" + Date.now() + ".jpg", contents: base64Data })
    });
    var rawText = await res.text();
    var data;
    try { data = JSON.parse(rawText); } catch(e) { throw new Error("Upload failed (non-JSON, status " + res.status + "): " + rawText.substring(0, 200)); }
    if (!data.id) throw new Error("Upload failed: " + JSON.stringify(data));
    console.log("Uploaded, image ID:", data.id);
    return data.id;
}

async function createProduct(imageId, listing) {
    console.log("Creating Printify product...");
    var enabledIds = new Set(VERTICAL_VARIANTS.map(function(v){ return v.id; }));
    var priceMap = {};
    VERTICAL_VARIANTS.forEach(function(v){ priceMap[v.id] = v.price; });
    var variants = ALL_VARIANTS.map(function(id){ return { id: id, is_enabled: enabledIds.has(id), price: enabledIds.has(id) ? priceMap[id] : 500 }; });
    var print_areas = [{ variant_ids: VERTICAL_VARIANTS.map(function(v){ return v.id; }), placeholders: [{ position: "front", images: [{ id: imageId, x: 0.5, y: 0.5, scale: 1.5, angle: 0 }] }] }];
    var res = await fetch("https://api.printify.com/v1/shops/" + SHOP_ID + "/products.json", {
        method: "POST", headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ title: listing.title, description: listing.description, tags: listing.tags, blueprint_id: BLUEPRINT_ID, print_provider_id: PRINT_PROVIDER_ID, variants: variants, print_areas: print_areas, images: [{ id: imageId, x: 0.5, y: 0.5, scale: 1.0, angle: 0, is_default: true, is_selected_for_publishing: true, position: "front", variant_ids: VERTICAL_VARIANTS.map(function(v){ return v.id; }) }] })
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
    if (isPublishedToEtsy(product)) { console.log('Product ' + productId + ' already on Etsy — skipping.'); return false; }
    if (product.is_locked) { console.log('Product ' + productId + ' is locked — skipping.'); return false; }
    console.log("Publishing to Etsy...");
    var body = JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true, keyFeatures: false, shipping_template: true });
    var attempt = 1, triggerOk = false;
    while (attempt <= 3 && !triggerOk) {
        console.log("Publish attempt " + attempt + "...");
        var res = await fetch("https://api.printify.com/v1/shops/" + SHOP_ID + "/products/" + productId + "/publish.json", { method: "POST", headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" }, body: body });
        var resText = await res.text();
        console.log("Publish response (status " + res.status + "): " + resText);
        if (res.status === 200) { triggerOk = true; }
        else { if (attempt < 3) await new Promise(function(r){ setTimeout(r, 20000); }); attempt++; }
    }
    if (!triggerOk) throw new Error("Publish trigger failed after 3 attempts");
    console.log("Polling for Etsy listing ID (up to 6 min)...");
    for (var i = 0; i < 24; i++) {
        await new Promise(function(r){ setTimeout(r, 15000); });
        var p = await getProduct(productId);
        var externalId = p.external && p.external.id;
        console.log("Poll " + (i+1) + "/24: external.id=" + (externalId || "none") + " locked=" + p.is_locked);
        if (externalId) return true;
        if (p.publishing_status === "failed") throw new Error("Publishing failed — check Printify→Etsy connection");
    }
    console.log("\u2713 Treating as published (external.id sync delay). Product should be live on Etsy shortly.");
    return true;
}

async function toggleOffsiteAds(productId, options) {
    options = options || {};
    var mod = getOffsiteAdsModule();
    if (!mod) return;
    var enable = options.enable !== undefined ? options.enable : OFFSITE_ADS_ENABLED;
    console.log('\n[automation] ' + (enable ? 'Enabling' : 'Disabling') + ' offsite ads for ' + productId + '...');
    try {
        if (!options.skipPublishWait) await new Promise(function(r){ setTimeout(r, 10000); });
        var result = await mod.setOffsiteAds(productId, enable, { retries: 3 });
        console.log('[automation] \u2713 Offsite ads ' + (result.newState ? 'ENABLED' : 'DISABLED') + (result.changed ? '' : ' (no change)') + ' for ' + productId);
    } catch (err) {
        console.error('[automation] \u2717 Offsite ads toggle failed for ' + productId + ': ' + err.message);
    }
}

async function processExistingProducts(allProducts, adsEnable) {
    var adsState = adsEnable !== undefined ? adsEnable : OFFSITE_ADS_ENABLED;
    var canvas = allProducts.filter(isCanvasProduct);
    var onEtsy = canvas.filter(isPublishedToEtsy);
    var drafts = canvas.filter(function(p){ return !isPublishedToEtsy(p) && !p.is_locked; });
    console.log('Shop scan: ' + canvas.length + ' canvas, ' + onEtsy.length + ' on Etsy, ' + drafts.length + ' drafts\n');
    var toggledOnly = [];
    if (!TOGGLE_ALL_ETSY_PUBLISHED) { console.log('TOGGLE_ALL_ETSY_PUBLISHED=false — skipping ads sync.\n'); return { onEtsy, drafts, toggledOnly }; }
    for (var i = 0; i < onEtsy.length; i++) {
        var p = onEtsy[i];
        console.log('\n\u2550\u2550\u2550 Already on Etsy (' + (i+1) + '/' + onEtsy.length + ') \u2550\u2550\u2550');
        console.log('Product:', p.id, '|', (p.title || '').substring(0, 60));
        try { await toggleOffsiteAds(p.id, { skipPublishWait: true, enable: adsState }); toggledOnly.push(p.id); if (i < onEtsy.length-1) await new Promise(function(r){ setTimeout(r, 3000); }); }
        catch (err) { console.error('\u2717 Ads toggle failed:', err.message); }
    }
    return { onEtsy, drafts, toggledOnly };
}

async function processUnpublishedDrafts(drafts, maxCount, adsEnable) {
    var adsState = adsEnable !== undefined ? adsEnable : OFFSITE_ADS_ENABLED;
    var publishedNow = [];
    var toProcess = drafts.slice(0, maxCount);
    for (var i = 0; i < toProcess.length; i++) {
        var p = toProcess[i];
        console.log('\n\u2550\u2550\u2550 Unpublished draft (' + (i+1) + '/' + toProcess.length + ') \u2550\u2550\u2550');
        console.log('Product:', p.id, '|', (p.title || '').substring(0, 60));
        try {
            var didPublish = await publishToEtsy(p.id);
            if (didPublish) { console.log('\u2713 Published:', p.id); publishedNow.push(p.id); }
            await toggleOffsiteAds(p.id, { skipPublishWait: !didPublish, enable: adsState });
            if (i < toProcess.length-1) await new Promise(function(r){ setTimeout(r, 10000); });
        } catch (err) { console.error('\u2717 Draft ' + p.id + ' failed:', err.message); }
    }
    return publishedNow;
}

async function runAdsOnly(enable) {
    require('./config').validateForPlaywright();
    console.log('\nAds-only mode — Target: ads ' + (enable ? 'ON' : 'OFF') + '\n');
    var allProducts = await fetchAllShopProducts();
    var onEtsy = allProducts.filter(isCanvasProduct).filter(isPublishedToEtsy);
    if (onEtsy.length === 0) { console.log('No canvas products on Etsy found.'); var m = getOffsiteAdsModule(); if (m) await m.closeBrowser(); return; }
    var toggled = [];
    for (var i = 0; i < onEtsy.length; i++) {
        var p = onEtsy[i];
        console.log('\n--- ' + (i+1) + '/' + onEtsy.length + ' --- ' + p.id + ' ' + (p.title||'').substring(0,50));
        try { await toggleOffsiteAds(p.id, { skipPublishWait: true, enable: enable }); toggled.push(p.id); if (i < onEtsy.length-1) await new Promise(function(r){ setTimeout(r, 3000); }); }
        catch (err) { console.error('Failed:', err.message); }
    }
    var mod = getOffsiteAdsModule(); if (mod) await mod.closeBrowser();
    console.log('\nDone. Ads ' + (enable ? 'ON' : 'OFF') + ' for ' + toggled.length + '/' + onEtsy.length + ' product(s).');
}

async function run() {
    var validate = require('./config').validateForPipeline;
    try { validate(); } catch(e) { if (String(e.message).indexOf('NB_API_KEY') >= 0 && SKIP_NEW_LISTINGS) { require('./config').validateForPlaywright(); } else throw e; }
    try { require("sharp"); } catch(e) { require("child_process").execSync("npm install sharp", { stdio: "inherit" }); }
    console.log('Offsite ads: ' + (OFFSITE_ADS_ENABLED ? 'ENABLED' : 'DISABLED'));
    console.log('Daily new listings: ' + DAILY_NEW_LISTINGS);
    if (SKIP_NEW_LISTINGS) console.log('SKIP_NEW_LISTINGS=true\n');
    var allProducts = await fetchAllShopProducts();
    var existing = await processExistingProducts(allProducts);
    var newSlots = SKIP_NEW_LISTINGS ? 0 : DAILY_NEW_LISTINGS;
    var draftSlots = Math.min(existing.drafts.length, newSlots);
    var publishedFromDrafts = [];
    if (draftSlots > 0) {
        console.log('\nPublishing ' + draftSlots + ' draft(s) first...');
        publishedFromDrafts = await processUnpublishedDrafts(existing.drafts, draftSlots);
        newSlots -= publishedFromDrafts.length;
    }
    var createdNew = [], publishedNew = [];
    if (newSlots > 0) {
        var prompts = pickPrompts().slice(0, newSlots);
        console.log('\nCreating ' + prompts.length + ' new listing(s)\n');
        for (var i = 0; i < prompts.length; i++) {
            var prompt = prompts[i];
            console.log('\n\u2550\u2550\u2550 New listing ' + (i+1) + ' of ' + prompts.length + ' \u2550\u2550\u2550');
            console.log('Prompt:', prompt.substring(0, 100));
            try {
                var listing = await retry(function(){ return generateListing(prompt); });
                var base64Img = await retry(function(){ return generateImage(prompt); });
                var imageId = await uploadToPrintify(base64Img);
                var productId = await createProduct(imageId, listing);
                createdNew.push(productId);
                await new Promise(function(r){ setTimeout(r, 15000); });
                var didPublish = await publishToEtsy(productId);
                if (didPublish) { console.log('\u2713 Live on Etsy! Product ID:', productId); publishedNew.push(productId); }
                await toggleOffsiteAds(productId, { skipPublishWait: !didPublish, enable: OFFSITE_ADS_ENABLED });
                if (i < prompts.length-1) await new Promise(function(r){ setTimeout(r, 10000); });
            } catch(err) { console.error('\u2717 Listing ' + (i+1) + ' failed:', err.message); }
        }
    } else if (!SKIP_NEW_LISTINGS) {
        console.log('\nNo new listings to create.');
    }
    var mod = getOffsiteAdsModule(); if (mod) await mod.closeBrowser();
    console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 Done! \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
    console.log(' On Etsy (ads only)  : ' + existing.toggledOnly.length);
    console.log(' Drafts published    : ' + publishedFromDrafts.length);
    console.log(' New products created: ' + createdNew.length);
    console.log(' New live on Etsy    : ' + publishedNew.length);
    if (createdNew.length > publishedNew.length) {
        var unpublished = createdNew.filter(function(id){ return publishedNew.indexOf(id) === -1; });
        console.log(' \u26a0 Saved as drafts   : ' + unpublished.join(', '));
        console.log(' \u26a0 To fix: reconnect Etsy in Printify \u2192 Sales Channels');
    }
    if (existing.toggledOnly.length) console.log(' Ads toggled         : ' + existing.toggledOnly.join(', '));
    if (publishedFromDrafts.length) console.log(' Published from drafts: ' + publishedFromDrafts.join(', '));
    if (publishedNew.length) console.log(' New product IDs     : ' + publishedNew.join(', '));
}

var cliArgs = process.argv.slice(2);
if (cliArgs.indexOf('--ads-on') >= 0) {
    runAdsOnly(true).catch(function(err){ console.error(err); process.exit(1); });
} else if (cliArgs.indexOf('--ads-off') >= 0) {
    runAdsOnly(false).catch(function(err){ console.error(err); process.exit(1); });
} else { run(); }
