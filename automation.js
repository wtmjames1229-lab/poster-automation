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
                  offsiteAdsModule = false;
          }
    }
    return offsiteAdsModule;
}

const PROMPTS = [
  "Cartoon Snoopy surfing a giant wave at Mavericks Beach California, hyper-realistic crashing ocean spray background, POSTER_TITLE:'GIANT WAVE AT MAVERICKS'",
  "Cartoon Snoopy on the Golden Gate Bridge San Francisco, hyper-realistic fog rolling over bay, POSTER_TITLE:'GOLDEN GATE BRIDGE SAN'",
  "Cartoon Snoopy hiking Half Dome Yosemite, hyper-realistic granite cliff and valley below, POSTER_TITLE:'HALF DOME YOSEMITE'",
  "Cartoon Snoopy at the Grand Canyon rim at sunrise, hyper-realistic canyon layers in golden light, POSTER_TITLE:'GRAND CANYON RIM AT'",
  "Cartoon Snoopy on Venice Beach boardwalk Los Angeles, hyper-realistic palm trees and skaters, POSTER_TITLE:'VENICE BEACH BOARDWALK LOS'",
  "Cartoon Snoopy in Times Square New York at night, hyper-realistic neon billboards and crowds, POSTER_TITLE:'TIMES SQUARE NEW YORK'",
  "Cartoon Snoopy on the Brooklyn Bridge, hyper-realistic Manhattan skyline at dusk, POSTER_TITLE:'BROOKLYN BRIDGE'",
  "Cartoon Snoopy at Yellowstone geyser eruption, hyper-realistic steam and rainbow mist, POSTER_TITLE:'YELLOWSTONE GEYSER ERUPTION'",
  "Cartoon Snoopy at Monument Valley Arizona, hyper-realistic red sandstone buttes at sunset, POSTER_TITLE:'MONUMENT VALLEY ARIZONA'",
  "Cartoon Snoopy in the French Quarter New Orleans, hyper-realistic wrought iron balconies and jazz street, POSTER_TITLE:'FRENCH QUARTER NEW ORLEANS'",
  "Cartoon Snoopy at Multnomah Falls Oregon, hyper-realistic waterfall and lush green moss, POSTER_TITLE:'MULTNOMAH FALLS OREGON'",
  "Cartoon Snoopy in the streets of Chicago with hyper-realistic skyline reflection in the river, POSTER_TITLE:'CHICAGO'",
  "Cartoon Snoopy on Miami South Beach with hyper-realistic turquoise water and art deco hotels, POSTER_TITLE:'MIAMI SOUTH BEACH'",
  "Cartoon Snoopy at Antelope Canyon Arizona, hyper-realistic swirling sandstone light beams, POSTER_TITLE:'ANTELOPE CANYON ARIZONA'",
  "Cartoon Snoopy at Crater Lake Oregon, hyper-realistic deep blue water and volcanic rim, POSTER_TITLE:'CRATER LAKE OREGON'",
  "Cartoon Snoopy in the Redwood Forest California, hyper-realistic towering ancient trees, POSTER_TITLE:'REDWOOD FOREST CALIFORNIA'",
  "Cartoon Snoopy at the Las Vegas Strip at night, hyper-realistic neon casino lights and fountains, POSTER_TITLE:'LAS VEGAS STRIP AT'",
  "Cartoon Snoopy at Niagara Falls, hyper-realistic thundering water and rainbow mist, POSTER_TITLE:'NIAGARA FALLS'",
  "Cartoon Snoopy at the Outer Banks North Carolina, hyper-realistic lighthouse and wild horses, POSTER_TITLE:'OUTER BANKS NORTH CAROLINA'",
  "Cartoon Snoopy at Glacier National Park Montana, hyper-realistic turquoise lake and snow peaks, POSTER_TITLE:'GLACIER NATIONAL PARK MONTANA'",
  "Cartoon Snoopy on Route 66 desert highway, hyper-realistic endless road and red mesas, POSTER_TITLE:'ROUTE 66 DESERT HIGHWAY'",
  "Cartoon Snoopy at Joshua Tree National Park, hyper-realistic twisted trees and Milky Way sky, POSTER_TITLE:'JOSHUA TREE NATIONAL PARK'",
  "Cartoon Snoopy at Waimea Bay Hawaii surfing, hyper-realistic tropical waves and cliffs, POSTER_TITLE:'WAIMEA BAY HAWAII SURFING'",
  "Cartoon Snoopy at the Smoky Mountains Tennessee, hyper-realistic autumn mist and forest, POSTER_TITLE:'SMOKY MOUNTAINS TENNESSEE'",
  "Cartoon Snoopy in Savannah Georgia with hyper-realistic Spanish moss and cobblestone streets, POSTER_TITLE:'SAVANNAH GEORGIA'",
  "Cartoon Snoopy at Sedona Arizona red rocks, hyper-realistic rusty cliffs and clear blue sky, POSTER_TITLE:'SEDONA ARIZONA RED ROCKS'",
  "Cartoon Snoopy at the Seattle Space Needle, hyper-realistic Puget Sound and Mount Rainier background, POSTER_TITLE:'SEATTLE SPACE NEEDLE'",
  "Cartoon Snoopy at Portland Oregon food cart pod, hyper-realistic rainy street and string lights, POSTER_TITLE:'PORTLAND OREGON FOOD CART'",
  "Cartoon Snoopy at Acadia National Park Maine, hyper-realistic rocky coast and lighthouse, POSTER_TITLE:'ACADIA NATIONAL PARK MAINE'",
  "Cartoon Snoopy at the San Antonio Riverwalk, hyper-realistic lantern-lit waterway and cypress trees, POSTER_TITLE:'SAN ANTONIO RIVERWALK'",
  "Cartoon Snoopy at the Eiffel Tower Paris, hyper-realistic city of lights at golden hour, POSTER_TITLE:'EIFFEL TOWER PARIS'",
  "Cartoon Snoopy on the Amalfi Coast Italy, hyper-realistic cliffside villages and turquoise sea, POSTER_TITLE:'AMALFI COAST ITALY'",
  "Cartoon Snoopy in Santorini Greece, hyper-realistic white buildings and blue dome churches at sunset, POSTER_TITLE:'SANTORINI GREECE'",
  "Cartoon Snoopy at the Colosseum Rome, hyper-realistic ancient stone and dramatic sky, POSTER_TITLE:'COLOSSEUM ROME'",
  "Cartoon Snoopy on the canals of Venice Italy, hyper-realistic gondolas and palazzo reflections, POSTER_TITLE:'CANALS OF VENICE ITALY'",
  "Cartoon Snoopy at the Acropolis Athens, hyper-realistic ancient ruins and Mediterranean sky, POSTER_TITLE:'ACROPOLIS ATHENS'",
  "Cartoon Snoopy in the streets of Barcelona, hyper-realistic Gaudi architecture and mosaic tiles, POSTER_TITLE:'STREETS OF BARCELONA'",
  "Cartoon Snoopy at the Cliffs of Moher Ireland, hyper-realistic wild Atlantic waves and green cliffs, POSTER_TITLE:'CLIFFS OF MOHER IRELAND'",
  "Cartoon Snoopy in the Scottish Highlands, hyper-realistic purple heather moors and misty mountains, POSTER_TITLE:'SCOTTISH HIGHLANDS'",
  "Cartoon Snoopy at the Palace of Westminster London, hyper-realistic Big Ben and Thames at twilight, POSTER_TITLE:'PALACE OF WESTMINSTER LONDON'",
  "Cartoon Snoopy on the Charles Bridge Prague, hyper-realistic gothic spires and river mist, POSTER_TITLE:'CHARLES BRIDGE PRAGUE'",
  "Cartoon Snoopy in the tulip fields of Netherlands, hyper-realistic rows of colored flowers and windmill, POSTER_TITLE:'TULIP FIELDS OF NETHERLANDS'",
  "Cartoon Snoopy at the Swiss Alps Matterhorn, hyper-realistic snow peak and alpine meadow, POSTER_TITLE:'SWISS ALPS MATTERHORN'",
  "Cartoon Snoopy in Vienna Austria, hyper-realistic baroque palace and horse-drawn carriage, POSTER_TITLE:'VIENNA AUSTRIA'",
  "Cartoon Snoopy on the beaches of Ibiza Spain, hyper-realistic crystal water and white village, POSTER_TITLE:'BEACHES OF IBIZA SPAIN'",
  "Cartoon Snoopy at Neuschwanstein Castle Germany, hyper-realistic fairytale castle in autumn forest, POSTER_TITLE:'NEUSCHWANSTEIN CASTLE GERMANY'",
  "Cartoon Snoopy at the Sagrada Familia Barcelona, hyper-realistic soaring spires and stone carvings, POSTER_TITLE:'SAGRADA FAMILIA BARCELONA'",
  "Cartoon Snoopy in the Dolomites Italy, hyper-realistic jagged limestone peaks and wildflowers, POSTER_TITLE:'DOLOMITES ITALY'",
  "Cartoon Snoopy at Lake Bled Slovenia, hyper-realistic island church and emerald water, POSTER_TITLE:'LAKE BLED SLOVENIA'",
  "Cartoon Snoopy in Dubrovnik Croatia, hyper-realistic medieval walls and Adriatic sea, POSTER_TITLE:'DUBROVNIK CROATIA'",
  "Cartoon Snoopy at the Alhambra Granada Spain, hyper-realistic Moorish arches and reflecting pools, POSTER_TITLE:'ALHAMBRA GRANADA SPAIN'",
  "Cartoon Snoopy in Cinque Terre Italy, hyper-realistic colorful cliffside villages and sea, POSTER_TITLE:'CINQUE TERRE ITALY'",
  "Cartoon Snoopy at the Northern Lights Iceland, hyper-realistic green aurora over black volcanic sand, POSTER_TITLE:'NORTHERN LIGHTS ICELAND'",
  "Cartoon Snoopy at the Blue Lagoon Iceland, hyper-realistic steaming milky blue geothermal pool, POSTER_TITLE:'BLUE LAGOON ICELAND'",
  "Cartoon Snoopy in Hallstatt Austria, hyper-realistic lakeside alpine village at dawn, POSTER_TITLE:'HALLSTATT AUSTRIA'",
  "Cartoon Snoopy at Stonehenge England, hyper-realistic ancient monoliths and dramatic storm sky, POSTER_TITLE:'STONEHENGE ENGLAND'",
  "Cartoon Snoopy in the Bavarian Christmas market Germany, hyper-realistic snow and glowing stalls, POSTER_TITLE:'BAVARIAN CHRISTMAS MARKET GERMANY'",
  "Cartoon Snoopy at the Trevi Fountain Rome, hyper-realistic baroque stone and splashing water, POSTER_TITLE:'TREVI FOUNTAIN ROME'",
  "Cartoon Snoopy in Bruges Belgium, hyper-realistic medieval canals and guild houses in autumn, POSTER_TITLE:'BRUGES BELGIUM'",
  "Cartoon Snoopy at the Fjords of Norway, hyper-realistic vertical cliff walls and mirror water, POSTER_TITLE:'FJORDS OF NORWAY'",
  "Cartoon Snoopy at Mount Fuji Japan, hyper-realistic snow-capped volcano and cherry blossom forest, POSTER_TITLE:'MOUNT FUJI JAPAN'",
  "Cartoon Snoopy in the bamboo forest Arashiyama Japan, hyper-realistic towering green stalks and filtered light, POSTER_TITLE:'BAMBOO FOREST ARASHIYAMA JAPAN'",
  "Cartoon Snoopy at the Shibuya Crossing Tokyo, hyper-realistic neon night and crossing crowds, POSTER_TITLE:'SHIBUYA CROSSING TOKYO'",
  "Cartoon Snoopy at the Great Wall of China, hyper-realistic ancient watchtowers and mountain ridgeline, POSTER_TITLE:'GREAT WALL OF CHINA'",
  "Cartoon Snoopy in the floating markets Bangkok Thailand, hyper-realistic boats and tropical colors, POSTER_TITLE:'FLOATING MARKETS BANGKOK THAILAND'",
  "Cartoon Snoopy at Angkor Wat Cambodia, hyper-realistic ancient temple and sunrise reflection, POSTER_TITLE:'ANGKOR WAT CAMBODIA'",
  "Cartoon Snoopy at Ha Long Bay Vietnam, hyper-realistic limestone karsts rising from emerald sea, POSTER_TITLE:'HA LONG BAY VIETNAM'",
  "Cartoon Snoopy at the Taj Mahal India, hyper-realistic white marble at golden hour, POSTER_TITLE:'TAJ MAHAL INDIA'",
  "Cartoon Snoopy in the rice terraces of Bali Indonesia, hyper-realistic green stepped paddies and mist, POSTER_TITLE:'RICE TERRACES OF BALI'",
  "Cartoon Snoopy at the temples of Bagan Myanmar, hyper-realistic thousands of pagodas and hot air balloons, POSTER_TITLE:'TEMPLES OF BAGAN MYANMAR'",
  "Cartoon Snoopy at the Marina Bay Sands Singapore, hyper-realistic infinity pool and city skyline at night, POSTER_TITLE:'MARINA BAY SANDS SINGAPORE'",
  "Cartoon Snoopy in Kyoto geisha district Japan, hyper-realistic lantern-lit alley and wooden machiya, POSTER_TITLE:'KYOTO GEISHA DISTRICT JAPAN'",
  "Cartoon Snoopy at Phi Phi Island Thailand, hyper-realistic turquoise lagoon and limestone cliffs, POSTER_TITLE:'PHI PHI ISLAND THAILAND'",
  "Cartoon Snoopy at the Guilin karst mountains China, hyper-realistic river and misty limestone peaks, POSTER_TITLE:'GUILIN KARST MOUNTAINS CHINA'",
  "Cartoon Snoopy at Zhangjiajie floating mountains China, hyper-realistic cloud-wrapped sandstone pillars, POSTER_TITLE:'ZHANGJIAJIE FLOATING MOUNTAINS CHINA'",
  "Cartoon Snoopy in Hong Kong Victoria Harbour, hyper-realistic skyscraper light show at night, POSTER_TITLE:'HONG KONG VICTORIA HARBOUR'",
  "Cartoon Snoopy at the Lotus Temple New Delhi, hyper-realistic white marble petals and reflecting pool, POSTER_TITLE:'LOTUS TEMPLE NEW DELHI'",
  "Cartoon Snoopy in the streets of Seoul Korea, hyper-realistic neon food stalls and night market, POSTER_TITLE:'STREETS OF SEOUL KOREA'",
  "Cartoon Snoopy at the Petronas Towers Kuala Lumpur, hyper-realistic gleaming towers and storm sky, POSTER_TITLE:'PETRONAS TOWERS KUALA LUMPUR'",
  "Cartoon Snoopy at the Dead Sea Jordan, hyper-realistic salt crust and hazy mountains beyond, POSTER_TITLE:'DEAD SEA JORDAN'",
  "Cartoon Snoopy at Machu Picchu Peru, hyper-realistic cloud-wrapped Inca ruins and mountain peaks, POSTER_TITLE:'MACHU PICCHU PERU'",
  "Cartoon Snoopy at Iguazu Falls Brazil Argentina, hyper-realistic thundering jungle waterfalls, POSTER_TITLE:'IGUAZU FALLS BRAZIL ARGENTINA'",
  "Cartoon Snoopy at the Amazon Rainforest, hyper-realistic dense jungle canopy and river below, POSTER_TITLE:'AMAZON RAINFOREST'",
  "Cartoon Snoopy at the Salar de Uyuni Bolivia, hyper-realistic endless salt flat sky reflection, POSTER_TITLE:'SALAR DE UYUNI BOLIVIA'",
  "Cartoon Snoopy at Rio Carnival, hyper-realistic colorful floats and dancers at night, POSTER_TITLE:'RIO CARNIVAL'",
  "Cartoon Snoopy at the Galapagos Islands, hyper-realistic wildlife and volcanic landscape, POSTER_TITLE:'GALAPAGOS ISLANDS'",
  "Cartoon Snoopy at Patagonia Torres del Paine Chile, hyper-realistic granite spires and electric blue lake, POSTER_TITLE:'PATAGONIA TORRES DEL PAINE'",
  "Cartoon Snoopy at Angel Falls Venezuela, hyper-realistic world's tallest waterfall in jungle, POSTER_TITLE:'ANGEL FALLS VENEZUELA'",
  "Cartoon Snoopy at the Easter Island Moai statues, hyper-realistic ancient stone faces and moody sky, POSTER_TITLE:'EASTER ISLAND MOAI STATUES'",
  "Cartoon Snoopy in Buenos Aires Argentina, hyper-realistic colorful La Boca neighborhood street, POSTER_TITLE:'BUENOS AIRES ARGENTINA'",
  "Cartoon Snoopy on safari in the Serengeti Tanzania, hyper-realistic wildebeest migration and savanna, POSTER_TITLE:'SAFARI IN THE SERENGETI'",
  "Cartoon Snoopy at Victoria Falls Zimbabwe, hyper-realistic rainbow mist and Zambezi River, POSTER_TITLE:'VICTORIA FALLS ZIMBABWE'",
  "Cartoon Snoopy in the Sahara Desert sand dunes, hyper-realistic golden dunes and star-filled sky, POSTER_TITLE:'SAHARA DESERT SAND DUNES'",
  "Cartoon Snoopy at Kilimanjaro summit Tanzania, hyper-realistic glaciers and clouds below, POSTER_TITLE:'KILIMANJARO SUMMIT TANZANIA'",
  "Cartoon Snoopy at the Pyramids of Giza Egypt, hyper-realistic ancient pyramids and camel silhouettes, POSTER_TITLE:'PYRAMIDS OF GIZA EGYPT'",
  "Cartoon Snoopy on a Masai Mara hot air balloon Kenya, hyper-realistic sunrise savanna and elephants, POSTER_TITLE:'MASAI MARA HOT AIR'",
  "Cartoon Snoopy at the Okavango Delta Botswana, hyper-realistic waterways and wildlife, POSTER_TITLE:'OKAVANGO DELTA BOTSWANA'",
  "Cartoon Snoopy at Cape Town Table Mountain, hyper-realistic flat-topped mountain and ocean below, POSTER_TITLE:'CAPE TOWN TABLE MOUNTAIN'",
  "Cartoon Snoopy in the Moroccan Medina Marrakech, hyper-realistic souks and mosaic architecture, POSTER_TITLE:'MOROCCAN MEDINA MARRAKECH'",
  "Cartoon Snoopy at the Namib Desert Sossusvlei, hyper-realistic orange sand dunes and dead trees, POSTER_TITLE:'NAMIB DESERT SOSSUSVLEI'",
  "Cartoon Snoopy at the Great Barrier Reef Australia, hyper-realistic coral and tropical fish underwater, POSTER_TITLE:'GREAT BARRIER REEF AUSTRALIA'",
  "Cartoon Snoopy at Uluru Australia at sunset, hyper-realistic glowing red sandstone monolith, POSTER_TITLE:'ULURU AUSTRALIA AT SUNSET'",
  "Cartoon Snoopy at the Twelve Apostles Victoria Australia, hyper-realistic limestone stacks and surf, POSTER_TITLE:'TWELVE APOSTLES VICTORIA AUSTRALIA'",
  "Cartoon Snoopy at Sydney Opera House, hyper-realistic harbor and sails gleaming at twilight, POSTER_TITLE:'SYDNEY OPERA HOUSE'",
  "Cartoon Snoopy in the New Zealand Fiordlands Milford Sound, hyper-realistic mirrored fjord and waterfalls, POSTER_TITLE:'NEW ZEALAND FIORDLANDS MILFORD'",
  "Cartoon Snoopy at the Whitsunday Islands Australia, hyper-realistic pure white sand and turquoise sea, POSTER_TITLE:'WHITSUNDAY ISLANDS AUSTRALIA'",
  "Cartoon Snoopy on Bora Bora French Polynesia, hyper-realistic overwater bungalows and lagoon, POSTER_TITLE:'BORA BORA FRENCH POLYNESIA'",
  "Cartoon Snoopy in the Lord of the Rings landscapes New Zealand, hyper-realistic rolling green hills, POSTER_TITLE:'LORD OF THE RINGS'",
  "Cartoon Snoopy at the Waitomo Glowworm Caves New Zealand, hyper-realistic underground starry ceiling, POSTER_TITLE:'WAITOMO GLOWWORM CAVES NEW'",
  "Cartoon Snoopy at Bondi Beach Sydney Australia, hyper-realistic waves and golden light, POSTER_TITLE:'BONDI BEACH SYDNEY AUSTRALIA'",
  "Cartoon Snoopy in the Napa Valley vineyards California, hyper-realistic golden rows and mountains, POSTER_TITLE:'NAPA VALLEY VINEYARDS CALIFORNIA'",
  "Cartoon Snoopy at Horseshoe Bend Arizona, hyper-realistic turquoise river bend and sandstone, POSTER_TITLE:'HORSESHOE BEND ARIZONA'",
  "Cartoon Snoopy in the Appalachian Trail autumn, hyper-realistic fiery forest and mountain fog, POSTER_TITLE:'APPALACHIAN TRAIL AUTUMN'",
  "Cartoon Snoopy at the Badlands South Dakota, hyper-realistic alien rock formations and stormy sky, POSTER_TITLE:'BADLANDS SOUTH DAKOTA'",
  "Cartoon Snoopy at Cape Cod Massachusetts, hyper-realistic shingled cottages and beach roses, POSTER_TITLE:'CAPE COD MASSACHUSETTS'",
  "Cartoon Snoopy at the Bayou in Louisiana, hyper-realistic cypress trees and Spanish moss at dusk, POSTER_TITLE:'BAYOU IN LOUISIANA'",
  "Cartoon Snoopy at Zion Canyon Utah, hyper-realistic towering red canyon walls and river below, POSTER_TITLE:'ZION CANYON UTAH'",
  "Cartoon Snoopy in the Great Smoky Mountains in bloom, hyper-realistic pink rhododendron and mist, POSTER_TITLE:'GREAT SMOKY MOUNTAINS IN'",
  "Cartoon Snoopy at Bryce Canyon Utah, hyper-realistic orange hoodoo spires and blue sky, POSTER_TITLE:'BRYCE CANYON UTAH'",
  "Cartoon Snoopy at the Florida Everglades, hyper-realistic sawgrass and dramatic purple sunset, POSTER_TITLE:'FLORIDA EVERGLADES'",
  "Cartoon Snoopy surfing Pipeline North Shore Hawaii, hyper-realistic barrel wave and reef, POSTER_TITLE:'PIPELINE NORTH SHORE HAWAII'",
  "Cartoon Snoopy at the Arenal Volcano Costa Rica, hyper-realistic smoking volcano and rainforest, POSTER_TITLE:'ARENAL VOLCANO COSTA RICA'",
  "Cartoon Snoopy at Lake Tahoe California, hyper-realistic crystal clear alpine lake and snow pines, POSTER_TITLE:'LAKE TAHOE CALIFORNIA'",
  "Cartoon Snoopy in the Colorado Rocky Mountains, hyper-realistic wildflower meadows and 14er peaks, POSTER_TITLE:'COLORADO ROCKY MOUNTAINS'",
  "Cartoon Snoopy at the Oregon Coast tidal pools, hyper-realistic sea stacks and crashing waves, POSTER_TITLE:'OREGON COAST TIDAL POOLS'",
  "Cartoon Snoopy in Glacier Bay Alaska, hyper-realistic calving glacier and orca in cold sea, POSTER_TITLE:'GLACIER BAY ALASKA'",
  "Cartoon Snoopy at Denali Alaska, hyper-realistic massive peak above tundra and aurora, POSTER_TITLE:'DENALI ALASKA'",
  "Cartoon Snoopy at the Texas Hill Country bluebonnets, hyper-realistic wildflower meadow and oak, POSTER_TITLE:'TEXAS HILL COUNTRY BLUEBONNETS'",
  "Cartoon Snoopy at Great Sand Dunes Colorado, hyper-realistic massive dunes and mountain backdrop, POSTER_TITLE:'GREAT SAND DUNES COLORADO'",
  "Cartoon Snoopy at Point Reyes National Seashore California, hyper-realistic lighthouse and foggy cliffs, POSTER_TITLE:'POINT REYES NATIONAL SEASHORE'",
  "Cartoon Snoopy at the Lofoten Islands Norway, hyper-realistic red fishing huts and fjord mountains, POSTER_TITLE:'LOFOTEN ISLANDS NORWAY'",
  "Cartoon Snoopy in Cappadocia Turkey, hyper-realistic hundred hot air balloons over fairy chimneys, POSTER_TITLE:'CAPPADOCIA TURKEY'",
  "Cartoon Snoopy at Plitvice Lakes Croatia, hyper-realistic turquoise cascading pools and waterfalls, POSTER_TITLE:'PLITVICE LAKES CROATIA'",
  "Cartoon Snoopy at the Giant's Causeway Northern Ireland, hyper-realistic hexagonal basalt columns and sea, POSTER_TITLE:'GIANT'S CAUSEWAY NORTHERN IRELAND'",
  "Cartoon Snoopy in the Cotswolds England, hyper-realistic honey stone cottages and garden flowers, POSTER_TITLE:'COTSWOLDS ENGLAND'",
  "Cartoon Snoopy at the Fairy Pools Isle of Skye Scotland, hyper-realistic crystal pools and dramatic sky, POSTER_TITLE:'FAIRY POOLS ISLE OF'",
  "Cartoon Snoopy at the Meteora monasteries Greece, hyper-realistic clifftop monasteries and valley below, POSTER_TITLE:'METEORA MONASTERIES GREECE'",
  "Cartoon Snoopy in Positano Italy, hyper-realistic pastel cliffside town and sparkling sea, POSTER_TITLE:'POSITANO ITALY'",
  "Cartoon Snoopy at the Banff National Park Canada, hyper-realistic turquoise lake and snow mountains, POSTER_TITLE:'BANFF NATIONAL PARK CANADA'",
  "Cartoon Snoopy at Lake Louise Canada, hyper-realistic glacial teal water and chateau, POSTER_TITLE:'LAKE LOUISE CANADA'",
  "Cartoon Snoopy at the Canadian Rockies Icefields Parkway, hyper-realistic glacier and jade lake, POSTER_TITLE:'CANADIAN ROCKIES ICEFIELDS PARKWAY'",
  "Cartoon Snoopy in Havana Cuba, hyper-realistic vintage cars and colorful colonial buildings, POSTER_TITLE:'HAVANA CUBA'",
  "Cartoon Snoopy at the geysers of Iceland Geysir, hyper-realistic erupting column and rainbow, POSTER_TITLE:'GEYSERS OF ICELAND GEYSIR'",
  "Cartoon Snoopy at the Faroe Islands cliffs, hyper-realistic green turf houses and wild Atlantic, POSTER_TITLE:'FAROE ISLANDS CLIFFS'",
  "Cartoon Snoopy at Tiger's Nest Bhutan monastery, hyper-realistic cliffside temple and pine forest, POSTER_TITLE:'TIGER'S NEST BHUTAN MONASTERY'",
  "Cartoon Snoopy at the Maldives underwater restaurant, hyper-realistic coral reef fish through glass, POSTER_TITLE:'MALDIVES UNDERWATER RESTAURANT'",
  "Cartoon Snoopy at Paro Valley Bhutan, hyper-realistic prayer flags and Himalayan peaks, POSTER_TITLE:'PARO VALLEY BHUTAN'",
  "Cartoon Snoopy at the ancient city of Petra Jordan, hyper-realistic rose-red carved canyon treasury, POSTER_TITLE:'ANCIENT CITY OF PETRA'",
  "Cartoon Snoopy at Capri Island Italy, hyper-realistic Blue Grotto sea cave and motorboats, POSTER_TITLE:'CAPRI ISLAND ITALY'",
  "Cartoon Snoopy at the Lavender Fields Provence France, hyper-realistic purple rows and stone farmhouse, POSTER_TITLE:'LAVENDER FIELDS PROVENCE FRANCE'",
  "Cartoon Snoopy in Iceland's black sand beach Reynisfjara, hyper-realistic basalt columns and wild sea, POSTER_TITLE:'ICELAND'S BLACK SAND BEACH'",
  "Cartoon Snoopy at the Amazon River Brazil, hyper-realistic pink dolphins and dense jungle, POSTER_TITLE:'AMAZON RIVER BRAZIL'",
  "Cartoon Snoopy at Waitangi New Zealand, hyper-realistic Maori carved meeting house and coastline, POSTER_TITLE:'WAITANGI NEW ZEALAND'",
  "Cartoon Snoopy at the temples of Hampi India, hyper-realistic boulder landscape and ancient ruins, POSTER_TITLE:'TEMPLES OF HAMPI INDIA'",
  "Cartoon Snoopy at Rann of Kutch India, hyper-realistic white salt desert and full moon, POSTER_TITLE:'RANN OF KUTCH INDIA'",
  "Cartoon Snoopy at the Kerala backwaters India, hyper-realistic houseboat and coconut palms, POSTER_TITLE:'KERALA BACKWATERS INDIA'",
  "Cartoon Snoopy at Mount Bromo Indonesia, hyper-realistic volcanic crater and sea of clouds, POSTER_TITLE:'MOUNT BROMO INDONESIA'",
  "Cartoon Snoopy at Cocos Island Costa Rica, hyper-realistic hammerhead shark school underwater, POSTER_TITLE:'COCOS ISLAND COSTA RICA'",
  "Cartoon Snoopy at the Pantanal Brazil, hyper-realistic jaguars and flooded grassland, POSTER_TITLE:'PANTANAL BRAZIL'",
  "Cartoon Snoopy at Rainbow Mountain Peru, hyper-realistic colorful mineral stripes and alpacas, POSTER_TITLE:'RAINBOW MOUNTAIN PERU'",
  "Cartoon Snoopy in the Tokyo ramen alley, hyper-realistic steamy bowls and neon lanterns, POSTER_TITLE:'TOKYO RAMEN ALLEY'",
  "Cartoon Snoopy at a Brooklyn rooftop party, hyper-realistic Manhattan skyline at sunset, POSTER_TITLE:'BROOKLYN ROOFTOP PARTY'",
  "Cartoon Snoopy in a London underground station, hyper-realistic curved tunnel and crowds, POSTER_TITLE:'LONDON UNDERGROUND STATION'",
  "Cartoon Snoopy at a Paris bookstall on the Seine, hyper-realistic riverside and Notre Dame, POSTER_TITLE:'PARIS BOOKSTALL ON THE'",
  "Cartoon Snoopy in a Marrakech rooftop at dusk, hyper-realistic terracotta city and minarets, POSTER_TITLE:'MARRAKECH ROOFTOP AT DUSK'",
  "Cartoon Snoopy at a Hong Kong night market, hyper-realistic street food stalls and neon, POSTER_TITLE:'HONG KONG NIGHT MARKET'",
  "Cartoon Snoopy in a rainy Tokyo alley at night, hyper-realistic reflective puddles and lanterns, POSTER_TITLE:'RAINY TOKYO ALLEY AT'",
  "Cartoon Snoopy at a Nashville honky-tonk, hyper-realistic neon signs and boot-scootin crowd, POSTER_TITLE:'NASHVILLE HONKY-TONK'",
  "Cartoon Snoopy at a New Orleans jazz club doorway, hyper-realistic French Quarter at night, POSTER_TITLE:'NEW ORLEANS JAZZ CLUB'",
  "Cartoon Snoopy in a Copenhagen bike lane, hyper-realistic colorful harbor buildings, POSTER_TITLE:'COPENHAGEN BIKE LANE'",
  "Cartoon Snoopy at a Sydney harbor ferry, hyper-realistic Opera House and gleaming water, POSTER_TITLE:'SYDNEY HARBOR FERRY'",
  "Cartoon Snoopy in the medina of Fez Morocco, hyper-realistic ancient leather tanneries, POSTER_TITLE:'MEDINA OF FEZ MOROCCO'",
  "Cartoon Snoopy at a Mexico City lucha libre arena, hyper-realistic wrestlers and roaring crowd, POSTER_TITLE:'MEXICO CITY LUCHA LIBRE'",
  "Cartoon Snoopy in a Kyoto tea house garden, hyper-realistic moss garden and bamboo fence, POSTER_TITLE:'KYOTO TEA HOUSE GARDEN'",
  "Cartoon Snoopy at a Lisbon tram stop, hyper-realistic steep cobblestone hill and azulejo tiles, POSTER_TITLE:'LISBON TRAM STOP'",
  "Cartoon Snoopy in a Buenos Aires tango venue, hyper-realistic dancers and candlelit cafe, POSTER_TITLE:'BUENOS AIRES TANGO VENUE'",
  "Cartoon Snoopy at a Mumbai street food market, hyper-realistic colorful chaos and spices, POSTER_TITLE:'MUMBAI STREET FOOD MARKET'",
  "Cartoon Snoopy in the souks of Tunis, hyper-realistic arched passages and hanging lanterns, POSTER_TITLE:'SOUKS OF TUNIS'",
  "Cartoon Snoopy at a Jakarta night market, hyper-realistic tropical street food and motorcycles, POSTER_TITLE:'JAKARTA NIGHT MARKET'",
  "Cartoon Snoopy in the Shibuya neon rain Tokyo, hyper-realistic umbrella sea and crossing lights, POSTER_TITLE:'SHIBUYA NEON RAIN TOKYO'",
  "Cartoon Snoopy at the Amazon canopy treetops, hyper-realistic macaw birds and jungle below, POSTER_TITLE:'AMAZON CANOPY TREETOPS'",
  "Cartoon Snoopy in an Antarctic ice cave, hyper-realistic electric blue ice walls and penguins, POSTER_TITLE:'ANTARCTIC ICE CAVE'",
  "Cartoon Snoopy at the Mariana Trench surface, hyper-realistic storm clouds and endless ocean, POSTER_TITLE:'MARIANA TRENCH SURFACE'",
  "Cartoon Snoopy on the summit of Everest base camp, hyper-realistic prayer flags and Himalayan dawn, POSTER_TITLE:'SUMMIT OF EVEREST BASE'",
  "Cartoon Snoopy in Death Valley salt flats, hyper-realistic cracked earth and heat shimmer, POSTER_TITLE:'DEATH VALLEY SALT FLATS'",
  "Cartoon Snoopy at the edge of an active lava flow Hawaii, hyper-realistic glowing molten rock, POSTER_TITLE:'EDGE OF AN ACTIVE'",
  "Cartoon Snoopy in a bioluminescent bay Puerto Rico, hyper-realistic glowing blue water at night, POSTER_TITLE:'BIOLUMINESCENT BAY PUERTO RICO'",
  "Cartoon Snoopy at the Bonneville Salt Flats Utah, hyper-realistic endless white plain and mountains, POSTER_TITLE:'BONNEVILLE SALT FLATS UTAH'",
  "Cartoon Snoopy in a Sequoia forest California, hyper-realistic massive trunks and cathedral light, POSTER_TITLE:'SEQUOIA FOREST CALIFORNIA'",
  "Cartoon Snoopy at the volcanic shoreline Big Island Hawaii, hyper-realistic lava entering the sea, POSTER_TITLE:'VOLCANIC SHORELINE BIG ISLAND'",
  "Cartoon Snoopy kitesurfing in Tarifa Spain, hyper-realistic wind and Gibraltar Strait, POSTER_TITLE:'TARIFA SPAIN'",
  "Cartoon Snoopy paragliding over Interlaken Switzerland, hyper-realistic Alpine valley below, POSTER_TITLE:'INTERLAKEN'",
  "Cartoon Snoopy bungee jumping at Victoria Falls, hyper-realistic aerial view of gorge and mist, POSTER_TITLE:'VICTORIA FALLS'",
  "Cartoon Snoopy whitewater rafting Colorado River, hyper-realistic canyon walls and churning water, POSTER_TITLE:'COLORADO RIVER'",
  "Cartoon Snoopy ice climbing in Alaska, hyper-realistic blue ice wall and glacial valley, POSTER_TITLE:'ALASKA'",
  "Cartoon Snoopy freediving in Silfra fissure Iceland, hyper-realistic crystal water between continents, POSTER_TITLE:'SILFRA ICELAND'",
  "Cartoon Snoopy sandboarding at Huacachina Peru, hyper-realistic desert oasis dunes and sunset, POSTER_TITLE:'HUACACHINA PERU'",
  "Cartoon Snoopy zip-lining in Costa Rica rainforest, hyper-realistic jungle canopy and waterfall, POSTER_TITLE:'COSTA RICA'",
  "Cartoon Snoopy cliff diving at Acapulco Mexico, hyper-realistic dramatic cliff and Pacific sea, POSTER_TITLE:'ACAPULCO'",
  "Cartoon Snoopy skiing in Hokkaido Japan powder, hyper-realistic birch forest and deep snow, POSTER_TITLE:'HOKKAIDO JAPAN'",
  "Cartoon Snoopy on Hana Highway Maui Hawaii, hyper-realistic jungle waterfalls and coastal cliffs, POSTER_TITLE:'HANA HIGHWAY MAUI HAWAII'",
  "Cartoon Snoopy on the Pacific Coast Highway California, hyper-realistic ocean cliffs and convertible, POSTER_TITLE:'PACIFIC COAST HIGHWAY CALIFORNIA'",
  "Cartoon Snoopy on the Great Ocean Road Australia, hyper-realistic limestone sea stacks and surf, POSTER_TITLE:'GREAT OCEAN ROAD AUSTRALIA'",
  "Cartoon Snoopy on the Transfagarasan Highway Romania, hyper-realistic mountain switchbacks and mist, POSTER_TITLE:'TRANSFAGARASAN HIGHWAY ROMANIA'",
  "Cartoon Snoopy on the Ring Road Iceland, hyper-realistic lava fields and green hills, POSTER_TITLE:'RING ROAD ICELAND'",
  "Cartoon Snoopy on the Cabot Trail Nova Scotia, hyper-realistic autumn cliffs and ocean, POSTER_TITLE:'CABOT TRAIL NOVA SCOTIA'",
  "Cartoon Snoopy on the Trollstigen Norway mountain road, hyper-realistic hairpin turns and waterfall, POSTER_TITLE:'TROLLSTIGEN NORWAY MOUNTAIN ROAD'",
  "Cartoon Snoopy on the Death Road Bolivia, hyper-realistic cliff edge jungle road and clouds, POSTER_TITLE:'DEATH ROAD BOLIVIA'",
  "Cartoon Snoopy on the Million Dollar Highway Colorado, hyper-realistic dramatic mountain pass, POSTER_TITLE:'MILLION DOLLAR HIGHWAY COLORADO'",
  "Cartoon Snoopy on the Ruta 40 Patagonia Argentina, hyper-realistic endless steppe and volcanic peaks, POSTER_TITLE:'RUTA 40 PATAGONIA ARGENTINA'",
  "Cartoon Snoopy at the Maldives sandbank, hyper-realistic circular sandbar and crystal lagoon, POSTER_TITLE:'MALDIVES SANDBANK'",
  "Cartoon Snoopy at Pink Beach Bermuda, hyper-realistic rose-pink sand and aqua water, POSTER_TITLE:'PINK BEACH BERMUDA'",
  "Cartoon Snoopy at Navagio Shipwreck Beach Greece, hyper-realistic rusted wreck and limestone cliffs, POSTER_TITLE:'NAVAGIO SHIPWRECK BEACH GREECE'",
  "Cartoon Snoopy at Glass Beach Fort Bragg California, hyper-realistic sea glass covered shore, POSTER_TITLE:'GLASS BEACH FORT BRAGG'",
  "Cartoon Snoopy at Pamukkale Turkey, hyper-realistic white calcium terraces and thermal pools, POSTER_TITLE:'PAMUKKALE TURKEY'",
  "Cartoon Snoopy at Seven Mile Beach Cayman Islands, hyper-realistic powder sand and sunset sky, POSTER_TITLE:'SEVEN MILE BEACH CAYMAN'",
  "Cartoon Snoopy at the Flaming Cliffs Mongolia, hyper-realistic red-orange desert and open sky, POSTER_TITLE:'FLAMING CLIFFS MONGOLIA'",
  "Cartoon Snoopy at Marble Caves Chile, hyper-realistic swirling marble walls over turquoise water, POSTER_TITLE:'MARBLE CAVES CHILE'",
  "Cartoon Snoopy at the Blue Eye Spring Albania, hyper-realistic electric blue natural spring, POSTER_TITLE:'BLUE EYE SPRING ALBANIA'",
  "Cartoon Snoopy at Kelingking Beach Bali, hyper-realistic hidden cove and dramatic cliff, POSTER_TITLE:'KELINGKING BEACH BALI'",
  "Cartoon Snoopy at the Himalayas Annapurna Base Camp Nepal, hyper-realistic snow amphitheater, POSTER_TITLE:'HIMALAYAS ANNAPURNA BASE CAMP'",
  "Cartoon Snoopy at the Atlas Mountains Morocco, hyper-realistic Berber village and snowy peaks, POSTER_TITLE:'ATLAS MOUNTAINS MOROCCO'",
  "Cartoon Snoopy at the Drakensberg Mountains South Africa, hyper-realistic sandstone escarpment, POSTER_TITLE:'DRAKENSBERG MOUNTAINS SOUTH AFRICA'",
  "Cartoon Snoopy at the Tatras Mountains Poland Slovakia, hyper-realistic alpine lake and peaks, POSTER_TITLE:'TATRAS MOUNTAINS POLAND SLOVAKIA'",
  "Cartoon Snoopy at Rila Lakes Bulgaria, hyper-realistic glacier lakes at different elevations, POSTER_TITLE:'RILA LAKES BULGARIA'",
  "Cartoon Snoopy at the Altai Mountains Mongolia, hyper-realistic nomadic landscape and eagle, POSTER_TITLE:'ALTAI MOUNTAINS MONGOLIA'",
  "Cartoon Snoopy at the Caucasus Mountains Georgia, hyper-realistic medieval tower village and peaks, POSTER_TITLE:'CAUCASUS MOUNTAINS GEORGIA'",
  "Cartoon Snoopy at Mount Cook New Zealand, hyper-realistic mirror lake and snow peak at dawn, POSTER_TITLE:'MOUNT COOK NEW ZEALAND'",
  "Cartoon Snoopy at the Simien Mountains Ethiopia, hyper-realistic escarpment and gelada baboons, POSTER_TITLE:'SIMIEN MOUNTAINS ETHIOPIA'",
  "Cartoon Snoopy at Huangshan Yellow Mountains China, hyper-realistic pine trees on mist-shrouded peaks, POSTER_TITLE:'HUANGSHAN YELLOW MOUNTAINS CHINA'",
  "Cartoon Snoopy at the Azores Portugal volcanic lakes, hyper-realistic twin crater lakes and green hills, POSTER_TITLE:'AZORES PORTUGAL VOLCANIC LAKES'",
  "Cartoon Snoopy at Svalbard Norway Arctic, hyper-realistic polar bear and icy wilderness, POSTER_TITLE:'SVALBARD NORWAY ARCTIC'",
  "Cartoon Snoopy at Reunion Island Indian Ocean, hyper-realistic volcanic beach and cirque cliffs, POSTER_TITLE:'REUNION ISLAND INDIAN OCEAN'",
  "Cartoon Snoopy at Fernando de Noronha Brazil, hyper-realistic pristine bay and sea turtles, POSTER_TITLE:'FERNANDO DE NORONHA BRAZIL'",
  "Cartoon Snoopy at Socotra Island Yemen, hyper-realistic dragon blood trees and alien landscape, POSTER_TITLE:'SOCOTRA ISLAND YEMEN'",
  "Cartoon Snoopy at the Faroe Islands Gasadalur waterfall, hyper-realistic waterfall into ocean, POSTER_TITLE:'FAROE ISLANDS GASADALUR WATERFALL'",
  "Cartoon Snoopy at Lombok Indonesia, hyper-realistic perfect cone volcano and rice paddies, POSTER_TITLE:'LOMBOK INDONESIA'",
  "Cartoon Snoopy at Flores Island Indonesia, hyper-realistic colored volcanic crater lakes, POSTER_TITLE:'FLORES ISLAND INDONESIA'",
  "Cartoon Snoopy at Palawan Philippines, hyper-realistic underground river and jungle limestone, POSTER_TITLE:'PALAWAN PHILIPPINES'",
  "Cartoon Snoopy at Vanuatu volcanic island, hyper-realistic active lava lake inside crater, POSTER_TITLE:'VANUATU VOLCANIC ISLAND'",
  "Cartoon Snoopy at the Kennedy Space Center launch, hyper-realistic rocket blastoff and smoke, POSTER_TITLE:'KENNEDY SPACE CENTER LAUNCH'",
  "Cartoon Snoopy at CERN Geneva particle accelerator, hyper-realistic underground tunnel rings, POSTER_TITLE:'CERN GENEVA PARTICLE ACCELERATOR'",
  "Cartoon Snoopy at the McDonald Observatory Texas, hyper-realistic telescope dome and star field, POSTER_TITLE:'MCDONALD OBSERVATORY TEXAS'",
  "Cartoon Snoopy in Iceland at midnight sun, hyper-realistic golden horizon at midnight, POSTER_TITLE:'ICELAND AT MIDNIGHT SUN'",
  "Cartoon Snoopy at the Namibian star party, hyper-realistic darkest sky Milky Way and dunes, POSTER_TITLE:'NAMIBIAN STAR PARTY'",
  "Cartoon Snoopy at the Atacama Desert observatory Chile, hyper-realistic clearest sky on Earth, POSTER_TITLE:'ATACAMA DESERT OBSERVATORY CHILE'",
  "Cartoon Snoopy at the Northern Lights Tromsø Norway, hyper-realistic dancing green and purple aurora, POSTER_TITLE:'NORTHERN LIGHTS TROMSØ NORWAY'",
  "Cartoon Snoopy at the Southern Lights Antarctica, hyper-realistic shimmering aurora australis, POSTER_TITLE:'SOUTHERN LIGHTS ANTARCTICA'",
  "Cartoon Snoopy at a solar eclipse viewpoint, hyper-realistic corona and totality darkness, POSTER_TITLE:'SOLAR ECLIPSE VIEWPOINT'",
  "Cartoon Snoopy at the Perseid meteor shower, hyper-realistic streaks across mountain night sky, POSTER_TITLE:'PERSEID METEOR SHOWER'",
  "Snoopy standing on an empty crosswalk at sunrise, Beatles Abbey Road style, full cartoon character, iconic and timeless",
  "Snoopy floating underwater reaching for a dollar bill on a fishhook, Nevermind style album cover art, cartoon character in hyper-real water",
  "Snoopy silhouette against a prism rainbow light beam, Dark Side of the Moon style album cover, cartoon on black background",
  "Snoopy in a desert with a bone microphone stand at sunset, vintage rock album cover composition, cartoon character photorealistic landscape",
  "Snoopy and Woodstock on a rooftop concert at golden hour, Let It Be album cover style, warm light and brick buildings",
  "Snoopy holding a red umbrella in a geometric color field, Umbrella album cover inspired, bold flat graphic with cartoon character",
  "Snoopy in a glitter suit in a smoky spotlight, classic soul album cover style, 1970s warm tones and velvet curtain",
  "Snoopy as a punk rock cartoon in front of a Union Jack, vintage British invasion album cover style",
  "Snoopy lying on a zebra crossing from above bird's eye view, classic rock iconic album cover composition",
  "Snoopy and Woodstock on a dark misty road, atmospheric indie folk album cover, cartoon figures tiny against vast landscape",
  "Snoopy in a tuxedo against a galaxy background, classic jazz album cover style, elegant and cosmic",
  "Snoopy spinning vinyl record in a cool bedroom, lofi hip hop album cover aesthetic, warm golden lamp light",
  "Snoopy in a tie-dye shirt in a field of flowers, psychedelic 1960s album cover style, swirling colors",
  "Snoopy on a diving board above a rooftop pool at night, alternative indie album cover style, moody and cinematic",
  "Snoopy in a field of grain at magic hour, americana folk album cover style, golden dust and open sky",
  "Snoopy playing saxophone in a foggy city alley, cool jazz album cover, 1950s noir atmosphere",
  "Snoopy as DJ on turntables in a club, hip hop album cover style, dramatic lights and smoke",
  "Snoopy in front of a wall of amplifiers, heavy rock album cover style, bold color contrast",
  "Snoopy under a streetlamp in the rain, R&B soul album cover, neon reflections and blue mood",
  "Snoopy in outer space with stars behind, ambient electronic album cover style, dreamy and surreal",
  "Snoopy and Woodstock in a diner booth at 3am, indie pop album cover, lonely beautiful atmosphere",
  "Snoopy surfing a massive wave in a Hawaiian shirt, beach boys summer album cover style",
  "Snoopy on a vintage train platform with steam, folk Americana album cover, sepia tones and nostalgia",
  "Snoopy in neon pink against all black background, modern pop album cover style, minimal and striking",
  "Snoopy on a piano bench in an empty concert hall, classical crossover album cover, grand and solitary",
  "Snoopy in a field at night with a glowing radio, country album cover style, stars and fireflies",
  "Snoopy in a vintage car on a desert highway, roots rock album cover, warm afternoon light",
  "Snoopy in a crowded arena with one spotlight, stadium rock album cover, epic and dramatic",
  "Snoopy wearing headphones in a recording booth, urban contemporary album cover, studio glass reflection",
  "Snoopy and Woodstock in silhouette against a blood orange sunset, instrumental jazz album cover",
  "Snoopy with a boombox on a New York stoop, old school hip hop album cover, summer street style",
  "Snoopy in a white room with one red tulip, minimalist post-modern album cover",
  "Snoopy and Woodstock as a duo on a park bench in autumn, acoustic indie album cover",
  "Snoopy in black and white with a spotlight, classic film noir jazz album cover",
  "Snoopy at a grand piano in a burning building, dramatic art rock album cover",
  "Snoopy in overalls in a cotton field, delta blues album cover, sepia warm tones",
  "Snoopy in a spaceship cockpit, synth-wave album cover, purple and cyan neon",
  "Snoopy on a fire escape at sunset, urban pop punk album cover",
  "Snoopy in a record store flipping through vinyl, indie alternative album cover",
  "Snoopy at a drive-in movie screen in the rain, dream pop album cover, cinematic and wistful",
  "Snoopy on a pier at dawn with a fishing rod guitar, Americana album cover, misty blues",
  "Snoopy in front of a neon barbershop sign, neo-soul album cover, warm city night",
  "Snoopy in a meadow at magic hour with a kite, indie folk album cover, golden and pastoral",
  "Snoopy standing on a mountaintop with arms spread, triumphant rock anthem album cover",
  "Snoopy in a submarine porthole, quirky indie pop album cover, whimsical underwater world",
  "Snoopy at a typewriter by a rain-streaked window, literary indie album cover, moody and cerebral",
  "Snoopy in a retro swimsuit by a motel pool, surf pop album cover, 1960s California vibes",
  "Snoopy and Woodstock on a tandem bicycle in Paris, chanson album cover, charming and cinematic",
  "Snoopy playing banjo on a porch at dusk, bluegrass album cover, southern light and cicadas",
  "Snoopy in a neon-soaked arcade at night, chiptune album cover, pixel glow and nostalgia",
  "Snoopy on a beach bonfire at night, acoustic summer album cover, warm flames and dark sea",
  "Snoopy in a vintage fighter pilot jacket, rock and roll album cover, cool and rebellious",
  "Snoopy under a sakura cherry blossom tree, ambient Japan album cover, pale pink petals",
  "Snoopy with a polaroid camera in a forest, indie photography album cover, film grain aesthetic",
  "Snoopy in a boxing ring with title belt, rap album cover, triumphant spotlight moment",
  "Snoopy at a rooftop concert in rainy NYC, post-punk album cover, dark and cinematic",
  "Snoopy in a convertible on Route 66, classic rock road trip album cover",
  "Snoopy holding a lantern in a dark forest, folk horror album cover, atmospheric and mysterious",
  "Snoopy on a pier in the mist, post-rock instrumental album cover, lonely and beautiful",
  "Snoopy as a 1950s teen idol in a poodle skirt era photo, doo-wop album cover",
  "Snoopy at a harvest festival stage, alt-country album cover, autumn lights and crowd",
  "Snoopy in a library at midnight with a candle, chamber pop album cover, warm and intimate",
  "Snoopy on a raft in a glassy lake, ambient folk album cover, perfect reflection and silence",
  "Snoopy in a crowded subway car, city indie album cover, real people blurred around cartoon",
  "Snoopy in a throne room, prog rock album cover, ornate and over-the-top regal",
  "Snoopy in a field of poppies, psychedelic indie album cover, soft focus and dreamlike",
  "Snoopy and Woodstock on a park bench with snow falling, quiet winter album cover",
  "Snoopy with a cape silhouetted against a full moon, gothic rock album cover",
  "Snoopy on a rooftop at dawn drinking coffee, lo-fi album cover, hazy morning warmth",
  "Snoopy in a vintage diner with a milkshake, doo-wop retro album cover, checkerboard floor",
  "Snoopy and Woodstock in a canoe at sunrise, new age relaxation album cover",
  "Snoopy on a cliff edge during a storm, dramatic metal album cover, lightning and sea",
  "Snoopy in an abandoned warehouse with sun beams, post-punk revival album cover",
  "Snoopy on a hammock between palm trees, reggae album cover, lazy afternoon gold",
  "Snoopy at a street piano in a park, beautiful moment indie album cover",
  "Snoopy in a darkroom developing photos, alternative rock album cover, red light glow",
  "Snoopy on a rooftop in Tokyo at night, city pop album cover, neon and rain",
  "Snoopy in a cozy cabin with snow outside, folk Christmas album cover",
  "Snoopy backstage with a guitar, rock memoir album cover, raw and authentic",
  "Snoopy and Woodstock at a soul music festival crowd, Motown style album cover",
  "Snoopy on a London double-decker bus top, britpop album cover, grey sky and chimney pots",
  "Snoopy in a marching band uniform, funk brass album cover, vibrant and energetic",
  "Snoopy at a Hawaiian slack key guitar show, tropical folk album cover",
  "Snoopy in front of stained glass window with guitar, gospel soul album cover",
  "Snoopy at a jazz festival outdoor stage at dusk, cool blue jazz album cover",
  "Snoopy reading a map in a foreign city at night, travel folk album cover",
  "Snoopy on a tram in Lisbon with a guitar case, fado album cover, melancholy and beautiful",
  "Snoopy in a Berlin club at 4am, techno electronic album cover, dark and pulsing",
  "Snoopy and Woodstock flying a biplane over clouds, orchestral adventure album cover",
  "Snoopy on a fire lookout tower in a forest, folk isolation album cover",
  "Snoopy in a New Orleans second line parade, jazz funeral album cover, bittersweet and vibrant",
  "Snoopy dancing at a house party, indie pop album cover, warm lamp light and joy",
  "Snoopy at a campfire under a starry sky with guitar, folk storytelling album cover",
  "Snoopy in a vintage Detroit muscle car, Motown soul album cover, warm and powerful",
  "Snoopy on an empty stage alone with a microphone, farewell tour album cover, emotional and iconic",
  "Snoopy in a boxing gym with a tape recorder, hip hop classic album cover",
  "Snoopy in a field during a lightning storm, indie drama album cover, electrifying and moody",
  "Snoopy and Woodstock doing a curtain call on a grand stage, show tune album cover",
  "Snoopy as a heroic action figure on a dramatic movie poster, bold composition, epic lighting, character above title treatment, retro 1970s style",
  "Snoopy as an astronaut on a retro NASA-style space mission poster, bold red and white design, propaganda poster art style",
  "Snoopy as a 1940s wartime recruitment poster, bold graphic flat design, patriotic colors, vintage printing texture",
  "Snoopy on a vintage WPA National Parks style travel poster, bold color blocks, art deco typography, classic American poster art",
  "Snoopy as a superhero on a golden age comic book cover poster, primary colors, halftone dots, bold action lines",
  "Snoopy on a retro circus poster, ornate Victorian typography, vintage illustration, ringmaster pose, bright canvas",
  "Snoopy on a vintage boxing match poster, old school fight night design, worn paper texture, red and black",
  "Snoopy on a 1960s vintage concert poster, psychedelic swirling letters, Fillmore West style art, vivid poster design",
  "Snoopy on an art deco travel poster for Paris 1930s, gold and black geometric design, Cassandre style",
  "Snoopy as a retro sci-fi movie hero poster, 1950s pulp science fiction style, rocket ships and aliens",
  "Snoopy on a vintage rodeo cowboy poster, western style lettering, rope border, sunset colors",
  "Snoopy as a vintage detective noir movie poster, black silhouette, rain and shadow, classic film poster style",
  "Snoopy on a vintage surf competition poster, 1960s beach design, woodblock print style, ocean wave",
  "Snoopy on a Soviet constructivist propaganda poster style, bold geometry, red and black, modernist typography",
  "Snoopy as a silent film movie star poster, 1920s illustrated movie house style, ornate frame and star design",
  "Snoopy on a vintage baseball pennant poster, classic stadium illustration, bold serif type, primary colors",
  "Snoopy on a jazz club poster from 1950s, bebop style graphic, smoky noir illustration, coffee stained paper",
  "Snoopy as a vintage aviator poster, 1930s air show design, pilot goggles and biplane, adventurous spirit",
  "Snoopy on a retro drive-in movie poster, 1950s Americana design, pink and teal palette, starry night",
  "Snoopy as a vintage wrestling championship poster, old school professional wrestling design, bold colors and lightning",
  "Snoopy on a vintage Americana county fair poster, ferris wheel and bunting, classic mid-century design",
  "Snoopy as a retro fitness brand poster, 1970s workout design, bold groovy typography, dynamic pose",
  "Snoopy on a vintage winter Olympics poster, 1928 style illustration, art deco type, mountain landscape",
  "Snoopy on a retro car racing poster, 1960s Formula race design, checkered flag and speed lines",
  "Snoopy as a vintage pirate adventure movie poster, 1950s swashbuckler style, treasure map and galleons",
  "Snoopy on a psychedelic 1968 poster, Haight-Ashbury style, melting lettering, rainbow swirls",
  "Snoopy as a 1980s action movie character poster, airbrushed painting style, fire and sunglasses",
  "Snoopy on a retro Hawaiian tourism poster, 1940s illustration style, tropical flowers and surf",
  "Snoopy as a vintage strongman circus poster, exaggerated muscle pose, classic Victorian illustration",
  "Snoopy on a vintage roller derby poster, 1970s female empowerment style, bold graphic and stars",
  "Snoopy as a retro samurai movie poster, Japanese woodblock print influenced, bold ink strokes",
  "Snoopy on a 1930s ocean liner travel poster, art deco ocean waves, Cassandre style luxury liner",
  "Snoopy as a classic 1970s kung fu movie poster, hand-painted style, action pose and chopstick title treatment",
  "Snoopy on a vintage motorcycle rally poster, Route 66 style, hot rod flames and chrome",
  "Snoopy as a retro safari adventure poster, 1950s African expedition style, sepia and bold colors",
  "Snoopy on a vintage ski resort poster, 1930s alpine illustration, bold primary colors and elegant type",
  "Snoopy as a classic western movie poster, frontier sunset, wanted poster style, sepia dusty tones",
  "Snoopy on a retro amusement park poster, 1920s Coney Island style, ornate rides and neon",
  "Snoopy as a 1970s blaxploitation movie character poster, airbrushed funky style, afro and platform shoes",
  "Snoopy on a vintage propaganda health poster, 1940s government design, cheerful bold illustration",
  "Snoopy as a retro video game character arcade cabinet art, 1980s pixel style inspired, joystick and quarters",
  "Snoopy on a vintage Japanese travel poster for Mount Fuji, 1930s woodblock print style, minimalist elegance",
  "Snoopy as a 1960s spy movie poster, James Bond influenced composition, silhouette and gun barrel",
  "Snoopy on a vintage New York World Fair poster, 1939 modernist design, trylon and perisphere",
  "Snoopy as a retro space race era astronaut poster, 1960s NASA design, American flag and rocket",
  "Snoopy on a vintage Russian ballet poster, 1920s Ballets Russes style, Nijinsky inspired graphic",
  "Snoopy as a classic 1950s monster movie poster, B-movie horror style, scream text and giant shadow",
  "Snoopy on a retro music hall poster, Victorian era illustrated entertainment bill, ornate typography",
  "Snoopy as a 1980s breakdance crew poster, electric boogaloo style, cardboard floor and boom box",
  "Snoopy on a vintage riverboat gambling poster, Mississippi Delta style, steamboat and playing cards",
  "Snoopy as a retro superhero team poster, 1970s Saturday morning cartoon style, heroic lineup",
  "Snoopy on a vintage Mardi Gras parade poster, New Orleans 1950s style, mask and beads and jazz",
  "Snoopy as a classic Roman gladiator movie poster, sword and sandal epic style, arena and crowds",
  "Snoopy on a vintage Alaskan frontier poster, 1900s gold rush style, wilderness and adventure",
  "Snoopy as a retro kung fu dojo poster, 1970s martial arts school style, flying kick and brush lettering",
  "Snoopy on a vintage Italian Vespa scooter poster, 1950s La Dolce Vita style, Mediterranean sun and style",
  "Snoopy as a 1920s jazz age poster, Harlem Renaissance style, bold graphic and speakeasy glamour",
  "Snoopy on a vintage Havana nightclub poster, 1950s Cuban golden age design, mambo dancer and neon",
  "Snoopy as a classic French cinema poster, nouvelle vague style, black and white photo tinted, artsy",
  "Snoopy on a vintage surfboard shaper poster, California 1960s style, Endless Summer inspired design",
  "Snoopy as a retro pinball machine marquee art, 1970s illustration style, neon tubes and chrome balls",
  "Snoopy on a vintage deep sea diving expedition poster, 1930s illustration, dive helmet and undersea world",
  "Snoopy as a classic Venetian carnival poster, 1950s Italian illustration style, masks and gondolas",
  "Snoopy on a vintage hot springs resort poster, 1920s spa style, art nouveau flowers and thermal pools",
  "Snoopy as a retro robot science fair poster, 1950s atomic age design, chrome robot and test tubes",
  "Snoopy on a vintage Chicago blues club poster, 1950s hand-lettered style, dark and soulful",
  "Snoopy as a classic bullfighting poster, Corrida de Toros style, bold Spanish poster art, matador grace",
  "Snoopy on a vintage Swiss travel poster, 1930s alpine elegance, geometric simplicity, cog railway",
  "Snoopy as a retro Hawaiian Poi bowl festival poster, traditional luau style, tiki torch and hula",
  "Snoopy on a vintage zeppelin travel poster, 1930s Hindenburg era design, art deco and skies",
  "Snoopy as a classic Mack Sennett silent comedy poster, 1920s slapstick style, pie and pratfall",
  "Snoopy on a vintage Australian outback adventure poster, 1940s colonial style, kangaroo and red dust",
  "Snoopy as a retro disco king poster, 1970s Studio 54 style, mirror ball and gold sequins",
  "Snoopy on a vintage Cape Cod lobster shack poster, 1950s New England style, buoys and boats",
  "Snoopy as a classic Mexican Day of the Dead poster, Calavera art style, marigolds and sugar skulls",
  "Snoopy on a vintage Antarctic expedition poster, 1910s Shackleton era style, ice ship and brave souls",
  "Snoopy as a retro Olympic athlete poster, 1936 Berlin Games style modernist illustration",
  "Snoopy on a vintage folk festival poster, 1960s Newport Folk style, hand-printed and earthy",
  "Snoopy as a classic kung fu school tournament poster, 1980s Hong Kong martial arts cinema style",
  "Snoopy on a vintage Bourbon Street jazz poster, 1940s New Orleans illustrated style, trumpet and glow",
  "Snoopy as a retro hot rod dragster poster, 1960s Kustom Kulture style, Ed Roth influenced cartoon",
  "Snoopy on a vintage Turkish bath hammam poster, 1920s Ottoman revival style, geometric tile art",
  "Snoopy as a classic Harlem Globetrotters tour poster, 1950s basketball exhibition style",
  "Snoopy on a vintage Polynesian voyager poster, wayfinding stars and ocean, traditional motifs",
  "Snoopy as a retro ice cream parlor poster, 1950s soda fountain style, pastel colors and cherry on top",
  "Snoopy on a vintage Malibu beach lifeguard poster, California 1960s style, red cross and waves",
  "Snoopy as a classic Italian Renaissance faire poster, courtly illustration style, mandolin and jousting",
  "Snoopy on a vintage Key West sunset festival poster, Florida Keys style, conch shell and sailboat",
  "Snoopy as a retro Tokyo subway safety poster, 1970s Japanese graphic style, polite instruction art",
  "Snoopy on a vintage New England fall foliage tour poster, 1950s road map style, covered bridges",
  "Snoopy as a classic Spanish flamenco poster, Andalusian illustration style, red dress and castanets",
  "Snoopy on a vintage San Francisco cable car poster, 1940s city tourism design, Alcatraz and bay",
  "Snoopy as a retro midnight movie double feature poster, 1970s grindhouse style, scream queen camp",
  "Snoopy on a vintage Cairo bazaar poster, 1920s orientalist travel art style, spice market colors",
  "Snoopy as a classic vaudeville playbill poster, 1900s theatrical billing style, curtain and footlights",
  "Snoopy on a vintage Costa Rica coffee plantation poster, mid-century Latin American graphic design",
  "Snoopy as a retro stock car race poster, 1950s Southern track style, dirt oval and bleachers",
  "Snoopy on a vintage Big Sur poetry festival poster, 1960s Beat Generation style, ink sketch and coffee",
  "Snoopy and Woodstock in a spring meadow with cherry blossoms falling in golden sunlight",
  "Snoopy and Woodstock watching summer thunderstorm from a covered porch with lemonade",
  "Snoopy and Woodstock jumping in enormous autumn leaf piles, orange and red tones",
  "Snoopy and Woodstock building an elaborate igloo in a blizzard with tiny windows lit inside",
  "Snoopy and Woodstock under a triple rainbow after a spring shower",
  "Snoopy and Woodstock catching snowflakes on their tongues in a midnight winter garden",
  "Snoopy and Woodstock in a field of wildflowers on a breezy golden afternoon",
  "Snoopy and Woodstock watching lightning over a stormy Pacific ocean from sea cliffs",
  "Snoopy and Woodstock sitting on a wooden fence during perfect golden hour light",
  "Snoopy and Woodstock in a foggy morning redwood forest",
  "Snoopy and Woodstock chasing tumbleweeds across an Arizona desert at sunset",
  "Snoopy and Woodstock watching a supercell storm from a safe Kansas hilltop",
  "Snoopy and Woodstock in a monsoon rain, dancing in rivers of warm water",
  "Snoopy and Woodstock in a winter frost forest, every icy branch glowing blue",
  "Snoopy and Woodstock watching a brilliant aurora borealis in snowy Lapland tundra",
  "Snoopy and Woodstock on a rooftop in a summer heat wave eating colorful popsicles",
  "Snoopy and Woodstock watching a breathtaking double rainbow over a green valley",
  "Snoopy and Woodstock in a massive snow fort during a neighborhood blizzard battle",
  "Snoopy and Woodstock watching shooting stars from a sleeping bag on a hilltop meadow",
  "Snoopy and Woodstock in a foggy autumn pumpkin patch at golden hour",
  "Snoopy and Woodstock in a 1950s diner, neon signs, cherry red stools and milkshakes",
  "Snoopy and Woodstock as 1960s hippies in a psychedelic festival flower field",
  "Snoopy and Woodstock in a 1970s disco club with mirror balls, platforms and flares",
  "Snoopy and Woodstock in a 1980s arcade, pixel games glowing green and orange",
  "Snoopy and Woodstock at a vintage 1950s drive-in movie, making popcorn in a Chevy",
  "Snoopy and Woodstock in retro Googie space age style diners and rocket ships",
  "Snoopy and Woodstock as vintage travel poster tourists with old-fashioned luggage",
  "Snoopy and Woodstock in a sepia-toned Wild West saloon with piano and swinging doors",
  "Snoopy and Woodstock in a vintage traveling circus poster style with bright colors",
  "Snoopy and Woodstock in a 1920s art deco Manhattan skyline at night",
  "Snoopy and Woodstock in a vintage Automat restaurant with little glass windows",
  "Snoopy and Woodstock at a 1940s USO dance hall with big band orchestra",
  "Snoopy and Woodstock in a vintage soda fountain counter with penny candy jars",
  "Snoopy and Woodstock building a classic soapbox derby racer in a 1950s garage",
  "Snoopy and Woodstock at a vintage county fair with tilt-a-whirl and cotton candy",
  "Snoopy and Woodstock decorating a massive outdoor Christmas tree with colored lights",
  "Snoopy and Woodstock in elaborate Halloween costumes trick or treating at night",
  "Snoopy and Woodstock watching Fourth of July fireworks over a harbor",
  "Snoopy and Woodstock celebrating New Years Eve with a giant confetti ball drop",
  "Snoopy and Woodstock on Easter morning hunting eggs in a dewy garden",
  "Snoopy and Woodstock at a lavish Thanksgiving table with family and autumn decorations",
  "Snoopy and Woodstock celebrating Valentines Day in Paris with hearts everywhere",
  "Snoopy and Woodstock at a surprise birthday party with balloons and sparkle cake",
  "Snoopy and Woodstock at a summer neighborhood barbecue with fireflies at dusk",
  "Snoopy and Woodstock in full St Patricks Day green at a Dublin pub parade",
  "Snoopy and Woodstock at a Chinese New Year parade with dragon and fireworks",
  "Snoopy and Woodstock at a Diwali festival with a thousand oil lamps glowing",
  "Snoopy and Woodstock at a Day of the Dead celebration with marigolds and altars",
  "Snoopy and Woodstock at a Japanese Obon festival with paper lanterns on the river",
  "Snoopy and Woodstock celebrating Hanukkah with a glowing menorah and latkes",
  "Snoopy and Woodstock fishing at a glassy mountain lake at perfect sunrise",
  "Snoopy and Woodstock on a camping trip under a Milky Way sky by the fire",
  "Snoopy and Woodstock hiking through a misty mountain trail above the clouds",
  "Snoopy and Woodstock on a secluded beach watching a watercolor sunset",
  "Snoopy and Woodstock in an endless sunflower field in perfect summer",
  "Snoopy and Woodstock stargazing in a wildflower meadow on a moonless night",
  "Snoopy and Woodstock on a farm at dawn with roosters and morning mist",
  "Snoopy and Woodstock picking apples in a golden autumn orchard",
  "Snoopy and Woodstock in a secret garden full of climbing roses in bloom",
  "Snoopy and Woodstock by a luminous waterfall in a lush Costa Rica jungle",
  "Snoopy and Woodstock watching a pod of whales from a sea cliff",
  "Snoopy and Woodstock in a lavender field at peak bloom, purple horizon",
  "Snoopy and Woodstock rafting through a slot canyon river",
  "Snoopy and Woodstock discovering a hidden waterfall in a bamboo forest",
  "Snoopy and Woodstock watching a volcano glow at night from a safe distance",
  "Snoopy and Woodstock birdwatching in a misty tropical forest at dawn",
  "Snoopy and Woodstock kayaking on a bioluminescent bay at night",
  "Snoopy and Woodstock in a butterfly sanctuary surrounded by monarchs",
  "Snoopy and Woodstock watching a spectacular storm roll over the ocean",
  "Snoopy and Woodstock in a cave with glowworms overhead like stars",
  "Snoopy and Woodstock playing jazz instruments in a smoky New Orleans club",
  "Snoopy and Woodstock at a modern art museum having opinions about abstract painting",
  "Snoopy and Woodstock dancing ballet on a grand stage with spotlight",
  "Snoopy and Woodstock performing in a stadium rock concert with pyrotechnics",
  "Snoopy and Woodstock painting a giant city mural together at sunset",
  "Snoopy and Woodstock at a Carnegie Hall piano recital dressed in formal wear",
  "Snoopy and Woodstock at a massive outdoor music festival crowd at golden hour",
  "Snoopy and Woodstock doing street art with spray cans in a brick alley",
  "Snoopy and Woodstock at a country music festival with guitars and hay bales",
  "Snoopy and Woodstock in a full symphony orchestra pit playing instruments",
  "Snoopy and Woodstock writing songs in a cozy recording studio",
  "Snoopy and Woodstock at a jazz club late night jam session",
  "Snoopy and Woodstock doing beatbox battle on a city plaza",
  "Snoopy and Woodstock at a vinyl record store listening to an album together",
  "Snoopy and Woodstock in a mariachi band at a fiesta",
  "Snoopy and Woodstock surfing perfect barrels in a tropical surf spot",
  "Snoopy and Woodstock skateboarding in a professional halfpipe competition",
  "Snoopy and Woodstock playing baseball in a packed old stadium at twilight",
  "Snoopy and Woodstock skiing fresh powder down a Colorado mountain",
  "Snoopy and Woodstock on a sunrise hot air balloon ride over a valley",
  "Snoopy and Woodstock scuba diving in a vibrant coral reef with sea turtles",
  "Snoopy and Woodstock playing tennis at a classic grass court club",
  "Snoopy and Woodstock on a cross-country motorcycle road trip",
  "Snoopy and Woodstock rock climbing a dramatic sea cliff face at sunset",
  "Snoopy and Woodstock playing soccer in a World Cup stadium",
  "Snoopy and Woodstock doing yoga on a peaceful mountain sunrise deck",
  "Snoopy and Woodstock winning a sailing race in a regatta",
  "Snoopy and Woodstock ice skating at Rockefeller Center at Christmas",
  "Snoopy and Woodstock at the Olympics opening ceremony as athletes",
  "Snoopy and Woodstock playing beach volleyball at sunset on a tropical beach",
  "Snoopy and Woodstock at a classic American ice cream parlor with elaborate sundaes",
  "Snoopy and Woodstock at an upscale Tokyo omakase sushi counter",
  "Snoopy and Woodstock having a perfect picnic with lemonade in a park",
  "Snoopy and Woodstock baking elaborate holiday cookies in a warm kitchen",
  "Snoopy and Woodstock at a perfect Neapolitan pizza restaurant in Naples",
  "Snoopy and Woodstock at a Parisian sidewalk cafe with coffee and croissants",
  "Snoopy and Woodstock roasting marshmallows over a crackling campfire at night",
  "Snoopy and Woodstock at a Mexican street food market with tacos al pastor",
  "Snoopy and Woodstock making handmade pasta in an Italian grandmother's kitchen",
  "Snoopy and Woodstock at a state fair eating cotton candy and funnel cake",
  "Snoopy and Woodstock at a New England lobster shack on the harbor",
  "Snoopy and Woodstock at a Korean BBQ restaurant cooking tabletop meat",
  "Snoopy and Woodstock at a New Orleans beignet cafe covered in powdered sugar",
  "Snoopy and Woodstock making s'mores on a mountain camping trip",
  "Snoopy and Woodstock at a backyard crawfish boil in Louisiana",
  "Snoopy and Woodstock in a cozy reading nook with books and tea on a rainy day",
  "Snoopy and Woodstock in a bookshop cafe on a winter evening",
  "Snoopy and Woodstock decorating their home for the holidays with lights and garlands",
  "Snoopy and Woodstock having a pajama movie marathon with popcorn",
  "Snoopy and Woodstock in a greenhouse tending to tropical plants on a cloudy day",
  "Snoopy and Woodstock in a vintage library among tall rolling ladders",
  "Snoopy and Woodstock making homemade jam in a farmhouse kitchen in summer",
  "Snoopy and Woodstock in an art studio surrounded by paintings and brushes",
  "Snoopy and Woodstock building a blanket fort with candles and storybooks",
  "Snoopy and Woodstock in a cozy cabin while a snowstorm rages outside",
  "Snoopy and Woodstock in an enchanted mushroom forest with glowing fairy lights",
  "Snoopy and Woodstock in a sky city of floating islands and rainbow bridges",
  "Snoopy and Woodstock discovering an undersea kingdom with glowing sea creatures",
  "Snoopy and Woodstock in a magical library where books fly and whisper",
  "Snoopy and Woodstock in a cloud palace above a mountain range",
  "Snoopy and Woodstock exploring a secret garden of impossible giant flowers",
  "Snoopy and Woodstock on a galaxy train journey through colorful nebulas",
  "Snoopy and Woodstock in a winter wonderland palace made of ice and crystal",
  "Snoopy and Woodstock in a treehouse city in a giant ancient forest",
  "Snoopy and Woodstock meeting friendly dragons in a mountain cave of treasure",
  "Snoopy and Woodstock floating through a beautiful nebula in space",
  "Snoopy and Woodstock planting a flag on the Moon at Earth rise",
  "Snoopy and Woodstock flying a spacecraft through an asteroid field",
  "Snoopy and Woodstock watching two suns set on an alien desert planet",
  "Snoopy and Woodstock in a space station window watching Earth below",
  "Snoopy and Woodstock at a ringed gas giant planet floating in the cosmos",
  "Snoopy and Woodstock on a comet tail zooming through the solar system",
  "Snoopy and Woodstock inside a black hole swirling light phenomenon",
  "Snoopy and Woodstock at the edge of the universe looking into infinity",
  "Snoopy and Woodstock in a retro rocket ship heading toward a red Mars",
  "Snoopy and Woodstock befriending a baby elephant on an African savanna",
  "Snoopy and Woodstock having tea with a family of pandas in bamboo forest",
  "Snoopy and Woodstock riding sea turtles through a coral garden underwater",
  "Snoopy and Woodstock running with wild horses across an open prairie",
  "Snoopy and Woodstock in an arctic scene with polar bear cubs and snow",
  "Snoopy and Woodstock watching orcas leap from a rocky Pacific shore",
  "Snoopy and Woodstock in a monarch butterfly migration, millions of wings",
  "Snoopy and Woodstock tending beehives in a wildflower meadow",
  "Snoopy and Woodstock in an octopus cove at low tide exploring tidepools",
  "Snoopy and Woodstock at a penguin colony in Antarctica with icebergs behind",
  "Snoopy and Woodstock watching the sunrise from a city rooftop with coffee",
  "Snoopy and Woodstock on a foggy bridge in San Francisco at dawn",
  "Snoopy and Woodstock in a colorful Amsterdam canal street in spring",
  "Snoopy and Woodstock in a Brooklyn pizza shop on a snowy night",
  "Snoopy and Woodstock at a food hall with amazing aromas and lights",
  "Snoopy and Woodstock window shopping on a charming European cobblestone street",
  "Snoopy and Woodstock on a Tokyo train reading manga in the rain",
  "Snoopy and Woodstock at a street festival with multicultural foods and music",
  "Snoopy and Woodstock in a San Francisco cable car climbing a steep foggy hill",
  "Snoopy and Woodstock at a Paris night market under string lights",
  "Snoopy hugging Woodstock tight under a starry sky in a meadow",
  "Snoopy and Woodstock sharing an umbrella in a beautiful spring rain",
  "Snoopy carrying a sleepy Woodstock home on his back on a warm evening",
  "Snoopy and Woodstock watching the last sunset of summer together",
  "Snoopy writing a long letter to Woodstock at a desk by candlelight",
  "Snoopy and Woodstock building a birdhouse together in a workshop",
  "Snoopy dancing with Woodstock at a kitchen party late at night",
  "Snoopy and Woodstock sleeping under the same blanket in autumn leaves",
  "Snoopy watching Woodstock fly for the first time with proud expression",
  "Snoopy and Woodstock finding buried treasure on a deserted beach",
  "Snoopy and Woodstock running a lemonade stand on a perfect summer day",
  "Snoopy and Woodstock competing in a pie eating contest at a county fair",
  "Snoopy and Woodstock in a go-kart racing on a colorful outdoor track",
  "Snoopy and Woodstock playing giant chess on an outdoor stone board",
  "Snoopy and Woodstock in a treasure hunt map adventure through a forest",
  "Snoopy and Woodstock at a dog show where Snoopy wins every ribbon",
  "Snoopy and Woodstock making the world's most elaborate sandcastle",
  "Snoopy and Woodstock having a dramatic snowball fight behind snow forts",
  "Snoopy and Woodstock on a ghost train ride through a spooky haunted house",
  "Snoopy and Woodstock doing a magic show in a backyard with lights",
  "Cartoon Snoopy at the Aoraki Mount Cook National Park New Zealand, hyper-realistic mirror lake reflection at dawn, POSTER_TITLE:'AORAKI MOUNT COOK NATIONAL'",
  "Cartoon Snoopy at the Sunflower Fields Tuscany Italy, hyper-realistic rolling hills and cypress trees, POSTER_TITLE:'SUNFLOWER FIELDS TUSCANY ITALY'",
  "Cartoon Snoopy at the Painted Hills Oregon, hyper-realistic colorful geological formations at sunset, POSTER_TITLE:'PAINTED HILLS OREGON'",
  "Cartoon Snoopy at the Wave rock formation Arizona, hyper-realistic swirling red and orange sandstone, POSTER_TITLE:'WAVE ROCK FORMATION ARIZONA'",
  "Cartoon Snoopy in the Enchanted Rock Texas, hyper-realistic pink granite dome and bluebonnet fields, POSTER_TITLE:'ENCHANTED ROCK TEXAS'",
  "Cartoon Snoopy at the Columbia River Gorge Oregon, hyper-realistic windsurfer and basalt cliffs, POSTER_TITLE:'COLUMBIA RIVER GORGE OREGON'",
  "Cartoon Snoopy at the Puerto Rico Old San Juan, hyper-realistic colorful colonial fortresses and sea, POSTER_TITLE:'PUERTO RICO OLD SAN'",
  "Cartoon Snoopy at the Mesa Verde cliff dwellings Colorado, hyper-realistic ancient Pueblo homes, POSTER_TITLE:'MESA VERDE CLIFF DWELLINGS'",
  "Cartoon Snoopy at the Lake Powell Arizona Utah, hyper-realistic red sandstone canyons and houseboat, POSTER_TITLE:'LAKE POWELL ARIZONA UTAH'",
  "Cartoon Snoopy at the Ozark National Forest Missouri, hyper-realistic crystal spring and old growth forest, POSTER_TITLE:'OZARK NATIONAL FOREST MISSOURI'",
  "Cartoon Snoopy at the Apostle Islands Ice Caves Wisconsin, hyper-realistic frozen sea cave formations, POSTER_TITLE:'APOSTLE ISLANDS ICE CAVES'",
  "Cartoon Snoopy at the Maroon Bells Colorado, hyper-realistic twin peaks mirrored in alpine lake, POSTER_TITLE:'MAROON BELLS COLORADO'",
  "Cartoon Snoopy at the White Sands New Mexico, hyper-realistic gypsum dunes at sunset, POSTER_TITLE:'WHITE SANDS NEW MEXICO'",
  "Cartoon Snoopy in the Hudson Valley New York fall foliage, hyper-realistic riverside and Catskills mist, POSTER_TITLE:'HUDSON VALLEY NEW YORK'",
  "Cartoon Snoopy at the Hoh Rainforest Olympic Peninsula, hyper-realistic mossy cathedral forest, POSTER_TITLE:'HOH RAINFOREST OLYMPIC PENINSULA'",
  "Cartoon Snoopy at the Kenai Fjords Alaska, hyper-realistic sea otters and glacial fjord, POSTER_TITLE:'KENAI FJORDS ALASKA'",
  "Cartoon Snoopy at Barton Springs Pool Austin Texas, hyper-realistic spring-fed outdoor swimming, POSTER_TITLE:'BARTON SPRINGS POOL AUSTIN'",
  "Cartoon Snoopy at the Florida Springs crystal clear, hyper-realistic manatees and turquoise water, POSTER_TITLE:'FLORIDA SPRINGS CRYSTAL CLEAR'",
  "Cartoon Snoopy at Cumberland Island Georgia, hyper-realistic wild horses and ruins on beach, POSTER_TITLE:'CUMBERLAND ISLAND GEORGIA'",
  "Cartoon Snoopy at Point Lobos California, hyper-realistic sea lions and cypress on rocky coast, POSTER_TITLE:'POINT LOBOS CALIFORNIA'",
  "Cartoon Snoopy at the Palouse Washington wheat fields, hyper-realistic rolling green and gold hills, POSTER_TITLE:'PALOUSE WASHINGTON WHEAT FIELDS'",
  "Cartoon Snoopy at Big Bend Texas Rio Grande, hyper-realistic canyon and river at golden hour, POSTER_TITLE:'BIG BEND TEXAS RIO'",
  "Cartoon Snoopy at the Boundary Waters Minnesota, hyper-realistic canoe and northern lake wilderness, POSTER_TITLE:'BOUNDARY WATERS MINNESOTA'",
  "Cartoon Snoopy in the Black Hills South Dakota, hyper-realistic ponderosa pine and granite peaks, POSTER_TITLE:'BLACK HILLS SOUTH DAKOTA'",
  "Cartoon Snoopy at Voyageurs National Park Minnesota, hyper-realistic waterway and wolf tracks, POSTER_TITLE:'VOYAGEURS NATIONAL PARK MINNESOTA'",
  "Cartoon Snoopy at Cumberland Falls Kentucky, hyper-realistic moonbow over waterfall at night, POSTER_TITLE:'CUMBERLAND FALLS KENTUCKY'",
  "Cartoon Snoopy at Clingmans Dome Tennessee, hyper-realistic sea of clouds and forest panorama, POSTER_TITLE:'CLINGMANS DOME TENNESSEE'",
  "Cartoon Snoopy at the Snowy Range Wyoming, hyper-realistic alpine tundra and wildflowers, POSTER_TITLE:'SNOWY RANGE WYOMING'",
  "Cartoon Snoopy at Pictured Rocks Michigan, hyper-realistic sandstone cliffs and Lake Superior, POSTER_TITLE:'PICTURED ROCKS MICHIGAN'",
  "Cartoon Snoopy at the Wrangell-St Elias Alaska wilderness, hyper-realistic vast mountain kingdom, POSTER_TITLE:'WRANGELL-ST ELIAS ALASKA WILDERNESS'",
  "Cartoon Snoopy at the Algarve sea caves Portugal, hyper-realistic golden cliffs and turquoise arch, POSTER_TITLE:'ALGARVE SEA CAVES PORTUGAL'",
  "Cartoon Snoopy at the Riomaggiore Cinque Terre harbor Italy, hyper-realistic fishing boats and color, POSTER_TITLE:'RIOMAGGIORE CINQUE TERRE HARBOR'",
  "Cartoon Snoopy at the Svalbard polar bears Norway Arctic, hyper-realistic ice floe and midnight sun, POSTER_TITLE:'SVALBARD POLAR BEARS NORWAY'",
  "Cartoon Snoopy at the Eisriesenwelt ice caves Austria, hyper-realistic underground frozen world, POSTER_TITLE:'EISRIESENWELT ICE CAVES AUSTRIA'",
  "Cartoon Snoopy at the Weissensee Lake Austria, hyper-realistic glass-clear alpine lake and mountains, POSTER_TITLE:'WEISSENSEE LAKE AUSTRIA'",
  "Cartoon Snoopy at the Pulpit Rock Preikestolen Norway, hyper-realistic flat cliff edge and fjord below, POSTER_TITLE:'PULPIT ROCK PREIKESTOLEN NORWAY'",
  "Cartoon Snoopy in the Black Forest Germany, hyper-realistic dense dark pine and fairy tale village, POSTER_TITLE:'BLACK FOREST GERMANY'",
  "Cartoon Snoopy at the Gorge du Verdon France, hyper-realistic turquoise river canyon, POSTER_TITLE:'GORGE DU VERDON FRANCE'",
  "Cartoon Snoopy at the Wachau Valley Austria wine region, hyper-realistic Danube and vineyard terraces, POSTER_TITLE:'WACHAU VALLEY AUSTRIA WINE'",
  "Cartoon Snoopy at the Cheddar Gorge England, hyper-realistic limestone cliffs and winding road, POSTER_TITLE:'CHEDDAR GORGE ENGLAND'",
  "Cartoon Snoopy at the Snowdonia Wales, hyper-realistic mountain reflected in lake, POSTER_TITLE:'SNOWDONIA WALES'",
  "Cartoon Snoopy at the Peak District England, hyper-realistic purple heather moorland and stone walls, POSTER_TITLE:'PEAK DISTRICT ENGLAND'",
  "Cartoon Snoopy at the Rila Monastery Bulgaria, hyper-realistic painted exterior and mountain backdrop, POSTER_TITLE:'RILA MONASTERY BULGARIA'",
  "Cartoon Snoopy at Bigar Waterfall Romania, hyper-realistic cascade over mossy dome, POSTER_TITLE:'BIGAR WATERFALL ROMANIA'",
  "Cartoon Snoopy at the Transfagarasan mountains Romania, hyper-realistic serpentine road and autumn, POSTER_TITLE:'TRANSFAGARASAN MOUNTAINS ROMANIA'",
  "Cartoon Snoopy at Kotor Montenegro, hyper-realistic medieval walled city and Adriatic bay, POSTER_TITLE:'KOTOR MONTENEGRO'",
  "Cartoon Snoopy at the Bay of Kotor Montenegro sunrise, hyper-realistic fortress reflections in water, POSTER_TITLE:'BAY OF KOTOR MONTENEGRO'",
  "Cartoon Snoopy at the Picos de Europa Spain, hyper-realistic limestone spires and gorge, POSTER_TITLE:'PICOS DE EUROPA SPAIN'",
  "Cartoon Snoopy in the Basque Country Spain, hyper-realistic rugged coast and green hills, POSTER_TITLE:'BASQUE COUNTRY SPAIN'",
  "Cartoon Snoopy at the Ronda gorge Spain, hyper-realistic white village on deep cliffside bridge, POSTER_TITLE:'RONDA GORGE SPAIN'",
  "Cartoon Snoopy at Lake Skadar Montenegro Albania, hyper-realistic waterbird wetlands and karst, POSTER_TITLE:'LAKE SKADAR MONTENEGRO ALBANIA'",
  "Cartoon Snoopy at the Bosphorus Istanbul Turkey, hyper-realistic mosque domes and bridge at sunset, POSTER_TITLE:'BOSPHORUS ISTANBUL TURKEY'",
  "Cartoon Snoopy in the Cappadocia valleys Turkey, hyper-realistic fairy chimney rock formations, POSTER_TITLE:'CAPPADOCIA VALLEYS TURKEY'",
  "Cartoon Snoopy at the Sumela Monastery Turkey, hyper-realistic cliff-carved monastery and forest gorge, POSTER_TITLE:'SUMELA MONASTERY TURKEY'",
  "Cartoon Snoopy at the cotton castles of Pamukkale Turkey, hyper-realistic white calcium pools, POSTER_TITLE:'COTTON CASTLES OF PAMUKKALE'",
  "Cartoon Snoopy at the Sea of Galilee Israel, hyper-realistic ancient holy shores at dawn, POSTER_TITLE:'SEA OF GALILEE ISRAEL'",
  "Cartoon Snoopy in the Wadi Rum desert Jordan, hyper-realistic red rock labyrinth and starry sky, POSTER_TITLE:'WADI RUM DESERT JORDAN'",
  "Cartoon Snoopy at the Masada fortress Israel, hyper-realistic Dead Sea panorama at sunrise, POSTER_TITLE:'MASADA FORTRESS ISRAEL'",
  "Cartoon Snoopy at the Rub al Khali Empty Quarter, hyper-realistic giant dunes and silence, POSTER_TITLE:'RUB AL KHALI EMPTY'",
  "Cartoon Snoopy in the Asir highlands Saudi Arabia, hyper-realistic misty green escarpment villages, POSTER_TITLE:'ASIR HIGHLANDS SAUDI ARABIA'",
  "Cartoon Snoopy at the Zhangye Danxia rainbow mountains China, hyper-realistic striped geology, POSTER_TITLE:'ZHANGYE DANXIA RAINBOW MOUNTAINS'",
  "Cartoon Snoopy at the Tiger Leaping Gorge China, hyper-realistic dramatic Yangtze canyon, POSTER_TITLE:'TIGER LEAPING GORGE CHINA'",
  "Cartoon Snoopy at Jiuzhaigou Valley China, hyper-realistic multicolored mountain lake chain, POSTER_TITLE:'JIUZHAIGOU VALLEY CHINA'",
  "Cartoon Snoopy in the Tea Horse Ancient Road Yunnan China, hyper-realistic terrace and mist, POSTER_TITLE:'TEA HORSE ANCIENT ROAD'",
  "Cartoon Snoopy at the Ha Giang Loop Vietnam, hyper-realistic limestone mountains and terraces, POSTER_TITLE:'HA GIANG LOOP VIETNAM'",
  "Cartoon Snoopy at Sapa rice terraces Vietnam, hyper-realistic hill tribe village and golden harvest, POSTER_TITLE:'SAPA RICE TERRACES VIETNAM'",
  "Cartoon Snoopy at the Phong Nha caves Vietnam, hyper-realistic underground river and stalactites, POSTER_TITLE:'PHONG NHA CAVES VIETNAM'",
  "Cartoon Snoopy in Hoi An Vietnam lantern festival, hyper-realistic river reflection of thousand lights, POSTER_TITLE:'HOI AN VIETNAM LANTERN'",
  "Cartoon Snoopy at the Cardamom Mountains Cambodia, hyper-realistic rainforest and gibbon, POSTER_TITLE:'CARDAMOM MOUNTAINS CAMBODIA'",
  "Cartoon Snoopy at Luang Prabang Laos, hyper-realistic monks morning procession and temple, POSTER_TITLE:'LUANG PRABANG LAOS'",
  "Cartoon Snoopy at Inle Lake Myanmar, hyper-realistic leg-rowing fishermen and floating gardens, POSTER_TITLE:'INLE LAKE MYANMAR'",
  "Cartoon Snoopy at the Mae Klong train market Thailand, hyper-realistic train through market stalls, POSTER_TITLE:'MAE KLONG TRAIN MARKET'",
  "Cartoon Snoopy at Chiang Rai White Temple Thailand, hyper-realistic reflective mirror mosaic, POSTER_TITLE:'CHIANG RAI WHITE TEMPLE'",
  "Cartoon Snoopy at the Belum caves Malaysia, hyper-realistic longest cave chamber in Southeast Asia, POSTER_TITLE:'BELUM CAVES MALAYSIA'",
  "Cartoon Snoopy at Chocolate Hills Philippines, hyper-realistic hundreds of brown cones in dry season, POSTER_TITLE:'CHOCOLATE HILLS PHILIPPINES'",
  "Cartoon Snoopy at Tubbataha Reef Philippines, hyper-realistic pristine coral atoll from above, POSTER_TITLE:'TUBBATAHA REEF PHILIPPINES'",
  "Cartoon Snoopy in Ubud Bali forest monkey sanctuary, hyper-realistic jungle temple and macaques, POSTER_TITLE:'UBUD BALI FOREST MONKEY'",
  "Cartoon Snoopy at the Komodo Island Indonesia, hyper-realistic dragon on pink beach, POSTER_TITLE:'KOMODO ISLAND INDONESIA'",
  "Cartoon Snoopy at the Banda Islands Indonesia, hyper-realistic nutmeg plantation and turquoise bay, POSTER_TITLE:'BANDA ISLANDS INDONESIA'",
  "Cartoon Snoopy at the Wai-O-Tapu thermal wonderland New Zealand, hyper-realistic champagne pool, POSTER_TITLE:'WAI-O-TAPU THERMAL WONDERLAND NEW'",
  "Cartoon Snoopy at the Tongariro Alpine Crossing New Zealand, hyper-realistic volcanic emerald lakes, POSTER_TITLE:'TONGARIRO ALPINE CROSSING NEW'",
  "Cartoon Snoopy at the Coromandel Peninsula New Zealand, hyper-realistic cathedral cove sea arch, POSTER_TITLE:'COROMANDEL PENINSULA NEW ZEALAND'",
  "Cartoon Snoopy at the Ningaloo Reef Western Australia, hyper-realistic whale shark snorkeling, POSTER_TITLE:'NINGALOO REEF WESTERN AUSTRALIA'",
  "Cartoon Snoopy at the Kimberley Bungle Bungle Western Australia, hyper-realistic striped beehive domes, POSTER_TITLE:'KIMBERLEY BUNGLE BUNGLE WESTERN'",
  "Cartoon Snoopy at the Blue Mountains New South Wales, hyper-realistic eucalyptus haze and Three Sisters, POSTER_TITLE:'BLUE MOUNTAINS NEW SOUTH'",
  "Cartoon Snoopy at the Flinders Ranges South Australia, hyper-realistic ancient red range and wildflowers, POSTER_TITLE:'FLINDERS RANGES SOUTH AUSTRALIA'",
  "Cartoon Snoopy at Kakadu National Park Northern Territory, hyper-realistic wetlands and Aboriginal art, POSTER_TITLE:'KAKADU NATIONAL PARK NORTHERN'",
  "Cartoon Snoopy at Milford Sound New Zealand kayaking, hyper-realistic reflection and waterfalls, POSTER_TITLE:'MILFORD SOUND NEW ZEALAND'",
  "Cartoon Snoopy at the Kepler Track New Zealand, hyper-realistic alpine meadow and fiord glimpse, POSTER_TITLE:'KEPLER TRACK NEW ZEALAND'",
  "Cartoon Snoopy at Cape Reinga New Zealand, hyper-realistic two oceans meeting and lighthouse, POSTER_TITLE:'CAPE REINGA NEW ZEALAND'",
  "Cartoon Snoopy at the Okefenokee Swamp Georgia, hyper-realistic Spanish moss and alligator at dusk, POSTER_TITLE:'OKEFENOKEE SWAMP GEORGIA'",
  "Cartoon Snoopy at the Mammoth Hot Springs Yellowstone, hyper-realistic travertine terraces and steam, POSTER_TITLE:'MAMMOTH HOT SPRINGS YELLOWSTONE'",
  "Cartoon Snoopy at the Chesapeake Bay Maryland, hyper-realistic oyster boats and sunset reflections, POSTER_TITLE:'CHESAPEAKE BAY MARYLAND'",
  "Cartoon Snoopy at the Columbia Icefield Canada, hyper-realistic glacier walk and blue-white ice, POSTER_TITLE:'COLUMBIA ICEFIELD CANADA'",
  "Cartoon Snoopy at Tofino British Columbia Canada surfing, hyper-realistic Pacific storm and kelp forest, POSTER_TITLE:'TOFINO BRITISH COLUMBIA CANADA'",
  "Cartoon Snoopy at the Bay of Fundy Canada, hyper-realistic world's highest tidal bore and red cliffs, POSTER_TITLE:'BAY OF FUNDY CANADA'",
  "Cartoon Snoopy at Churchill Manitoba Canada, hyper-realistic polar bears and tundra buggy, POSTER_TITLE:'CHURCHILL MANITOBA CANADA'",
  "Cartoon Snoopy at the Icefields Parkway Canada, hyper-realistic glacier-fed turquoise lakes, POSTER_TITLE:'ICEFIELDS PARKWAY CANADA'",
  "Cartoon Snoopy at the Cabot Trail sunset Cape Breton Nova Scotia, hyper-realistic highlands and sea, POSTER_TITLE:'CABOT TRAIL SUNSET CAPE'",
  "Cartoon Snoopy at Gros Morne Newfoundland Canada, hyper-realistic fjord and ancient rock puzzle, POSTER_TITLE:'GROS MORNE NEWFOUNDLAND CANADA'",
  "Cartoon Snoopy at Kluane National Park Yukon, hyper-realistic largest non-polar icefield and mountains, POSTER_TITLE:'KLUANE NATIONAL PARK YUKON'",
  "Cartoon Snoopy at the Queen Charlotte Islands Canada, hyper-realistic ancient Haida totem and rainforest, POSTER_TITLE:'QUEEN CHARLOTTE ISLANDS CANADA'",
  "Cartoon Snoopy at Peyto Lake Banff Canada, hyper-realistic turquoise glacier lake and wolf head shape, POSTER_TITLE:'PEYTO LAKE BANFF CANADA'",
  "Cartoon Snoopy at the Andes condor viewpoint Peru, hyper-realistic condor soaring over canyon, POSTER_TITLE:'ANDES CONDOR VIEWPOINT PERU'",
  "Cartoon Snoopy at Colca Canyon Peru, hyper-realistic deepest canyon and terraces, POSTER_TITLE:'COLCA CANYON PERU'",
  "Cartoon Snoopy at the Sacred Valley Peru, hyper-realistic Incan terraces and mountain corridor, POSTER_TITLE:'SACRED VALLEY PERU'",
  "Cartoon Snoopy in La Paz Bolivia cable car, hyper-realistic highest city and Andes panorama, POSTER_TITLE:'LA PAZ BOLIVIA CABLE'",
  "Cartoon Snoopy at the Quebrada de Humahuaca Argentina, hyper-realistic painted hills and colonial church, POSTER_TITLE:'QUEBRADA DE HUMAHUACA ARGENTINA'",
  "Cartoon Snoopy at Cerro Torre Patagonia Argentina, hyper-realistic impossible rock tower and wind, POSTER_TITLE:'CERRO TORRE PATAGONIA ARGENTINA'",
  "Cartoon Snoopy at the Atacama flamingo lagoons Chile, hyper-realistic pink flamingos and volcanic backdrop, POSTER_TITLE:'ATACAMA FLAMINGO LAGOONS CHILE'",
  "Cartoon Snoopy at the Valdivian temperate rainforest Chile, hyper-realistic oldest trees in the world, POSTER_TITLE:'VALDIVIAN TEMPERATE RAINFOREST CHILE'",
  "Cartoon Snoopy at the Pantanal giant anteater, hyper-realistic tropical wetland and sunset, POSTER_TITLE:'PANTANAL GIANT ANTEATER'",
  "Cartoon Snoopy at the Orinoco Delta Venezuela, hyper-realistic delta waterway and Warao stilt village, POSTER_TITLE:'ORINOCO DELTA VENEZUELA'",
  "Cartoon Snoopy at the Cloud Forest Monteverde Costa Rica, hyper-realistic quetzal and mossy canopy, POSTER_TITLE:'CLOUD FOREST MONTEVERDE COSTA'",
  "Cartoon Snoopy at Corcovado National Park Costa Rica, hyper-realistic scarlet macaw and pristine beach, POSTER_TITLE:'CORCOVADO NATIONAL PARK COSTA'",
  "Cartoon Snoopy at Lake Atitlan Guatemala, hyper-realistic Maya village and three volcano backdrop, POSTER_TITLE:'LAKE ATITLAN GUATEMALA'",
  "Cartoon Snoopy at Copper Canyon Mexico, hyper-realistic deeper than Grand Canyon and indigenous village, POSTER_TITLE:'COPPER CANYON MEXICO'",
  "Cartoon Snoopy at the Cenotes of Yucatan Mexico, hyper-realistic crystal underwater cavern and rays, POSTER_TITLE:'CENOTES OF YUCATAN MEXICO'",
  "Cartoon Snoopy at Hierve el Agua Mexico, hyper-realistic petrified waterfall and valley panorama, POSTER_TITLE:'HIERVE EL AGUA MEXICO'",
  "Cartoon Snoopy at the monarch butterfly reserve Mexico, hyper-realistic millions of orange wings, POSTER_TITLE:'MONARCH BUTTERFLY RESERVE MEXICO'",
  "Cartoon Snoopy at the Belize Blue Hole from above, hyper-realistic dark ocean circle and reef ring, POSTER_TITLE:'BELIZE BLUE HOLE FROM'",
  "Cartoon Snoopy at the Tikal temples Guatemala, hyper-realistic jungle pyramid above the canopy, POSTER_TITLE:'TIKAL TEMPLES GUATEMALA'",
  "Cartoon Snoopy in the Darien Gap jungle Panama, hyper-realistic untouched primary rainforest, POSTER_TITLE:'DARIEN GAP JUNGLE PANAMA'",
  "Cartoon Snoopy at Cartagena Colombia, hyper-realistic walled colonial city and Caribbean sea, POSTER_TITLE:'CARTAGENA COLOMBIA'",
  "Cartoon Snoopy at the Salt Cathedral of Zipaquira Colombia, hyper-realistic underground cathedral, POSTER_TITLE:'SALT CATHEDRAL OF ZIPAQUIRA'",
  "Cartoon Snoopy at the Coffee Region Colombia, hyper-realistic coffee farm and Andes mist, POSTER_TITLE:'COFFEE REGION COLOMBIA'",
  "Cartoon Snoopy at Medellin Colombia cable cars, hyper-realistic city and mountain hillside, POSTER_TITLE:'MEDELLIN COLOMBIA CABLE CARS'",
  "Cartoon Snoopy at the Galapagos land iguana, hyper-realistic prehistoric creature and lava field, POSTER_TITLE:'GALAPAGOS LAND IGUANA'",
  "Cartoon Snoopy at the Nazca Lines Peru from airplane, hyper-realistic giant geoglyph and desert, POSTER_TITLE:'NAZCA LINES PERU FROM'",
  "Cartoon Snoopy at the Moray circular terraces Peru, hyper-realistic concentric Inca circles, POSTER_TITLE:'MORAY CIRCULAR TERRACES PERU'",
  "Cartoon Snoopy at the Lencois Maranhenses Brazil, hyper-realistic white dunes and blue rain pools, POSTER_TITLE:'LENCOIS MARANHENSES BRAZIL'",
  "Cartoon Snoopy at the Serra Gaucha wine region Brazil, hyper-realistic vineyard and European-style town, POSTER_TITLE:'SERRA GAUCHA WINE REGION'",
  "Cartoon Snoopy at Jalapao Brazil, hyper-realistic red sand dunes and crystal spring pools, POSTER_TITLE:'JALAPAO BRAZIL'",
  "Cartoon Snoopy at the Jericoacoara Brazil dunes, hyper-realistic lagoon and kitesurfer at sunset, POSTER_TITLE:'JERICOACOARA BRAZIL DUNES'",
  "Cartoon Snoopy at the Abrolhos Marine Park Brazil, hyper-realistic humpback whale breach and island, POSTER_TITLE:'ABROLHOS MARINE PARK BRAZIL'",
  "Cartoon Snoopy at Victoria Lake East Africa, hyper-realistic fishermen and hippos at sunset, POSTER_TITLE:'VICTORIA LAKE EAST AFRICA'",
  "Cartoon Snoopy at the Sossusvlei Deadvlei Namibia, hyper-realistic dead camel thorn trees in white clay, POSTER_TITLE:'SOSSUSVLEI DEADVLEI NAMIBIA'",
  "Cartoon Snoopy at the Etosha salt pan Namibia, hyper-realistic elephant at waterhole and dust, POSTER_TITLE:'ETOSHA SALT PAN NAMIBIA'",
  "Cartoon Snoopy at the Fish River Canyon Namibia, hyper-realistic second largest canyon in world, POSTER_TITLE:'FISH RIVER CANYON NAMIBIA'",
  "Cartoon Snoopy at the Skeleton Coast Namibia, hyper-realistic fog and shipwreck and seals, POSTER_TITLE:'SKELETON COAST NAMIBIA'",
  "Cartoon Snoopy at the Boulders penguin colony South Africa, hyper-realistic African penguins on beach, POSTER_TITLE:'BOULDERS PENGUIN COLONY SOUTH'",
  "Cartoon Snoopy at Kruger National Park lion sunrise, hyper-realistic pride and golden savanna, POSTER_TITLE:'KRUGER NATIONAL PARK LION'",
  "Cartoon Snoopy at the Garden Route South Africa, hyper-realistic coastal cliff and lagoon, POSTER_TITLE:'GARDEN ROUTE SOUTH AFRICA'",
  "Cartoon Snoopy at Mozambique Bazaruto Archipelago, hyper-realistic dugong and pristine Indian Ocean, POSTER_TITLE:'MOZAMBIQUE BAZARUTO ARCHIPELAGO'",
  "Cartoon Snoopy at the Shire River Malawi, hyper-realistic African fish eagle and papyrus reeds, POSTER_TITLE:'SHIRE RIVER MALAWI'",
  "Cartoon Snoopy at Lake Malawi crystal clear, hyper-realistic cichlid fish and lakeshore village, POSTER_TITLE:'LAKE MALAWI CRYSTAL CLEAR'",
  "Cartoon Snoopy at the Simien Wolf highlands Ethiopia, hyper-realistic rare wolf and afroalpine plateau, POSTER_TITLE:'SIMIEN WOLF HIGHLANDS ETHIOPIA'",
  "Cartoon Snoopy at the Rock Churches of Lalibela Ethiopia, hyper-realistic medieval carved churches, POSTER_TITLE:'ROCK CHURCHES OF LALIBELA'",
  "Cartoon Snoopy at the Danakil Depression Ethiopia, hyper-realistic hottest and most alien landscape, POSTER_TITLE:'DANAKIL DEPRESSION ETHIOPIA'",
  "Cartoon Snoopy at the Dallol volcano Ethiopia, hyper-realistic acid pools and sulfur crystals, POSTER_TITLE:'DALLOL VOLCANO ETHIOPIA'",
  "Cartoon Snoopy at the Saharan oasis of Djanet Algeria, hyper-realistic palm and sandstone canyon, POSTER_TITLE:'SAHARAN OASIS OF DJANET'",
  "Cartoon Snoopy at the Draa Valley Morocco, hyper-realistic ancient kasbahs and palm groves, POSTER_TITLE:'DRAA VALLEY MOROCCO'",
  "Cartoon Snoopy in the Atlas foothills Morocco, hyper-realistic Berber village and almond blossom, POSTER_TITLE:'ATLAS FOOTHILLS MOROCCO'",
  "Cartoon Snoopy at the Essaouira coast Morocco, hyper-realistic windy blue-white port town and sea, POSTER_TITLE:'ESSAOUIRA COAST MOROCCO'",
  "Cartoon Snoopy at the Chefchaouen blue city Morocco, hyper-realistic cobalt walls and flower pots, POSTER_TITLE:'CHEFCHAOUEN BLUE CITY MOROCCO'",
  "Cartoon Snoopy at the Erg Chebbi dunes Sahara Morocco, hyper-realistic camel and star sky, POSTER_TITLE:'ERG CHEBBI DUNES SAHARA'",
  "Cartoon Snoopy at the Toubkal summit Atlas Morocco, hyper-realistic North Africa's highest peak, POSTER_TITLE:'TOUBKAL SUMMIT ATLAS MOROCCO'",
  "Cartoon Snoopy at Bwindi forest Uganda, hyper-realistic mountain gorilla family in mist, POSTER_TITLE:'BWINDI FOREST UGANDA'",
  "Cartoon Snoopy at the Rwenzori Mountains Uganda, hyper-realistic mystical montane glacial peaks, POSTER_TITLE:'RWENZORI MOUNTAINS UGANDA'",
  "Cartoon Snoopy at the Nile source Uganda, hyper-realistic historic source of the great river, POSTER_TITLE:'NILE SOURCE UGANDA'",
  "Cartoon Snoopy at the Congo River Basin, hyper-realistic bonobo and dense equatorial forest, POSTER_TITLE:'CONGO RIVER BASIN'",
  "Cartoon Snoopy at the Pendjari National Park Benin, hyper-realistic West African elephant herd, POSTER_TITLE:'PENDJARI NATIONAL PARK BENIN'",
  "Cartoon Snoopy at Bijagos Islands Guinea-Bissau, hyper-realistic sacred hippo island and mangrove, POSTER_TITLE:'BIJAGOS ISLANDS GUINEA-BISSAU'",
  "Cartoon Snoopy at the Cape Verde volcanic island Fogo, hyper-realistic wine village in crater, POSTER_TITLE:'CAPE VERDE VOLCANIC ISLAND'",
  "Cartoon Snoopy at the Seychelles Anse Source dArgent, hyper-realistic pink granite boulders and sea, POSTER_TITLE:'SEYCHELLES ANSE SOURCE DARGENT'",
  "Cartoon Snoopy at the Seychelles Vallee de Mai, hyper-realistic coco de mer palm and rare black parrot, POSTER_TITLE:'SEYCHELLES VALLEE DE MAI'",
  "Cartoon Snoopy at Mauritius underwater waterfall illusion, hyper-realistic sand cascade from above, POSTER_TITLE:'MAURITIUS UNDERWATER WATERFALL ILLUSION'",
  "Cartoon Snoopy at Aldabra Atoll Seychelles, hyper-realistic giant tortoises and pristine reef, POSTER_TITLE:'ALDABRA ATOLL SEYCHELLES'",
  "Cartoon Snoopy at the Comoros islands, hyper-realistic ylang ylang fields and volcanic bay, POSTER_TITLE:'COMOROS ISLANDS'",
  "Cartoon Snoopy at the Azores whale watching, hyper-realistic sperm whale dive from rib boat, POSTER_TITLE:'AZORES WHALE WATCHING'",
  "Cartoon Snoopy in the Macaronesian laurisilva Madeira, hyper-realistic ancient cloud forest levada path, POSTER_TITLE:'MACARONESIAN LAURISILVA MADEIRA'",
  "Cartoon Snoopy at the Tenerife Teide volcano, hyper-realistic sea of clouds and summit at sunrise, POSTER_TITLE:'TENERIFE TEIDE VOLCANO'",
  "Cartoon Snoopy at Lanzarote lava fields Canary Islands, hyper-realistic black lunar landscape and vineyards, POSTER_TITLE:'LANZAROTE LAVA FIELDS CANARY'",
  "Cartoon Snoopy at Gran Canaria Roque Nublo, hyper-realistic volcanic monolith and island panorama, POSTER_TITLE:'GRAN CANARIA ROQUE NUBLO'",
  "Cartoon Snoopy at La Palma Roque de los Muchachos, hyper-realistic highest point and observatory, POSTER_TITLE:'LA PALMA ROQUE DE'",
  "Cartoon Snoopy at the Waitakere Ranges Auckland New Zealand, hyper-realistic black sand beach and kauri forest, POSTER_TITLE:'WAITAKERE RANGES AUCKLAND NEW'",
  "Cartoon Snoopy at the Kaikoura mountains and sea New Zealand, hyper-realistic dusky dolphins and snow peaks, POSTER_TITLE:'KAIKOURA MOUNTAINS AND SEA'",
  "Cartoon Snoopy at Whanganui River New Zealand canoe, hyper-realistic jungle river and bridge to nowhere, POSTER_TITLE:'WHANGANUI RIVER NEW ZEALAND'",
  "Cartoon Snoopy at Rotorua New Zealand geothermal, hyper-realistic boiling mud pools and Maori carvings, POSTER_TITLE:'ROTORUA NEW ZEALAND GEOTHERMAL'",
  "Cartoon Snoopy at Cape Palliser New Zealand, hyper-realistic fur seal colony and lighthouse, POSTER_TITLE:'CAPE PALLISER NEW ZEALAND'",
  "Cartoon Snoopy at the Ruapehu volcano New Zealand ski, hyper-realistic snowy crater lake and clouds, POSTER_TITLE:'RUAPEHU VOLCANO NEW ZEALAND'",
  "Cartoon Snoopy at the Manawatu Gorge New Zealand, hyper-realistic dramatic river gorge and tui birds, POSTER_TITLE:'MANAWATU GORGE NEW ZEALAND'",
  "Cartoon Snoopy at Nugget Point New Zealand lighthouse, hyper-realistic wave-lashed rocks and gannets, POSTER_TITLE:'NUGGET POINT NEW ZEALAND'",
  "Cartoon Snoopy at the Catlins waterfalls New Zealand, hyper-realistic podocarp forest and hidden cascades, POSTER_TITLE:'CATLINS WATERFALLS NEW ZEALAND'",
  "Cartoon Snoopy at Stewart Island New Zealand, hyper-realistic southern kiwi and aurora australis, POSTER_TITLE:'STEWART ISLAND NEW ZEALAND'",
  "Snoopy and Woodstock in a vintage photo booth making funny faces",
  "Snoopy and Woodstock at a farmers market on a sunny Saturday morning",
  "Snoopy and Woodstock in a pottery studio throwing clay on wheels",
  "Snoopy and Woodstock in a wildflower honey bee meadow",
  "Snoopy and Woodstock doing a science experiment with colorful reactions",
  "Snoopy and Woodstock at a midnight diner after a long day",
  "Snoopy and Woodstock bird watching at a misty lake at sunrise",
  "Snoopy and Woodstock learning to tango in an Argentine dance hall",
  "Snoopy and Woodstock at a sunset sailboat cruise on a calm bay",
  "Snoopy and Woodstock in a redwood treehouse overlooking fog-filled valley",
  "Snoopy and Woodstock riding vintage carousel horses at a county fair",
  "Snoopy and Woodstock making a time capsule in the backyard",
  "Snoopy and Woodstock at a meteor shower on a rooftop with telescopes",
  "Snoopy and Woodstock in a coastal lighthouse keeper cottage in a storm",
  "Snoopy and Woodstock feeding ducks at a peaceful city park pond",
  "Snoopy and Woodstock in a pumpkin patch corn maze at twilight",
  "Snoopy and Woodstock on a dog sled through a snowy birch forest",
  "Snoopy and Woodstock at a cherry picking orchard in Japan spring",
  "Snoopy and Woodstock building a kite and flying it on a breezy hill",
  "Snoopy and Woodstock at a rooftop garden watering tomatoes at dawn",
  "Snoopy and Woodstock in a hot spring pool in the mountains at night",
  "Snoopy and Woodstock at a pier carnival with lights over the ocean",
  "Snoopy and Woodstock searching tide pools for sea creatures at low tide",
  "Snoopy and Woodstock in a mountain cabin making hot cocoa in a snowstorm",
  "Snoopy and Woodstock at a night baseball game under stadium lights",
  "Snoopy and Woodstock learning origami in a Japanese paper shop",
  "Snoopy and Woodstock at a harvest moon bonfire in an open field",
  "Snoopy and Woodstock riding a Ferris wheel at sunset over the city",
  "Snoopy and Woodstock in a snow globe paperweight magically come to life",
  "Snoopy and Woodstock celebrating finishing a puzzle at a rainy window",
  "Snoopy and Woodstock on a porch swing drinking sweet tea in the South",
  "Snoopy and Woodstock finding a message in a bottle on a deserted shore",
  "Snoopy and Woodstock making wind chimes in a garden workshop",
  "Snoopy and Woodstock at a street painting festival doing chalk art",
  "Snoopy and Woodstock at a community garden planting season together",
  "Snoopy and Woodstock releasing sky lanterns over a lakeside",
  "Snoopy and Woodstock at a beachside bonfire with stars overhead",
  "Snoopy and Woodstock picking blackberries in a country lane in summer",
  "Snoopy and Woodstock at a silent disco wearing headphones on a rooftop",
  "Snoopy and Woodstock in a canyon slot reading shadows in the afternoon",
  "Snoopy and Woodstock at a Japanese ramen street in winter steam",
  "Snoopy and Woodstock on a tandem surfboard at a sunrise session",
  "Snoopy and Woodstock in a flower market at dawn buying tulips",
  "Snoopy and Woodstock night fishing on a calm moonlit lake",
  "Snoopy and Woodstock building a fire tower signal on a mountain peak",
  "Snoopy and Woodstock in a desert at dawn watching a perfect sunrise",
  "Snoopy and Woodstock toasting marshmallows under a meteor shower",
  "Snoopy and Woodstock in a canoe exploring a jungle river",
  "Snoopy and Woodstock at a ski resort hot tub watching mountain alpenglow",
  "Snoopy and Woodstock in a lavender farm making sachets together",
  "Snoopy and Woodstock catching fireflies in mason jars at dusk",
  "Snoopy and Woodstock at a harbor watching tall ships race",
  "Snoopy and Woodstock in a mountain wildflower meadow painting plein air",
  "Snoopy and Woodstock foraging mushrooms in a misty autumn forest",
  "Snoopy and Woodstock at a spring peach orchard in full pink bloom",
  "Snoopy and Woodstock building a raft and floating down a calm river",
  "Snoopy and Woodstock watching a spectacular sunrise from a mesa top",
  "Snoopy and Woodstock in a bookshop with a sleeping cat by the fire",
  "Snoopy and Woodstock at a farmers market honey and preserves stall",
  "Snoopy and Woodstock riding bikes through a covered bridge in New England",
  "Snoopy and Woodstock at a drive-through movie with hot dogs and soda",
  "Snoopy and Woodstock making sand angels on a deserted winter beach",
  "Snoopy and Woodstock in a lush greenhouse on a cold rainy day",
  "Snoopy and Woodstock taking a nap under a spreading oak tree in summer",
  "Snoopy and Woodstock at a lighthouse on a foggy New England morning",
  "Snoopy and Woodstock at a patio dinner with candles and string lights",
  "Snoopy and Woodstock at a folk art fair with handmade quilts and crafts",
  "Snoopy and Woodstock in a sunlit dory boat rowing through a lily pond",
  "Snoopy and Woodstock building an epic snowman with personality",
  "Snoopy and Woodstock at a rain puddle jumping contest in rubber boots",
  "Snoopy and Woodstock stargazing from a floating dock on a quiet lake",
  "Snoopy and Woodstock at a spring maple syrup sugarbush tapping trees",
  "Snoopy and Woodstock in a hammock between coconut palms on a beach",
  "Snoopy and Woodstock at a ski jump watching from cozy lodge",
  "Snoopy and Woodstock in a cactus garden at a desert botanical park",
  "Snoopy and Woodstock at a tropical fish market at dawn with color",
  "Snoopy and Woodstock watching a pod of dolphins from a sailboat",
  "Snoopy and Woodstock at a coastal clambake on a rocky Maine beach",
  "Snoopy and Woodstock in a treehouse studio writing songs in the rain",
  "Snoopy and Woodstock at a spring kite festival on a windy green hill",
  "Snoopy and Woodstock at a retro roller rink with disco lights spinning",
  "Snoopy and Woodstock in a bakery at dawn watching bread come out of oven",
  "Snoopy and Woodstock watching a classic car parade on Main Street",
  "Snoopy and Woodstock at a rooftop cinema under the stars in summer",
  "Snoopy and Woodstock in a peach orchard eating ripe fruit in July",
  "Snoopy and Woodstock on a snowy toboggan hill shrieking with joy",
  "Snoopy and Woodstock watching an airshow from the grass below",
  "Snoopy and Woodstock in a misty vineyard at harvest time treading grapes",
  "Snoopy and Woodstock at a warm autumn cider mill with donuts",
  "Snoopy and Woodstock at a rural stargazing festival in a dark sky preserve",
  "Snoopy and Woodstock in a pine forest after first snow quiet and still",
  "Snoopy and Woodstock watching humpback whales from a zodiac boat",
  "Snoopy and Woodstock at a roadside cherry stand in summer sunshine",
  "Snoopy and Woodstock in a lemon grove in Sicily at golden hour",
  "Snoopy and Woodstock at a rooftop garden with a city view at dusk",
  "Snoopy and Woodstock discovering a glowworm grotto in a forest cave",
  "Snoopy and Woodstock celebrating the first day of spring in a park",
  "Snoopy and Woodstock at a moonrise over the ocean on a cliff",
  "Snoopy and Woodstock making elderflower cordial in a country cottage",
  "Snoopy and Woodstock at a small town parade on the Fourth of July",
  "Snoopy and Woodstock at a winter solstice bonfire celebration",
  "Snoopy and Woodstock skipping stones across a mountain stream at dusk",
  "Snoopy and Woodstock at a spring cherry blossom tea ceremony",
  "Snoopy and Woodstock surfing a longboard at a perfect dawn session",
  "Snoopy and Woodstock at a lakeside family reunion with homemade pie",
  "Snoopy and Woodstock in a field of California poppies at peak bloom",
  "Snoopy and Woodstock night snorkeling in a warm tropical lagoon",
  "Snoopy and Woodstock at a cozy Welsh pub in the rain with log fire",
  "Snoopy and Woodstock watching a blue moon rise over the open sea",
  "Snoopy and Woodstock on a morning walk in a misty meadow with dew",
  "Snoopy and Woodstock at a summer evening firefly meadow in Tennessee",
  "Snoopy and Woodstock exploring sea caves at low tide on a rugged coast",
  "Snoopy and Woodstock at a traditional Scottish Highland Games",
  "Snoopy and Woodstock in a Japanese cedar forest with dappled light",
  "Snoopy and Woodstock at a rooftop New Year fireworks and champagne",
  "Snoopy and Woodstock on a coastal trail with wildflowers in spring wind",
  "Snoopy and Woodstock at an Alaskan fish camp during salmon run",
  "Snoopy and Woodstock in a eucalyptus forest watching koalas sleep",
  "Snoopy and Woodstock at a street carnival in Brazil with samba music",
  "Snoopy and Woodstock finding a perfect four-leaf clover field",
  "Snoopy and Woodstock at a night market in Taiwan with bubble tea",
  "Snoopy and Woodstock in a Bavarian village at Christmas market",
  "Snoopy and Woodstock on a canoe watching a moose in Canadian lake",
  "Snoopy and Woodstock in a sunlit wheat field watching a combine harvest",
  "Snoopy and Woodstock at a perfect snowy morning opening Christmas gifts",
  "Snoopy and Woodstock making maple candy at a Vermont sugar house",
  "Snoopy and Woodstock watching the Super Blood Moon from a hillside",
  "Snoopy and Woodstock at a winery harvest stomping grapes laughing",
  "Snoopy and Woodstock at a coastal New England lobster boil at sunset",
  "Snoopy and Woodstock in a hot chocolate shop on a snowy city street",
  "Snoopy and Woodstock at a Hawaiian slack key guitar by the ocean fire",
  "Snoopy and Woodstock in a mountain alpine hut eating cheese fondue",
  "Snoopy and Woodstock at a desert night sky party with telescopes",
  "Snoopy and Woodstock in a moss-covered Irish stone cottage in the rain",
  "Snoopy and Woodstock at a wildflower super bloom in California hills",
  "Snoopy and Woodstock on a lazy summer river float with inner tubes",
  "Snoopy and Woodstock at an outdoor Shakespeare play at twilight",
  "Snoopy and Woodstock at a Mardi Gras parade catching beads",
  "Snoopy and Woodstock in a mountain town Christmas parade with snow",
  "Snoopy and Woodstock at a harvest festival square dance with fiddle",
  "Snoopy and Woodstock on a Vermont covered bridge in peak foliage",
  "Snoopy and Woodstock at a Scandinavian midsummer celebration with wreath",
  "Snoopy and Woodstock in a rowboat on a mirror-still alpine lake at dawn",
  "Snoopy and Woodstock at a traditional Japanese New Year shrine visit",
  "Snoopy and Woodstock at a Kentucky Derby with mint juleps and hats",
  "Snoopy and Woodstock watching a pod of narwhals in Arctic waters",
  "Snoopy and Woodstock at an Icelandic horse farm in autumn",
  "Snoopy and Woodstock on a ferry watching island hopping in Greece",
  "Snoopy and Woodstock at a glacier hike in New Zealand in crampons",
  "Snoopy and Woodstock in a Japanese izakaya after work with lanterns",
  "Snoopy and Woodstock at a Louisiana bayou sunset fishing",
  "Snoopy and Woodstock at a high alpine pass watching eagle soar",
  "Snoopy and Woodstock in a Pacific Northwest old growth forest cathedral",
  "Snoopy and Woodstock at a summer outdoor opera in an Italian piazza",
  "Snoopy and Woodstock making a paper boat and floating it down a creek",
  "Snoopy and Woodstock at a spring sunrise on the Lincoln Memorial steps",
  "Snoopy and Woodstock in a Turkish carpet bazaar with colorful patterns",
  "Snoopy and Woodstock at a twilight firefly show in a Southern swamp",
  "Snoopy and Woodstock on a surfboard at dawn in mist watching sun rise",
  "Snoopy and Woodstock hiking through autumn aspens in Colorado gold",
  "Cartoon Snoopy at the Dolomite Tre Cime di Lavaredo Italy, hyper-realistic three rock towers and alpenglow, POSTER_TITLE:'DOLOMITE TRE CIME DI'",
  "Cartoon Snoopy at the Trollfjord Norway, hyper-realistic narrow mountain fjord and eagle, POSTER_TITLE:'TROLLFJORD NORWAY'",
  "Cartoon Snoopy at the Aysgarth Falls Yorkshire England, hyper-realistic tiered limestone waterfalls, POSTER_TITLE:'AYSGARTH FALLS YORKSHIRE ENGLAND'",
  "Cartoon Snoopy at the Dettifoss waterfall Iceland, hyper-realistic most powerful European waterfall, POSTER_TITLE:'DETTIFOSS WATERFALL ICELAND'",
  "Cartoon Snoopy at the Pamukkale terraces Turkey, hyper-realistic white calcium pools and ruins, POSTER_TITLE:'PAMUKKALE TERRACES TURKEY'",
  "Cartoon Snoopy at the Kalalau Valley Hawaii, hyper-realistic inaccessible valley and towering green cliffs, POSTER_TITLE:'KALALAU VALLEY HAWAII'",
  "Cartoon Snoopy at Skeleton Coast Namibia seal colony, hyper-realistic Cape fur seals and Atlantic mist, POSTER_TITLE:'SKELETON COAST NAMIBIA SEAL'",
  "Cartoon Snoopy at the Tian Chi Heaven Lake China, hyper-realistic volcanic crater lake and snow, POSTER_TITLE:'TIAN CHI HEAVEN LAKE'",
  "Cartoon Snoopy at Pico Island Azores vineyards, hyper-realistic black lava wall vineyards and Atlantic, POSTER_TITLE:'PICO ISLAND AZORES VINEYARDS'",
  "Cartoon Snoopy at the Crooked Forest Poland, hyper-realistic mysteriously bent pine trees, POSTER_TITLE:'CROOKED FOREST POLAND'",
  "Snoopy and Woodstock at a taco truck on a perfect California afternoon",
  "Snoopy and Woodstock in a wildflower canyon in Utah at peak bloom",
  "Snoopy and Woodstock at a community pond skating rink with hot cider",
  "Snoopy and Woodstock watching the Perseverance rover land on Mars",
  "Snoopy and Woodstock at a thunderstorm chasing the perfect lightning shot",
  "Snoopy and Woodstock in a forest bathing walk through Japanese cedar",
  "Snoopy and Woodstock at a foggy San Francisco morning with dim sum",
  "Snoopy and Woodstock learning to surf at a tropical beach school",
  "Snoopy and Woodstock at a New England autumn apple cider donut stand",
  "Snoopy and Woodstock at a southern porch sweet tea and firefly evening",
  "Snoopy and Woodstock in a Paris bookshop finding the perfect book",
  "Snoopy and Woodstock watching a spectacular Alaskan aurora from a yurt",
  "Snoopy and Woodstock at a midnight Hawaiian luau with fire dancers",
  "Snoopy and Woodstock in a Bavarian beer garden in summer afternoon",
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
      .resize(2000, 2500)
      .jpeg({ quality: 90 })
      .toBuffer();
    console.log("Image cropped to 4:5 (" + width + "x" + height + " -> 2000x2500)");
    return outputBuffer.toString("base64");
}

async function generateListing(prompt) {
    console.log("Generating listing content...");
    // Strip POSTER_TITLE marker from listing prompt — not needed for text generation
    var cleanPrompt = prompt.replace(/,\s*POSTER_TITLE:'[^']*'/, '').trim();
    var res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + NB_API_KEY,
      {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                        contents: [{ parts: [{ text: "Based on this Snoopy and Woodstock art description: \"" + cleanPrompt + "\"\n\nGenerate an optimized Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n \"title\": \"Etsy optimized title under 80 chars. Format: Snoopy Woodstock [Scene] Canvas Print Peanuts [Theme] Wall Decor. NO dashes, NO hyphens, NO special characters.\",\n \"description\": \"3 engaging paragraphs about this specific artwork scene, the canvas print quality, and who would love it as a gift.\",\n \"tags\": [\"IMPORTANT: exactly 13 tags, each tag must be under 20 characters, no special characters, focused on Snoopy Peanuts and the specific scene. Examples: Snoopy wall art, Peanuts poster, Woodstock print, Snoopy gift, Peanuts decor, cartoon art print, Snoopy canvas, kids room art, Peanuts fan gift, Snoopy lover, beagle wall art, nursery art, Peanuts artwork\"]\n}" }] }],
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

    // Check if this is a location poster with a title
    var titleMatch = prompt.match(/POSTER_TITLE:'([^']+)'/);
    var locationTitle = titleMatch ? titleMatch[1] : null;
    var cleanPrompt = prompt.replace(/,\s*POSTER_TITLE:'[^']*'/, '').trim();

    var imageSuffix;
    if (locationTitle) {
        // Location poster: allow title text, styled to match the image palette
        imageSuffix = " Generate as a tall vertical portrait travel poster artwork in 4:5 aspect ratio, taller than wide. "
            + "Fill the entire frame edge to edge with no white borders, no margins. "
            + "At the bottom of the image, include the location name '" + locationTitle + "' as bold stylized poster title text, "
            + "colored to complement the image palette (e.g. if the scene is warm golden, use warm gold or cream text; "
            + "if cool blue ocean, use white or light blue text). "
            + "The text should look like a vintage travel poster title — clean, bold, all caps, elegant. "
            + "No other text, no taglines, no URLs. Suitable for canvas wall art print.";
    } else {
        // Standard prompt: no text at all
        imageSuffix = " Generate as a tall vertical portrait poster artwork in 4:5 aspect ratio, taller than wide. "
            + "Fill the entire frame edge to edge with no white borders, no margins, no shadows, no drop shadows, "
            + "no perspective distortion, completely flat design. Suitable for canvas wall art print. "
            + "No text, no words, no letters.";
    }

    var res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + NB_API_KEY,
      {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                        contents: [{ parts: [{ text: cleanPrompt + imageSuffix }] }],
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
    console.log("Image generated successfully" + (locationTitle ? " (location title: " + locationTitle + ")" : ""));
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
                  print_areas: print_areas,
                  images: [{ id: imageId, x: 0.5, y: 0.5, scale: 1.0, angle: 0, is_default: true, is_selected_for_publishing: true, position: "front", variant_ids: VERTICAL_VARIANTS.map(function(v) { return v.id; }) }]
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
          if (externalId) {
                  return true;
          }
          if (status === "failed") {
                  throw new Error("Publishing failed (status=failed) — check Printify→Etsy connection in Printify dashboard");
          }
    }
    console.log("\u2713 Publish response was 200 OK \u2014 treating as published (external.id sync delay).");
    console.log("  Product " + productId + " should be live on Etsy shortly.");
    return true;
}

async function toggleOffsiteAds(productId, options) {
    options = options || {};
    var mod = getOffsiteAdsModule();
    if (!mod) { return; }
    var enable = options.enable !== undefined ? options.enable : OFFSITE_ADS_ENABLED;
    var action = enable ? 'Enabling' : 'Disabling';
    console.log('\n[automation] ' + action + ' Etsy offsite ads for product ' + productId + '...');
    try {
        if (!options.skipPublishWait) {
                await new Promise(function(r) { setTimeout(r, 10000); });
        }
        var result = await mod.setOffsiteAds(productId, enable, { retries: 3 });
        if (result.changed) {
                console.log('[automation] \u2713 Offsite ads ' + (result.newState ? 'ENABLED' : 'DISABLED') + ' for product ' + productId);
        } else {
                console.log('[automation] \u2713 Offsite ads already ' + (result.newState ? 'ENABLED' : 'DISABLED') + ' for product ' + productId + ' \u2014 no change needed');
        }
    } catch (err) {
        console.error('[automation] \u2717 Offsite ads toggle failed for ' + productId + ': ' + err.message);
        console.error('[automation] The listing was published successfully. Toggle it manually in Printify.');
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
        console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
        console.log(' Already on Etsy (' + (i + 1) + '/' + onEtsy.length + ')');
        console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
        console.log('Product:', p.id);
        console.log('Title:', (p.title || '').substring(0, 60));
        try {
                await toggleOffsiteAds(p.id, { skipPublishWait: true, enable: adsState });
                toggledOnly.push(p.id);
                if (i < onEtsy.length - 1) await new Promise(function(r) { setTimeout(r, 3000); });
        } catch (err) {
                console.error('\u2717 Ads toggle failed for ' + p.id + ':', err.message);
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
        console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
        console.log(' Unpublished draft (' + (i + 1) + '/' + toProcess.length + ')');
        console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
        console.log('Product:', p.id);
        console.log('Title:', (p.title || '').substring(0, 60));
        try {
                var didPublish = await publishToEtsy(p.id);
                if (didPublish) {
                          console.log('\u2713 Published to Etsy:', p.id);
                          publishedNow.push(p.id);
                }
                await toggleOffsiteAds(p.id, { skipPublishWait: !didPublish, enable: adsState });
                if (i < toProcess.length - 1) await new Promise(function(r) { setTimeout(r, 10000); });
        } catch (err) {
                console.error('\u2717 Draft ' + p.id + ' failed:', err.message);
        }
    }
    return publishedNow;
}

async function runAdsOnly(enable) {
    require('./config').validateForPlaywright();
    console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
    console.log(' Ads-only mode \u2014 Etsy-published canvas products');
    console.log(' Target: ads ' + (enable ? 'ON' : 'OFF'));
    console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n');
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
    var publishedNew = [];
    if (newSlots > 0) {
          var prompts = pickPrompts().slice(0, newSlots);
          console.log('\nCreating ' + prompts.length + ' new listing(s) from prompts\n');
          for (var i = 0; i < prompts.length; i++) {
              var prompt = prompts[i];
              console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
              console.log(' New listing ' + (i + 1) + ' of ' + prompts.length);
              console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
              console.log('Prompt:', prompt.substring(0, 100));
              try {
                        var listing = await retry(function() { return generateListing(prompt); });
                        var base64Img = await retry(function() { return generateImage(prompt); });
                        var imageId = await uploadToPrintify(base64Img);
                        var productId = await createProduct(imageId, listing);
                        createdNew.push(productId);
                        await new Promise(function(r) { setTimeout(r, 15000); });
                        var didPublish = await publishToEtsy(productId);
                        if (didPublish) {
                                    console.log('\u2713 Listing live on Etsy! Product ID:', productId);
                                    publishedNew.push(productId);
                        }
                        await toggleOffsiteAds(productId, { skipPublishWait: !didPublish, enable: OFFSITE_ADS_ENABLED });
                        if (i < prompts.length - 1) await new Promise(function(r) { setTimeout(r, 10000); });
              } catch (err) {
                        console.error('\u2717 New listing ' + (i + 1) + ' failed:', err.message);
              }
          }
    } else if (!SKIP_NEW_LISTINGS) {
          console.log('\nNo new listings to create (drafts filled the daily quota or DAILY_NEW_LISTINGS=0).');
    }

    var mod = getOffsiteAdsModule();
    if (mod) await mod.closeBrowser();

    console.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
    console.log(' Done!');
    console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
    console.log(' On Etsy (ads only)  : ' + existing.toggledOnly.length);
    console.log(' Drafts published    : ' + publishedFromDrafts.length);
    console.log(' New products created: ' + createdNew.length);
    console.log(' New live on Etsy    : ' + publishedNew.length);
    if (createdNew.length > publishedNew.length) {
          var unpublishedIds = createdNew.filter(function(id) { return publishedNew.indexOf(id) === -1; });
          console.log(' \u26a0 Saved as drafts   : ' + unpublishedIds.join(', '));
          console.log(' \u26a0 To fix: reconnect Etsy in Printify dashboard \u2192 Sales Channels');
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
