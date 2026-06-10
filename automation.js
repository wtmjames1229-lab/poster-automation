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
  // ── 500 ACTIVITY: cartoon Snoopy doing an activity, hyper-realistic background ──
  "Cartoon Snoopy riding a massive barrel wave surfing, hyper-realistic ocean spray and deep blue water",
  "Cartoon Snoopy shredding a halfpipe on a skateboard, hyper-realistic concrete skatepark",
  "Cartoon Snoopy doing a powder run down a steep ski slope, hyper-realistic snow-dusted pine forest",
  "Cartoon Snoopy riding a longboard at sunset on a coastal road, hyper-realistic Pacific cliffs",
  "Cartoon Snoopy kitesurfing over crystal water, hyper-realistic turquoise tropical lagoon",
  "Cartoon Snoopy paragliding above green valleys, hyper-realistic Alpine scenery below",
  "Cartoon Snoopy bouldering on a granite rock face, hyper-realistic Yosemite granite walls",
  "Cartoon Snoopy free diving in a coral reef, hyper-realistic tropical fish and coral",
  "Cartoon Snoopy doing a backflip on a wakeboard, hyper-realistic lake spray and summer sky",
  "Cartoon Snoopy mountain biking a red dirt singletrack, hyper-realistic canyon landscape",
  "Cartoon Snoopy kayaking through a glowing sea cave, hyper-realistic turquoise water",
  "Cartoon Snoopy ice skating on a frozen alpine lake, hyper-realistic mountain reflection",
  "Cartoon Snoopy fly fishing at sunrise on a glassy river, hyper-realistic mist and forest",
  "Cartoon Snoopy doing yoga at sunrise on a sea cliff, hyper-realistic ocean horizon",
  "Cartoon Snoopy running a marathon through autumn city streets, hyper-realistic fall foliage",
  "Cartoon Snoopy rock climbing a sea cliff at dusk, hyper-realistic crashing waves below",
  "Cartoon Snoopy zip-lining through a jungle canopy, hyper-realistic tropical rainforest",
  "Cartoon Snoopy snowboarding through deep powder in a mountain bowl, hyper-realistic snow",
  "Cartoon Snoopy windsurfing in a bay, hyper-realistic whitecaps and coastal cliffs",
  "Cartoon Snoopy doing BMX tricks in a concrete bowl, hyper-realistic urban skatepark",
  "Cartoon Snoopy horseback riding through a wildflower meadow, hyper-realistic mountain backdrop",
  "Cartoon Snoopy kayak surfing a river wave, hyper-realistic whitewater and canyon walls",
  "Cartoon Snoopy cliff jumping into a pristine lake, hyper-realistic turquoise water below",
  "Cartoon Snoopy doing aerial tricks off a snowboard kicker, hyper-realistic mountain pipe",
  "Cartoon Snoopy paddleboarding at golden hour, hyper-realistic glassy lake and sunset",
  "Cartoon Snoopy riding a motocross bike over a jump, hyper-realistic red dirt track",
  "Cartoon Snoopy doing a handstand on a longboard surfboard, hyper-realistic perfect beach break",
  "Cartoon Snoopy trail running through a redwood forest, hyper-realistic ancient towering trees",
  "Cartoon Snoopy playing beach volleyball at tropical sunset, hyper-realistic golden beach",
  "Cartoon Snoopy doing open water swimming, hyper-realistic ocean swells and blue sky",
  "Cartoon Snoopy playing drums on a concert stage, hyper-realistic roaring crowd and stage lights",
  "Cartoon Snoopy playing electric guitar in a spotlight, hyper-realistic smoky club interior",
  "Cartoon Snoopy conducting an orchestra, hyper-realistic grand concert hall balconies",
  "Cartoon Snoopy spinning records as a DJ, hyper-realistic nightclub neon and fog",
  "Cartoon Snoopy playing saxophone on a Harlem street corner, hyper-realistic New York brownstones",
  "Cartoon Snoopy playing piano in a jazz club, hyper-realistic warm amber light and bourbon",
  "Cartoon Snoopy playing bass in a rock band, hyper-realistic sold-out arena and pyrotechnics",
  "Cartoon Snoopy playing violin in a Paris park, hyper-realistic garden in bloom",
  "Cartoon Snoopy beatboxing on a Brooklyn stoop, hyper-realistic urban summer street",
  "Cartoon Snoopy playing acoustic guitar by a campfire, hyper-realistic starry forest",
  "Cartoon Snoopy painting a massive city mural, hyper-realistic urban brick wall and scaffold",
  "Cartoon Snoopy sculpting marble in an Italian studio, hyper-realistic Renaissance workshop",
  "Cartoon Snoopy taking street photography in Tokyo rain, hyper-realistic neon reflections",
  "Cartoon Snoopy throwing pottery on a wheel, hyper-realistic sunlit ceramics studio",
  "Cartoon Snoopy painting plein air in Tuscany, hyper-realistic rolling vineyard landscape",
  "Cartoon Snoopy doing graffiti art in a tunnel, hyper-realistic colorful spray-paint walls",
  "Cartoon Snoopy drawing manga in a Tokyo cafe, hyper-realistic cozy Japanese coffee shop",
  "Cartoon Snoopy weaving on a loom in a workshop, hyper-realistic colorful textile studio",
  "Cartoon Snoopy doing glassblowing in a Venice furnace, hyper-realistic molten glass glow",
  "Cartoon Snoopy silk-screening posters in a studio, hyper-realistic ink and press workshop",
  "Cartoon Snoopy cooking at a professional stove, hyper-realistic Michelin-star kitchen",
  "Cartoon Snoopy making fresh pasta by hand, hyper-realistic Italian countryside kitchen",
  "Cartoon Snoopy flipping burgers at a backyard BBQ, hyper-realistic summer cookout and smoke",
  "Cartoon Snoopy decorating a cake with precision, hyper-realistic patisserie interior",
  "Cartoon Snoopy shaking cocktails at a speakeasy bar, hyper-realistic 1920s interior",
  "Cartoon Snoopy brewing pour-over coffee at a specialty bar, hyper-realistic beautiful cafe",
  "Cartoon Snoopy making ramen in a tiny Tokyo kitchen, hyper-realistic steam and broth",
  "Cartoon Snoopy grilling at a Brazilian churrascaria, hyper-realistic open fire and coals",
  "Cartoon Snoopy rolling sushi at an omakase counter, hyper-realistic Japanese restaurant",
  "Cartoon Snoopy baking sourdough in a stone oven, hyper-realistic artisan bakery at dawn",
  "Cartoon Snoopy tending beehives in a wildflower meadow, hyper-realistic golden afternoon",
  "Cartoon Snoopy planting a garden in spring, hyper-realistic cottage garden in full bloom",
  "Cartoon Snoopy picking coffee on a mountain farm, hyper-realistic Colombian highland mist",
  "Cartoon Snoopy harvesting grapes in Bordeaux, hyper-realistic vineyard golden hour",
  "Cartoon Snoopy fly fishing in a Montana river, hyper-realistic crystal water and mountains",
  "Cartoon Snoopy foraging mushrooms in a misty forest, hyper-realistic Pacific Northwest",
  "Cartoon Snoopy beachcombing at low tide, hyper-realistic rocky Maine coastline",
  "Cartoon Snoopy birdwatching in a tropical wetland, hyper-realistic flamingos and reeds",
  "Cartoon Snoopy stargazing through a telescope, hyper-realistic Milky Way and dark sky desert",
  "Cartoon Snoopy tending a rooftop garden, hyper-realistic city skyline at dusk behind",
  "Cartoon Snoopy reading a book under a cherry blossom tree, hyper-realistic Japan spring",
  "Cartoon Snoopy writing in a journal at a Paris sidewalk cafe, hyper-realistic Seine background",
  "Cartoon Snoopy meditating on a rocky ocean cliff, hyper-realistic sunrise and sea mist",
  "Cartoon Snoopy doing tai chi in a bamboo forest, hyper-realistic misty morning light",
  "Cartoon Snoopy reading in a cozy library, hyper-realistic floor-to-ceiling books and firelight",
  "Cartoon Snoopy studying maps in a base camp tent, hyper-realistic Himalayan glacier backdrop",
  "Cartoon Snoopy building a sandcastle on a deserted tropical island, hyper-realistic perfect lagoon",
  "Cartoon Snoopy napping in a hammock between palms, hyper-realistic Caribbean beach and sea",
  "Cartoon Snoopy hiking to a mountain summit at golden hour, hyper-realistic panoramic view",
  "Cartoon Snoopy camping under the northern lights, hyper-realistic aurora and snow wilderness",
  "Cartoon Snoopy roasting marshmallows at a lakeside fire, hyper-realistic Milky Way reflection",
  "Cartoon Snoopy snowshoeing through a pine forest, hyper-realistic winter silence and frost",
  "Cartoon Snoopy watching a storm from a lighthouse, hyper-realistic dramatic waves and clouds",
  "Cartoon Snoopy picking wildflowers in an alpine meadow, hyper-realistic Swiss mountains",
  "Cartoon Snoopy sketching in the Louvre, hyper-realistic grand gallery and masterpiece behind",
  "Cartoon Snoopy doing archery in a forest clearing, hyper-realistic morning light through trees",
  "Cartoon Snoopy driving a vintage convertible on PCH, hyper-realistic California coast",
  "Cartoon Snoopy riding a motorcycle through red rock canyon country, hyper-realistic mesas",
  "Cartoon Snoopy on a steam train through the Rockies, hyper-realistic mountain gorge",
  "Cartoon Snoopy sailing a tall ship in open ocean, hyper-realistic full canvas and sea",
  "Cartoon Snoopy rowing crew on a river at dawn, hyper-realistic misty boathouse scene",
  "Cartoon Snoopy whitewater rafting in a gorge, hyper-realistic Class 5 rapids and canyon",
  "Cartoon Snoopy canoeing in wilderness waters, hyper-realistic northern lake reflection",
  "Cartoon Snoopy dog sledding across the tundra, hyper-realistic Arctic ice and aurora",
  "Cartoon Snoopy hot air ballooning over fairy chimney landscape, hyper-realistic aerial view",
  "Cartoon Snoopy riding a gondola at golden hour, hyper-realistic canal and palazzo reflection",
  "Cartoon Snoopy cycling through tulip fields, hyper-realistic rows of vivid color and windmill",
  "Cartoon Snoopy on a camel at Sahara desert dunes, hyper-realistic golden dunes and stars",
  "Cartoon Snoopy doing a cartwheel on a Caribbean beach, hyper-realistic turquoise water",
  "Cartoon Snoopy hula dancing at a Hawaiian sunset luau, hyper-realistic tropical beach",
  "Cartoon Snoopy doing flamenco in a Moorish courtyard, hyper-realistic fountain and tiles",
  "Cartoon Snoopy breakdancing on a NYC plaza, hyper-realistic urban summer street scene",
  "Cartoon Snoopy doing ballet in a foggy forest clearing, hyper-realistic morning light",
  "Cartoon Snoopy tango dancing in a Buenos Aires alley, hyper-realistic cobblestone and lanterns",
  "Cartoon Snoopy doing parkour across city rooftops, hyper-realistic London skyline at dusk",
  "Cartoon Snoopy learning judo in a Japanese dojo, hyper-realistic cherry blossom courtyard",
  "Cartoon Snoopy boxing in a vintage gym, hyper-realistic leather heavy bags and ring glow",
  "Cartoon Snoopy doing capoeira on a Bahia beach, hyper-realistic Brazil sunset",
  "Cartoon Snoopy fencing in a French academy, hyper-realistic ornate hall and épées",
  "Cartoon Snoopy swimming butterfly in an outdoor pool, hyper-realistic mountain backdrop",
  "Cartoon Snoopy pole vaulting at an Olympic stadium, hyper-realistic track and stadium lights",
  "Cartoon Snoopy shooting hoops at a Venice Beach court, hyper-realistic palm trees and crowd",
  "Cartoon Snoopy pitching at a baseball stadium, hyper-realistic diamond and green outfield",
  "Cartoon Snoopy kicking a field goal at night, hyper-realistic football stadium lights",
  "Cartoon Snoopy taking a penalty kick at a World Cup, hyper-realistic sold-out stadium",
  "Cartoon Snoopy spiking a volleyball at Ipanema beach, hyper-realistic Brazil sunset",
  "Cartoon Snoopy playing ice hockey in a packed arena, hyper-realistic ice and crowd energy",
  "Cartoon Snoopy serving an ace at Wimbledon, hyper-realistic grass court and white crowd",
  "Cartoon Snoopy doing a slam dunk, hyper-realistic NBA arena and roaring crowd",
  "Cartoon Snoopy rowing a single scull at sunrise, hyper-realistic river fog and boathouse",
  "Cartoon Snoopy riding a bicycle downhill in the Alps, hyper-realistic mountain rain and mist",
  "Cartoon Snoopy abseiling a jungle waterfall, hyper-realistic gorge and tropical mist",
  "Cartoon Snoopy canyoneering through a slot canyon, hyper-realistic swirling red sandstone",
  "Cartoon Snoopy sandboarding on massive desert dunes, hyper-realistic Peru desert oasis",
  "Cartoon Snoopy freediving toward a sunken wreck, hyper-realistic clear blue depths",
  "Cartoon Snoopy cave diving with a headlamp, hyper-realistic underground crystal cave",
  "Cartoon Snoopy base jumping from a Dolomite cliff, hyper-realistic aerial mountain view",
  "Cartoon Snoopy wingsuit flying over a Norwegian fjord, hyper-realistic vertical cliff wall",
  "Cartoon Snoopy building a snow cave in Alaska backcountry, hyper-realistic blizzard",
  "Cartoon Snoopy ice fishing on a frozen Minnesota lake, hyper-realistic blue ice and pine",
  "Cartoon Snoopy doing sunrise salutation on a ship deck, hyper-realistic open ocean horizon",
  "Cartoon Snoopy operating a food truck at a night market, hyper-realistic vibrant street scene",
  "Cartoon Snoopy welding in a steel fabrication shop, hyper-realistic sparks and industrial",
  "Cartoon Snoopy woodworking in a timber barn, hyper-realistic sawdust and morning sun",
  "Cartoon Snoopy restoring a vintage car engine in a garage, hyper-realistic classic workshop",
  "Cartoon Snoopy operating a large format camera at a landscape, hyper-realistic scenic view",
  "Cartoon Snoopy directing a film on a movie set, hyper-realistic cinematic studio production",
  "Cartoon Snoopy performing stand-up comedy, hyper-realistic brick-walled comedy club",
  "Cartoon Snoopy reading poetry at an open mic, hyper-realistic candlelit underground venue",
  "Cartoon Snoopy selling art at a Paris riverside stall, hyper-realistic Seine and bridges",
  "Cartoon Snoopy teaching surfing on a beach, hyper-realistic tropical perfect wave",
  "Cartoon Snoopy coaching little league, hyper-realistic American small town baseball field",
  "Cartoon Snoopy working as a park ranger, hyper-realistic national park valley at golden hour",
  "Cartoon Snoopy operating a lighthouse in a storm, hyper-realistic Maine coastline at night",
  "Cartoon Snoopy piloting a biplane over farmland, hyper-realistic patchwork fields below",
  "Cartoon Snoopy captaining a schooner in open sea, hyper-realistic Atlantic storm sky",
  "Cartoon Snoopy driving a vintage steam locomotive, hyper-realistic mountain rail and gorge",
  "Cartoon Snoopy guiding a river expedition raft, hyper-realistic jungle Amazon river",
  "Cartoon Snoopy working a fishing trawler at dawn, hyper-realistic North Atlantic grey sea",
  "Cartoon Snoopy tending vines at a hillside winery, hyper-realistic Tuscany autumn harvest",
  "Cartoon Snoopy riding a bull at a rodeo, hyper-realistic Texas arena and dusty crowd",
  "Cartoon Snoopy roping a calf at a ranch, hyper-realistic open range at sunset",
  "Cartoon Snoopy sheepherding in New Zealand hills, hyper-realistic green hills and flock",
  "Cartoon Snoopy picking apples in a New England orchard, hyper-realistic perfect October day",
  "Cartoon Snoopy plowing a rice paddy with a water buffalo, hyper-realistic Bali terraces",
  "Cartoon Snoopy ice carving at a winter festival, hyper-realistic Quebec ice sculptures",
  "Cartoon Snoopy building an igloo in the Arctic, hyper-realistic ice and aurora sky",
  "Cartoon Snoopy blacksmithing at a glowing forge, hyper-realistic medieval-style smithy",
  "Cartoon Snoopy coopering barrels in a bourbon distillery, hyper-realistic Kentucky rickhouse",
  "Cartoon Snoopy brewing craft beer in a microbrewery, hyper-realistic copper tanks and hops",
  "Cartoon Snoopy distilling whisky in a Scottish highlands distillery, hyper-realistic misty glen",
  "Cartoon Snoopy roasting coffee beans in an Ethiopian highland farm, hyper-realistic sunrise",
  "Cartoon Snoopy picking tea on a Sri Lanka hillside, hyper-realistic mist and emerald slopes",
  "Cartoon Snoopy making olive oil in an ancient Cretan grove, hyper-realistic stone press",
  "Cartoon Snoopy spinning silk at a traditional Kyoto loom, hyper-realistic light and thread",
  "Cartoon Snoopy making cheese in an alpine dairy, hyper-realistic Swiss meadow and cowbells",
  "Cartoon Snoopy tapping maple syrup in Vermont snow, hyper-realistic sugar bush and steam",
  "Cartoon Snoopy diving for pearls in a Polynesian lagoon, hyper-realistic underwater light",
  "Cartoon Snoopy spearfishing in crystal clear Mediterranean water, hyper-realistic rocky seabed",
  "Cartoon Snoopy tracking wildlife in the Serengeti, hyper-realistic savanna and lions",
  "Cartoon Snoopy training sled dogs in Alaska snow, hyper-realistic huskies and pine forest",
  "Cartoon Snoopy mushing through a blizzard, hyper-realistic whiteout and headlamp beam",
  "Cartoon Snoopy doing luge on an Olympic bobsled track, hyper-realistic ice tunnel and speed",
  "Cartoon Snoopy speed skating at a championship oval, hyper-realistic Olympic ice arena",
  "Cartoon Snoopy competing in a biathlon in snow, hyper-realistic Nordic winter landscape",
  "Cartoon Snoopy ski jumping at a Nordic center, hyper-realistic snowy valley crowd below",
  "Cartoon Snoopy doing a floor gymnastics routine, hyper-realistic Olympic arena and beam",
  "Cartoon Snoopy shooting clay pigeons in the English countryside, hyper-realistic green field",
  "Cartoon Snoopy rowing a dragon boat at a harbor festival, hyper-realistic Hong Kong water",
  "Cartoon Snoopy competing in Highland Games, hyper-realistic Scottish heather field",
  "Cartoon Snoopy doing a polar plunge in the winter ocean, hyper-realistic cold beach crowd",
  "Cartoon Snoopy skydiving over a patchwork countryside, hyper-realistic aerial view",
  "Cartoon Snoopy falconing in the Arabian desert, hyper-realistic peregrine and sand dunes",
  "Cartoon Snoopy photographing rare wildlife in the Amazon, hyper-realistic jungle and bird",
  "Cartoon Snoopy doing astrophotography in the Atacama desert, hyper-realistic galaxy",
  "Cartoon Snoopy doing sand art on a beach, hyper-realistic mandala and breaking wave",
  "Cartoon Snoopy constructing a snow sculpture at a winter carnival, hyper-realistic ice fest",
  "Cartoon Snoopy making a kite and flying it on a coastal headland, hyper-realistic strong wind",
  "Cartoon Snoopy fossil hunting on a sea cliff, hyper-realistic limestone layers and coast",
  "Cartoon Snoopy geocaching in a Pacific Northwest old growth forest, hyper-realistic mist",
  "Cartoon Snoopy doing a polar ski expedition, hyper-realistic Antarctic white expanse",
  "Cartoon Snoopy doing deep sea ROV work, hyper-realistic bioluminescent abyss",
  "Cartoon Snoopy planting mangroves on a tropical restoration shore, hyper-realistic project",
  "Cartoon Snoopy releasing sea turtle hatchlings at night, hyper-realistic moonlit beach",
  "Cartoon Snoopy busking with a violin on a cobblestone street, hyper-realistic European square",
  "Cartoon Snoopy playing steel drums on a Caribbean beach, hyper-realistic tropical sunset",
  "Cartoon Snoopy playing bagpipes on a Scottish moor, hyper-realistic heather and highland mist",
  "Cartoon Snoopy playing didgeridoo in the Australian outback, hyper-realistic red rock and sky",
  "Cartoon Snoopy playing sitar in a Rajasthan palace courtyard, hyper-realistic ornate India",
  "Cartoon Snoopy playing kora in a West African village, hyper-realistic sunset and baobab",
  "Cartoon Snoopy riding a giant wave in Portugal, hyper-realistic 50-foot wave and cliff",
  "Cartoon Snoopy surfing in the Maldives, hyper-realistic overwater bungalows and crystal sea",
  "Cartoon Snoopy longboard surfing at a tropical point break, hyper-realistic perfect nose ride",
  "Cartoon Snoopy surfing a perfect Fiji barrel, hyper-realistic coral reef and emerald water",
  "Cartoon Snoopy dawn patrol surfing in cold Maine, hyper-realistic foggy shore and pink sky",
  "Cartoon Snoopy surfing an urban river wave, hyper-realistic city bridge and riparian scene",
  "Cartoon Snoopy night surfing with glowing board, hyper-realistic phosphorescent ocean",
  "Cartoon Snoopy tandem surfing with Woodstock, hyper-realistic Waikiki blue water and Diamond Head",
  "Cartoon Snoopy racing a stock car at Daytona, hyper-realistic oval track and grandstand",
  "Cartoon Snoopy drag racing a hot rod, hyper-realistic strip and burnout smoke",
  "Cartoon Snoopy rally racing through a forest stage, hyper-realistic mud and pine trees",
  "Cartoon Snoopy riding a dirt bike through sand dunes, hyper-realistic Baja desert",
  "Cartoon Snoopy competing in obstacle course racing, hyper-realistic mud and cargo nets",
  "Cartoon Snoopy doing an ultramarathon at night, hyper-realistic mountain headlamp trail",
  "Cartoon Snoopy competing in a cyclocross race, hyper-realistic muddy autumn field",
  "Cartoon Snoopy doing velodrome track cycling, hyper-realistic banked wooden track",
  "Cartoon Snoopy doing indoor climbing on an overhang, hyper-realistic modern climbing gym",
  "Cartoon Snoopy competing in slacklining over a gorge, hyper-realistic valley below",
  "Cartoon Snoopy doing acrobatics in a silk rigging, hyper-realistic big top circus tent",
  "Cartoon Snoopy juggling fire on a beach at night, hyper-realistic ocean fire reflection",
  "Cartoon Snoopy competing in ultimate frisbee, hyper-realistic college campus summer",
  "Cartoon Snoopy playing disc golf in a redwood forest, hyper-realistic coastal California",
  "Cartoon Snoopy competing in a chess tournament, hyper-realistic grand European hotel ballroom",
  "Cartoon Snoopy playing competitive ping pong, hyper-realistic Olympic table tennis venue",
  "Cartoon Snoopy doing competitive eating ramen, hyper-realistic Tokyo noodle championship",
  "Cartoon Snoopy entering a sandcastle contest, hyper-realistic California beach and judges",
  "Cartoon Snoopy doing timber sports log rolling, hyper-realistic Canadian lumberjack games",
  "Cartoon Snoopy building a gingerbread house competitively, hyper-realistic Christmas kitchen",
  "Cartoon Snoopy doing competitive origami, hyper-realistic traditional Japanese paper studio",
  "Cartoon Snoopy competing in a chowder cook-off, hyper-realistic New England harbor",
  "Cartoon Snoopy doing competitive flower arranging at Chelsea, hyper-realistic flower show tent",
  "Cartoon Snoopy bonsai trimming in a Kyoto garden, hyper-realistic ancient tree and rock",
  "Cartoon Snoopy topiary sculpting in a formal English garden, hyper-realistic estate grounds",
  "Cartoon Snoopy tapping maple syrup in a Vermont sugar shack, hyper-realistic steam and snow",
  "Cartoon Snoopy doing competitive wood splitting, hyper-realistic Scandinavian homestead",
  "Cartoon Snoopy shearing sheep in New Zealand, hyper-realistic farm and wool shed",
  "Cartoon Snoopy duck herding with a border collie, hyper-realistic Scottish farm trial",
  "Cartoon Snoopy doing a scarecrow building contest, hyper-realistic English autumn village",
  "Cartoon Snoopy competing in a pumpkin carving championship, hyper-realistic October night",
  "Cartoon Snoopy in a watermelon seed spitting contest, hyper-realistic summer picnic",
  "Cartoon Snoopy competing in a three-legged race, hyper-realistic backyard summer party",
  "Cartoon Snoopy in a tug of war over mud, hyper-realistic country fair field",
  "Cartoon Snoopy competing in a pinata smashing, hyper-realistic Mexican fiesta celebration",
  "Cartoon Snoopy in a limbo contest on a beach, hyper-realistic Caribbean party at sunset",
  "Cartoon Snoopy competing in synchronized swimming, hyper-realistic Olympic pool routine",
  "Cartoon Snoopy doing a dance battle in a ring, hyper-realistic urban hip-hop arena",
  "Cartoon Snoopy competing in extreme ironing on a cliff, hyper-realistic ridiculous extreme sport",
  "Cartoon Snoopy racing soap box derby cars, hyper-realistic neighborhood hill and crowd",
  "Cartoon Snoopy competing in a chili pepper eating contest, hyper-realistic state fair",
  "Cartoon Snoopy in a haggis hurling competition, hyper-realistic Scottish Highland Games",
  "Cartoon Snoopy doing cheese rolling at Cooper Hill, hyper-realistic English hillside chaos",
  "Cartoon Snoopy competing in bog snorkeling, hyper-realistic Welsh peat bog and crowd",
  "Cartoon Snoopy competing in a cardboard boat race, hyper-realistic campus lake and sinking",
  "Cartoon Snoopy building a snow fort in a blizzard, hyper-realistic neighborhood winter",
  "Cartoon Snoopy competing in a water balloon toss, hyper-realistic summer backyard",
  "Cartoon Snoopy fishing for rubber ducks at a Japanese summer matsuri, hyper-realistic fair",
  "Cartoon Snoopy doing ring toss at a boardwalk, hyper-realistic retro New Jersey shore",
  "Cartoon Snoopy riding the bumper cars at a fair, hyper-realistic neon funfair at night",
  "Cartoon Snoopy on the highest drop of a roller coaster, hyper-realistic amusement park",
  "Cartoon Snoopy riding a vintage carousel, hyper-realistic lit carousel horses at night",
  "Cartoon Snoopy winning at a claw machine, hyper-realistic retro game room neon",
  "Cartoon Snoopy playing pinball at a vintage parlor, hyper-realistic 1970s arcade glow",
  "Cartoon Snoopy racing soap box derby cars down a hill, hyper-realistic wooden ramp and crowd",
  "Cartoon Snoopy riding a zip line over a jungle river, hyper-realistic Costa Rica canopy",
  "Cartoon Snoopy doing stand-up paddleboarding in a mangrove, hyper-realistic tropical lagoon",
  "Cartoon Snoopy catching fireflies in mason jars at dusk, hyper-realistic Tennessee meadow",
  "Cartoon Snoopy on a sunset sailboat cruise, hyper-realistic calm bay and warm sky",
  "Cartoon Snoopy harvesting honey from a cliffside beehive, hyper-realistic Nepal mountain",
  "Cartoon Snoopy competing in a triathlon swim start, hyper-realistic open water chaos",
  "Cartoon Snoopy doing open water marathon swimming, hyper-realistic grey Channel sea",
  "Cartoon Snoopy doing a polar expedition on cross-country skis, hyper-realistic white expanse",
  "Cartoon Snoopy operating a weather balloon release, hyper-realistic cloud-streaked sky",
  "Cartoon Snoopy tagging a great white shark, hyper-realistic research boat and ocean",
  "Cartoon Snoopy performing an air guitar solo, hyper-realistic stadium crowd going wild",
  "Cartoon Snoopy doing competitive yo-yo tricks on a stage, hyper-realistic performance",
  "Cartoon Snoopy winning a stuffed animal at a fairground, hyper-realistic fairground lights",
  "Cartoon Snoopy on a merry-go-round at a vintage fair, hyper-realistic lit carousel at night",
  "Cartoon Snoopy building a raft and floating down a calm river, hyper-realistic summer",
  "Cartoon Snoopy on a snowy toboggan hill shrieking with joy, hyper-realistic winter neighborhood",
  "Cartoon Snoopy watching an airshow from the grass, hyper-realistic jets and blue sky",
  "Cartoon Snoopy competing in a triathlon cycling leg, hyper-realistic coastal road race",
  "Cartoon Snoopy doing a sunrise swim in a lake, hyper-realistic golden mist and forest",
  "Cartoon Snoopy flying a kite on a windy beach, hyper-realistic high surf and dramatic sky",
  "Cartoon Snoopy making a snow angel in fresh powder, hyper-realistic quiet winter morning",
  "Cartoon Snoopy skipping stones on a glassy mountain lake, hyper-realistic reflection",
  "Cartoon Snoopy on a paddleboat on a lily pond, hyper-realistic garden lake and reflection",
  "Cartoon Snoopy doing a cannonball off a dock, hyper-realistic summer lake splash",
  "Cartoon Snoopy winning a pie eating contest, hyper-realistic state fair and crowd",
  "Cartoon Snoopy competing in a log cabin build race, hyper-realistic frontier wilderness",
  "Cartoon Snoopy doing competitive stone stacking, hyper-realistic Sedona red rocks",
  "Cartoon Snoopy in a bobbing for apples contest, hyper-realistic Halloween barn party",
  "Cartoon Snoopy at a sack race on a village green, hyper-realistic English summer fete",
  "Cartoon Snoopy doing the limbo at a Caribbean beach party, hyper-realistic tropical sunset",
  "Cartoon Snoopy competing in a flash mob dance battle, hyper-realistic Times Square crowd",
  "Cartoon Snoopy wrestling in a sumo ring, hyper-realistic Japanese tournament dohyo",
  "Cartoon Snoopy doing underwater hockey, hyper-realistic pool-bottom action scene",
  "Cartoon Snoopy competing in nettle eating at a pub garden, hyper-realistic quirky British",
  "Cartoon Snoopy worm charming in a Devon field, hyper-realistic green English countryside",
  "Cartoon Snoopy doing a pillow fight flash mob, hyper-realistic city square and feathers",
  "Cartoon Snoopy competing in wife carrying race, hyper-realistic Finnish forest obstacle",
  "Cartoon Snoopy building a gingerbread house, hyper-realistic cozy holiday kitchen",
  "Cartoon Snoopy competing in a pumpkin regatta, hyper-realistic New England river",
  "Cartoon Snoopy at a square dance in a barn, hyper-realistic country fairy lights",
  "Cartoon Snoopy spinning a lasso at a Wyoming ranch, hyper-realistic big sky",
  "Cartoon Snoopy at a rodeo mechanical bull, hyper-realistic Texas dance hall neon",
  "Cartoon Snoopy doing a rain dance in a desert thunderstorm, hyper-realistic lightning",
  "Cartoon Snoopy in a competitive eating ramen contest, hyper-realistic Tokyo championship",
  "Cartoon Snoopy playing chess in a park, hyper-realistic Washington Square autumn",
  "Cartoon Snoopy doing a marathon victory lap, hyper-realistic finish line and crowd roar",
  "Cartoon Snoopy paddling a dragon boat at sunrise, hyper-realistic misty harbor",
  "Cartoon Snoopy competing in a regatta sailboat race, hyper-realistic ocean racing",
  "Cartoon Snoopy doing speed kayaking in rapids, hyper-realistic river canyon",
  "Cartoon Snoopy on a zipline over a waterfall, hyper-realistic jungle and mist",
  "Cartoon Snoopy at a summer camp swimming hole, hyper-realistic rope swing and forest",
  "Cartoon Snoopy doing a bouldering competition, hyper-realistic outdoor rock festival",
  "Cartoon Snoopy launching a model rocket, hyper-realistic open field and blue sky",
  "Cartoon Snoopy doing a Science Fair project, hyper-realistic school gym and volcano",
  "Cartoon Snoopy building a treehouse, hyper-realistic oak tree and summer backyard",
  "Cartoon Snoopy at a lemonade stand on a sunny afternoon, hyper-realistic neighborhood",
  "Cartoon Snoopy running a 5K charity race, hyper-realistic park path and autumn",
  "Cartoon Snoopy doing a polar bear swim at New Year, hyper-realistic icy beach and crowd",
  "Cartoon Snoopy competing in a kayak polo match, hyper-realistic outdoor water court",
  "Cartoon Snoopy doing competitive speed knitting, hyper-realistic English cottage contest",
  "Cartoon Snoopy competing in a grow the biggest pumpkin contest, hyper-realistic farm",
  "Cartoon Snoopy doing a hula hoop marathon, hyper-realistic retro American summer",
  "Cartoon Snoopy in a pie throwing contest, hyper-realistic British village fete",
  "Cartoon Snoopy at a balloon animal making competition, hyper-realistic circus tent",
  "Cartoon Snoopy competing in a best sandcastle contest, hyper-realistic beach judges",
  "Cartoon Snoopy doing a talent show magic act, hyper-realistic school auditorium",
  "Cartoon Snoopy at a dog show winning every ribbon, hyper-realistic county show ring",
  "Cartoon Snoopy at a go-kart racing track, hyper-realistic outdoor circuit and crowd",
  "Cartoon Snoopy racing a toy boat in a fountain, hyper-realistic Paris jardin",
  "Cartoon Snoopy at a paper airplane competition, hyper-realistic gymnasium and throw",
  "Cartoon Snoopy doing a backwards spelling bee, hyper-realistic school competition",
  "Cartoon Snoopy at a state science olympiad, hyper-realistic university gymnasium",

  // ── 200 ALBUM COVER STYLE: most iconic album cover compositions, Snoopy replaces artist ──
  // Visual descriptions are highly specific so Gemini recreates the exact scene
  "Snoopy walking barefoot across a zebra crossing in a single-file line with three others, one in a white suit, one in all black, bright London summer street, iconic crosswalk album cover",
  "Snoopy as a baby swimming underwater reaching for a dollar bill dangling from a fishhook, arms outstretched, turquoise crystal pool water, iconic grunge baby album cover",
  "Single triangular glass prism on pure black background with a narrow beam of white light entering one side and splitting into a full rainbow spectrum on the other side, iconic progressive rock album cover, Snoopy standing beside the prism",
  "Snoopy in a colorful Victorian military band uniform surrounded by a crowd of famous historical and pop culture cardboard cutout figures, psychedelic bright colors, flower arrangements at their feet, iconic 1960s concept album cover",
  "Snoopy in a white suit surrounded by dense colorful typography filling the entire background, Sgt Pepper-era psychedelic swirl text and colors, iconic band album cover recreation",
  "Snoopy in a bright red leather jacket in a moonlit foggy graveyard at night surrounded by rising zombies with rotting costumes, full moon behind bare trees, iconic 80s horror pop album cover",
  "Snoopy smashing a white bass guitar against a concert stage floor, black and white high-contrast photograph style, aggressive punk energy, iconic punk album cover",
  "Snoopy with a dramatic lightning bolt of blue and red across his face, glitter makeup, standing under a London streetlamp at night in a skin-tight jumpsuit, iconic glam rock album cover",
  "Snoopy in a purple trench coat standing beside a purple motorcycle on a rain-soaked street at dusk, soft purple light everywhere, iconic 80s album cover",
  "Snoopy in a bright yellow sundress standing in a cracked city street in summer light holding a baseball bat at his side, iconic modern pop album cover",
  "Snoopy and Woodstock as a couple in soft focus 1970s clothing, flowing and elegant, warm neutral background, iconic soft rock duo album cover",
  "Snoopy crouching in a denim jacket on a dark city street at night, black and white photograph style, gritty urban album cover",
  "Snoopy flying through the air over a busy highway interchange at night, cars streaming below with headlights, iconic rock album cover aerial shot",
  "Snoopy in a glittering silver space helmet and suit on a dark stage with spotlight, iconic glam space rock album cover, theatrical",
  "Snoopy lying on a road in a rural English village, black and white photograph from directly above, four figures lying in a cross shape, iconic experimental album cover",
  "Snoopy as a stooped elderly figure in a long robe with a walking stick, carrying a bundle of sticks on his back, struggling up a steep rocky hillside in dim light, iconic folk rock album cover",
  "Snoopy on the roof of a building in a city, four figures sitting in a row with their backs to us, silhouetted against a bright overcast sky, iconic rooftop sessions album cover",
  "Snoopy in a red hoodie standing against a plain white wall, staring directly and intensely into the camera, minimal stark album cover, iconic hip-hop",
  "Snoopy sitting at the edge of a swimming pool at night, feet dangling in the lit water, seen from behind, alone, iconic indie rock album cover",
  "Snoopy in a glittery gold jumpsuit at a roller disco rink with chrome surfaces and disco lights reflecting everywhere, iconic electronic album cover",
  "Snoopy in a hospital gown in a beige corridor pushing a small shopping cart with a teddy bear in it, fluorescent institutional hallway, iconic rap album cover",
  "Snoopy in graduation cap and gown jumping in front of a cartoon bear mascot, stadium behind, joyful and triumphant, iconic hip-hop album cover",
  "Snoopy as a gilded Egyptian-style figure on a throne with gold ornaments and lush fabrics, opulent palace setting, iconic rap duo album cover",
  "Snoopy on a lawn in front of the White House surrounded by a large group of people, black and white documentary style photograph, iconic political rap album cover",
  "Snoopy in a white T-shirt sitting cross-legged on sun-bleached California bleachers, simple and minimal, iconic R&B album cover",
  "Snoopy in sequined suspender vest doing the moonwalk on a reflective stage floor, soft orange spotlight, late 70s aesthetic, iconic pop album cover",
  "Snoopy in a black leather jacket with chrome zips and chains on a wet city street at night, defiant stance, iconic 80s pop album cover",
  "Snoopy in a black suit surrounded by dozens of identical Snoopys in black suits in a grid, iconic pop art album cover concept",
  "Snoopy in a cozy living room sitting on a rug beside a fluffy cat, natural light through a window behind, warm and intimate, iconic singer-songwriter album cover",
  "Snoopy sitting at an upright piano in profile, simple blue washes of color, sparse room, iconic 70s folk album cover",
  "Snoopy in flowing white dress and shawl spinning on a clifftop above stormy sea, iconic classic rock album cover, ethereal and dramatic",
  "Snoopy in a full black background with a single burning torch lighting his face from below, iconic heavy metal album cover, atmospheric",
  "Snoopy on a stage in profile playing trumpet, deep blue light filling the frame, sparse and minimal, iconic jazz album cover",
  "Snoopy in a grey turtleneck against a plain grey-blue background, looking pensively off to the side, iconic 60s folk album cover",
  "Snoopy in a black duster coat at the edge of a cliff overlooking a vast stormy ocean at sunset, iconic classic rock album cover, dramatic",
  "Snoopy in a crisp white shirt sitting at a kitchen table with strong window light casting shadows, black and white, iconic folk singer-songwriter album cover",
  "Snoopy surrounded by a dense collage of candy-colored Indian and psychedelic imagery, sitars, marigolds and paisley patterns, iconic 60s experimental album cover",
  "Snoopy in a velvet purple suit sitting in a Victorian armchair in a lush green garden, warm afternoon light, iconic 70s rock album cover",
  "Snoopy standing alone on a vast cracked white salt flat under a blazing blue sky, tiny figure in infinite landscape, iconic art rock album cover",
  "Snoopy in white face paint and white costume against a pure white background, conceptual and eerie, iconic avant-garde album cover",
  "Snoopy silhouetted against a blazing orange nuclear sunset, iconic post-punk album cover, industrial and dramatic",
  "Snoopy in a denim vest leaning against a rusted classic American muscle car on a highway, golden hour, iconic heartland rock album cover",
  "Snoopy alone on an empty stage under a single spotlight, thousands of empty seats behind him, iconic live album cover",
  "Snoopy in a tuxedo jacket and bow tie standing in front of a full orchestra pit in a grand concert hall, iconic classical crossover album cover",
  "Snoopy in a striped shirt at a crossroads on a rural Mississippi dirt road at dusk, suitcase beside him, iconic blues album cover",
  "Snoopy in a white tank top with a bandana, leaning on a fence in front of American flag on a hot summer day, iconic patriotic rock album cover",
  "Snoopy in 1920s Chicago gangster suit with a Tommy gun, sepia toned, iconic jazz age album cover",
  "Snoopy in a lime green tracksuit on a balcony of a brutalist concrete housing block, iconic British working class album cover",
  "Snoopy in a feathered headdress and glam makeup against a cosmic star field background, iconic prog rock album cover",
  "Snoopy running through a white snow-covered forest at night holding a sparkler, other figures running behind, iconic indie baroque pop album cover",
  "Snoopy floating like Superman above a flat suburban Midwestern town, blue sky and cloud, iconic indie folk album cover",
  "Snoopy through a fish-eye wide-angle lens playing guitar in a small wooden cabin in winter, stark and isolated, iconic folk rock album cover",
  "Snoopy in a field of tall golden wheat at dusk, simple and rustic, iconic country album cover",
  "Snoopy against a solid black background with a simple piece of red and yellow fruit in his hand, iconic art pop album cover",
  "Snoopy in a flowing white nightgown in an empty field at midnight under full moon, dreamy and spectral, iconic dream pop album cover",
  "Snoopy seated in front of a wall of vintage synthesizers and control panels, wearing headphones, iconic electronic album cover",
  "Snoopy in a pastel pink bedroom covered in polaroid photos, 1989-era aesthetic, iconic pop album cover recreation",
  "Snoopy in a misty autumnal forest in a grey cardigan holding fallen leaves, soft and intimate, iconic indie folk album cover",
  "Snoopy in a pink satin dress against a hot pink background, iconic hyperpop album cover, bold and maximalist",
  "Snoopy in a neon-lit boxing ring at night looking directly at camera with tape on hands, iconic hip-hop album cover",
  "Snoopy on the back of a carnival parade float painted gold, surrounded by celebrating figures, iconic streetwear album cover",
  "Snoopy in profile wearing a do-rag and white T-shirt leaning out of a car window, Los Angeles summer, iconic West Coast rap album cover",
  "Snoopy in a Compton backyard with a group of friends all facing camera, documentary photo style, golden hour, iconic rap crew album cover",
  "Snoopy in overalls in a cornfield in black and white, stark Depression-era photographic style, iconic country folk album cover",
  "Snoopy at a crowded Chicago blues bar with a microphone, neon sign and red walls, iconic blues album cover",
  "Snoopy in a white caftan at a Moroccan rooftop at golden hour, iconic 70s world music album cover",
  "Snoopy in red tartan and black leather with spiky hair against a brick wall, iconic punk album cover, raw energy",
  "Snoopy in a sequined cape and platform boots on a space-age stage set with giant mirror balls, glam rock iconic album cover",
  "Snoopy in a long black coat in fog on the Brooklyn Bridge, iconic moody R&B album cover",
  "Snoopy on a rooftop in Harlem at sunset with a saxophone, iconic soul jazz album cover, warm and golden",
  "Snoopy in a camouflage jacket in a Vietnamese jungle, dark and tense, iconic protest music album cover",
  "Snoopy in a striped French sailor shirt sitting on a dock by the Seine in Paris, iconic chanson album cover",
  "Snoopy in a bright Havana street scene, tropical colors and colonial architecture, iconic Latin album cover",
  "Snoopy in a flamenco dress mid-stomp in a dark Spanish tavern, dramatic shadow and red, iconic flamenco album cover",
  "Snoopy in a saffron monk robe sitting cross-legged at a Tibetan monastery, Himalayas behind, iconic world music album cover",
  "Snoopy in full traditional Japanese theater makeup on a darkened stage, iconic J-rock album cover",
  "Snoopy in a kente cloth robe at a Lagos beach at sunset, iconic Afrobeats album cover",
  "Snoopy in a white suit dancing on a Jamaican beach at sunset, iconic reggae album cover",
  "Snoopy in a bolero jacket at a Buenos Aires milonga, candlelight and shadows, iconic tango album cover",
  "Snoopy in a samba costume on a Rio de Janeiro hill with city behind, iconic Brazilian music album cover",
  "Snoopy on a favela rooftop at night with a drum kit, city lights below, iconic baile funk album cover",
  "Snoopy in a white linen suit in a New Orleans cemetery at dusk with a second line parade behind, iconic jazz album cover",
  "Snoopy in a black turtleneck at a New York coffee house with a harmonica around his neck, iconic folk revival album cover",
  "Snoopy in overalls and a bandana with a guitar on the front porch of a wooden sharecropper house, iconic delta blues album cover",
  "Snoopy at a Motown recording studio standing at a microphone with hands on headphones, iconic soul album cover, warm studio light",
  "Snoopy in a white glove pointing skyward on a dark stage, single beam of white light, iconic pop icon album cover",
  "Snoopy on a Sunset Strip billboard in Los Angeles, billboard-within-album-cover concept, iconic glam metal album cover",
  "Snoopy in a flannel shirt in a Seattle alley in the rain, black and white, disheveled and real, iconic grunge album cover",
  "Snoopy in ripped jeans and a blazer at the Marquee Club London stage door, iconic Britpop album cover",
  "Snoopy at a Manchester rave, strobes and fog, sweaty crowd, iconic Madchester baggy album cover",
  "Snoopy in an olive suit standing in front of a blurred Parisian street, soft grain photography, iconic French pop album cover",
  "Snoopy behind a mixing desk in Abbey Road-style control room, looking through glass at microphone, iconic studio album cover",
  "Snoopy in a trench coat under a neon Brasserie sign in rainy Paris at night, iconic noir chanson album cover",
  "Snoopy on a high mountain in Norway in a black anorak, dark and foreboding, iconic black metal album cover",
  "Snoopy on a Viking longship in a storm, seas crashing, iconic Nordic folk metal album cover",
  "Snoopy in a sparkling cape in front of a full Las Vegas show stage backdrop, iconic Vegas pop album cover",
  "Snoopy in a crisp oxford shirt and blazer in a Cambridge courtyard, literary indie album cover, misty morning",
  "Snoopy in a Hawaiian shirt outside the Whisky a Go Go on Sunset Strip, iconic California rock album cover",
  "Snoopy in a floral Crown in a 1960s London boutique, iconic Swinging London pop album cover",
  "Snoopy in a sharp 3-piece suit in front of Buckingham Palace, iconic Britpop swagger album cover",
  "Snoopy in a caftan at Woodstock in a field of muddy festival-goers, iconic 1969 hippie album cover",
  "Snoopy in overalls and a fishing hat on a Louisiana bayou dock, iconic Southern rock album cover, golden and swampy",
  "Snoopy in a three-piece white suit in front of a white Rolls-Royce, iconic 70s soul album cover",
  "Snoopy in a crop top and high-waisted jeans on a hot Texas summer street, iconic country pop album cover",
  "Snoopy at a honky-tonk bar in a cowboy hat with a beer, iconic outlaw country album cover, worn and real",
  "Snoopy in a tuxedo at a grand Viennese concert hall, orchestra visible behind him, iconic classical music album cover",
  "Snoopy in a NASA spacesuit floating in zero gravity with Earth behind him, iconic progressive rock space concept album cover",
  "Snoopy in a top hat and tails on a stage shrouded in dry ice fog, iconic theatrical pop album cover",
  "Snoopy in a black leather jacket with the collar up leaning against a jukebox in a 1950s diner, iconic rockabilly album cover",
  "Snoopy in a glittery catsuit on a 1970s variety show stage with a full band, iconic disco soul album cover",
  "Snoopy in a tattered sailor suit standing on the bow of a ship in a gale, iconic maritime folk album cover",
  "Snoopy in a knit cardigan reading by a fireplace in a Vermont farmhouse, iconic soft rock album cover, cozy",
  "Snoopy in a pinstripe suit in a 1920s jazz club with trumpet players behind, iconic jazz age album cover",
  "Snoopy singing into a chrome microphone in a 1950s recording booth with engineers visible through glass, iconic early rock album cover",
  "Snoopy in a dashiki at a 1970s Black arts festival stage, microphone in hand, iconic soul poetry album cover",
  "Snoopy in a white vinyl coat on a London street, cars and red buses blurred behind, iconic Mod album cover",
  "Snoopy in a lace shirt and velvet trousers in a medieval castle corridor, candlelit, iconic 70s prog folk album cover",
  "Snoopy in platform shoes and a jumpsuit on a glam stage, rainbow confetti falling, iconic 70s glam pop album cover",
  "Snoopy in a fisherman's sweater at a windswept Irish cliff, fiddle in hand, iconic Celtic folk album cover",
  "Snoopy in a keffiyeh and djellaba at a Marrakech night market, iconic world fusion album cover",
  "Snoopy in white face paint and a harlequin suit at a French mime circus, iconic theatrical pop album cover",
  "Snoopy in a batik shirt at a Balinese rice terrace ceremony, iconic ambient world music album cover",
  "Snoopy in a Nehru jacket at an Indian raga concert, sitar visible, incense smoke, iconic psychedelia album cover",
  "Snoopy in neon spandex at a 1984 stadium with thousands of lights in the crowd, iconic arena pop album cover",
  "Snoopy in a headscarf and long coat on a Warsaw winter street, iconic Eastern European folk album cover",
  "Snoopy in a floor-length fur coat in a Moscow snowstorm, iconic Russian pop album cover, dramatic and cold",
  "Snoopy in a guayabera shirt at a Cuban son session in a colonial courtyard, iconic tropical music album cover",
  "Snoopy in a shearling coat on the Reykjavik waterfront in winter, volcanic landscape, iconic Icelandic album cover",
  "Snoopy in a Ghanaian kente suit at a highlife celebration, iconic West African album cover",
  "Snoopy in a linen suit at a Lisbon fado house, the fadista in black behind him, iconic fado album cover",
  "Snoopy in a cagoule on a Welsh mountain in the rain, grey and beautiful, iconic post-punk album cover",
  "Snoopy in a velvet jumpsuit in an Amsterdam canal house with stained glass light, iconic Dutch pop album cover",
  "Snoopy in a beret at a Pigalle brasserie at night, iconic French hip-hop album cover",
  "Snoopy in a tracksuit on a Barcelona football pitch at night, iconic Spanish urban album cover",
  "Snoopy in bell-bottom jeans at a 1975 rock festival in a crowd of 100,000, iconic rock festival album cover",
  "Snoopy in a wide-brimmed hat in a field of California wildflowers, iconic West Coast folk rock album cover",
  "Snoopy in a white turtleneck sitting on a stool in an empty studio, iconic minimalist art pop album cover",
  "Snoopy in a silk kimono at a Tokyo geisha tea house, iconic city pop album cover, refined and beautiful",
  "Snoopy in a purple velvet suit in a Victorian greenhouse full of exotic plants, iconic baroque pop album cover",
  "Snoopy in a fedora and suspenders at a Chicago speakeasy, iconic swing album cover, 1930s warmth",
  "Snoopy in a floral jumpsuit at an outdoor amphitheater under sunset, iconic outdoor festival album cover",
  "Snoopy in a satin robe at a Memphis soul recording session, engineer and microphone, iconic soul album cover",
  "Snoopy holding a gospel microphone in front of a Baptist choir, iconic soul gospel album cover",
  "Snoopy in a burlap tunic in a biblical desert landscape, iconic spiritual concept album cover",
  "Snoopy in an astronaut suit on a barren lunar surface with Earth rising behind, iconic space concept album cover",
  "Snoopy in a hazmat suit in an abandoned industrial facility, iconic post-industrial album cover",
  "Snoopy in a vintage ski suit at a 1960s Alpine resort, iconic easy listening album cover, cheerful",
  "Snoopy in a suede fringe jacket at a 1969 campfire with acoustic guitar, iconic singer-songwriter album cover",
  "Snoopy in a white painter's smock in front of a Jackson Pollock-style canvas, iconic art pop album cover",
  "Snoopy in a sharp slim suit at a Parisian art opening, iconic sophisticated pop album cover, black and white",
  "Snoopy in a trench coat on the Millennium Bridge London at dawn, iconic contemporary British album cover",
  "Snoopy in a tailored suit on the top step of the Metropolitan Museum at sunrise, iconic NYC album cover",
  "Snoopy in a headband and tracksuit at a 1980s aerobics studio with mirrored walls, iconic workout pop album cover",
  "Snoopy in a cropped tank top on a New York City stoop in August heat, iconic hip-hop summer album cover",
  "Snoopy in a newsboy cap on the Tube with a vinyl record under his arm, iconic London indie album cover",
  "Snoopy in a black cape at the top of the Eiffel Tower at midnight, iconic epic pop album cover",
  "Snoopy in a white tuxedo at a rooftop New Year's Eve party with fireworks behind, iconic pop album cover",
  "Snoopy in a full marching band uniform on an empty football field at twilight, iconic concept album cover",
  "Snoopy in a fishnet shirt and tight jeans against a graffiti wall in New York, iconic punk pop album cover",
  "Snoopy in a sequined ballgown at the bottom of a grand staircase, iconic diva pop album cover",
  "Snoopy in an orange prison jumpsuit on a stage, iconic concept rap album cover, stark and political",
  "Snoopy in a white lab coat and goggles in a chemistry lab surrounded by bubbling equipment, iconic concept album cover",
  "Snoopy in a pilot jacket at the controls of a vintage biplane above clouds, iconic adventure album cover",
  "Snoopy as a conductor in black tailcoat, baton raised, symphony hall full behind him, iconic orchestral album cover",
  "Snoopy in a swimsuit and sunglasses on a yacht in the Mediterranean, iconic Euro summer pop album cover",
  "Snoopy in oversize jeans and a hoodie in front of a Detroit freeway overpass, iconic Midwest rap album cover",
  "Snoopy in a kilt playing bagpipes at Edinburgh Castle, iconic Celtic rock album cover",
  "Snoopy in a sharp coral-pink suit in front of a Miami Art Deco hotel, iconic Latin pop album cover",
  "Snoopy in a toga at a Greek island ruins at sunset, iconic Mediterranean concept album cover",
  "Snoopy in a kaftan at a 70s Malibu beach house pool party, iconic California pop album cover",
  "Snoopy in a vintage three-piece linen suit at a plantation house in New Orleans, iconic Southern gothic album cover",
  "Snoopy in a leather flight jacket in a World War II bomber, iconic wartime soundtrack album cover",
  "Snoopy at a piano in a dimly lit late night bar, alone after last call, iconic introspective album cover",
  "Snoopy in a floral dress spinning in a field of lavender, iconic summer pop album cover, Provence",
  "Snoopy in an elegant 1940s evening gown on a Casablanca hotel terrace in the moonlight, iconic crooner album cover",
  "Snoopy in head-to-toe black in a minimalist empty room with a single red rose, iconic goth pop album cover",

    // ── 300 RETRO POSTER STYLE ──
  "Snoopy as a heroic explorer on a 1930s adventure society poster, bold art deco typography, navy and gold palette",
  "Snoopy on a WPA-style national park travel poster, flat color blocks, classic American park poster art",
  "Snoopy as a 1940s wartime pilot on a recruitment poster, bold graphic red white and blue, vintage texture",
  "Snoopy on a vintage 1950s diner billboard, pop art colors, chrome lettering and checkerboard Americana",
  "Snoopy as a circus ringmaster on a Victorian playbill poster, ornate typography, worn canvas and red",
  "Snoopy on a 1960s psychedelic concert poster, swirling Fillmore West typography, Day-Glo colors",
  "Snoopy on a retro Soviet-style sports achievement poster, constructivist geometry, red and cream",
  "Snoopy as a film noir detective on a 1940s movie poster, black and shadow, rain-soaked silhouette",
  "Snoopy on a vintage Route 66 roadside diner poster, hand-painted lettering, dusty western palette",
  "Snoopy as a surf champion on a 1960s competition poster, woodblock print style, ocean wave graphic",
  "Snoopy on a retro NASA Apollo-era space mission poster, cool blue and orange, bold sans-serif type",
  "Snoopy as a vintage boxer on a 1920s fight night poster, old school letterpress, sepia and red",
  "Snoopy on a 1930s ocean liner travel poster, Cassandre art deco waves, luxury and elegance",
  "Snoopy as a silent film star on a 1920s movie house poster, ornate art nouveau frame and starlight",
  "Snoopy on a vintage rodeo poster, rope border, western serif type, dusty sunset palette",
  "Snoopy as a jazz musician on a 1950s cool jazz poster, abstract shapes, late night blue and amber",
  "Snoopy on a 1980s action hero poster, airbrushed painting style, fire and explosion and sunglasses",
  "Snoopy as a Victorian botanist on a natural history print poster, detailed illustration, aged parchment",
  "Snoopy on a vintage winter Olympics poster, 1932 art deco mountain silhouette and bold type",
  "Snoopy as a kung fu master on a 1970s Hong Kong movie poster, hand-painted flying action",
  "Snoopy on a 1950s pulp science fiction magazine cover poster, rocket ships and alien worlds",
  "Snoopy as a vintage aviator on a 1920s air show poster, biplane and clouds, brave and dashing",
  "Snoopy on a retro roller derby poster, 1970s bold graphic, skates and speed and attitude",
  "Snoopy as a strongman on a vintage circus poster, exaggerated muscles, old ornate typography",
  "Snoopy on a 1960s pop art poster, Lichtenstein Ben-Day dot style, primary colors and bold outline",
  "Snoopy as a vintage pirate on a 1950s swashbuckler movie poster, treasure map and tall ships",
  "Snoopy on a retro ski resort poster, 1930s alpine illustration, bold type and chalet charm",
  "Snoopy as a 1920s jazz age speakeasy poster, Harlem Renaissance style, elegant and smoky",
  "Snoopy on a vintage gold rush poster, 1900s frontier adventure, panning for gold and mountain",
  "Snoopy as a retro disco king poster, Studio 54 1970s style, mirror ball and sequin suit",
  "Snoopy on a vintage Hawaiian tourism poster, 1940s illustration, tropical flowers and breaking surf",
  "Snoopy as a silent movie villain on a 1915 melodrama poster, mustachio and damsel, sepia drama",
  "Snoopy on a retro hot rod show poster, 1950s hot rod illustration, chrome flames and speed lines",
  "Snoopy as a vintage samurai on a Japanese woodblock print style poster, bold ink and red wax seal",
  "Snoopy on a 1960s counterculture protest poster, Warhol-era silkscreen, flat bold color statement",
  "Snoopy as a 1920s deco traveler on an Orient Express poster, golden age train and exotic east",
  "Snoopy on a retro amusement park poster, Coney Island 1920s style, carousel and neon and joy",
  "Snoopy as a vintage western sheriff on a wanted poster, type-heavy old west design, bullet holes",
  "Snoopy on a 1970s blacklight poster, UV glow palette, surreal and trippy psychedelic design",
  "Snoopy as a vintage race car driver on a 1930s Grand Prix poster, Monaco chicane and speed",
  "Snoopy on a retro magic show poster, Victorian illusionist style, top hat and mysterious glow",
  "Snoopy as a vintage big band leader on a 1940s ballroom dance poster, swing era elegance",
  "Snoopy on a retro deep sea expedition poster, 1930s dive bell, dark depths and brave soul",
  "Snoopy as a 1950s TV show host on a vintage broadcast poster, bowtie and bright studio smile",
  "Snoopy on a vintage Italian Vespa scooter poster, La Dolce Vita 1950s style, Mediterranean sun",
  "Snoopy as a futuristic robot in a 1950s atomic age science poster, chrome and radiation symbol",
  "Snoopy on a vintage Japanese travel poster, 1930s ukiyo-e influenced, Fuji and lantern glow",
  "Snoopy as a vintage polo player on a country club poster, 1920s equestrian style, mallet and field",
  "Snoopy on a retro beach resort poster, 1930s coastal elegance, lounge chair and parasol",
  "Snoopy as a vintage fire prevention poster, 1940s forest service style, trees and prevention",
  "Snoopy on a 1960s British mod fashion poster, Mary Quant era, geometric pattern and go-go boots",
  "Snoopy as a vintage roller coaster ad, 1920s Coney Island boardwalk style, screaming thrill",
  "Snoopy on a retro boxing gym wall poster, inspirational 1940s style, gloves and champion belt",
  "Snoopy as a vintage French Riviera resort poster, Cannes glamour 1950s, yachts and parasols",
  "Snoopy as a retro mountaineer on a Swiss Alpine Club poster, 1920s expedition style, roped peak",
  "Snoopy on a vintage Cuba travel poster, 1950s Havana golden age, cigars and music and color",
  "Snoopy as a 1960s space age stewardess poster, Pan Am era aviation, globe and jetliner silhouette",
  "Snoopy on a retro bullfighting corrida poster, Spanish Andalusian art style, matador pose and bull",
  "Snoopy as a vintage aquatic show poster, 1940s synchronized swimming, underwater glamour",
  "Snoopy on a 1920s art deco department store sale poster, geometric elegance and bold type",
  "Snoopy as a vintage strongman athlete on an Olympic Games poster, 1924 Paris Games style",
  "Snoopy on a retro fishing village poster, 1930s New England wharf, nets and lobster and fog",
  "Snoopy as a 1950s drive-in movie host poster, pink and turquoise, popcorn and moon and cars",
  "Snoopy on a retro national fitness poster, 1940s government health campaign, bright and active",
  "Snoopy as a vintage river boat gambler poster, Mississippi Delta 1880s, cards and steamboat",
  "Snoopy on a 1960s Mod British music poster, Carnaby Street era, bold color block design",
  "Snoopy on a retro pinball machine marquee art, 1970s illustration style, neon tubes and chrome",
  "Snoopy as a vintage telephone operator poster, 1920s Bell era, switchboard and art deco",
  "Snoopy as a vintage aviator barnstormer poster, 1920s air circus, loop-the-loop and crowd below",
  "Snoopy as a vintage tropical explorer poster, 1920s National Geographic style, pith helmet",
  "Snoopy on a retro county fair ribbon poster, 1950s illustrated, pig and pie and blue ribbon",
  "Snoopy as a vintage lighthouse keeper poster, New England maritime 1930s, fog and beacon light",
  "Snoopy on a retro grape harvest poster, Burgundy 1940s wine estate illustration, rolling hill",
  "Snoopy on a vintage pirate radio ship poster, 1960s British offshore radio, waves and transistor",
  "Snoopy as a vintage hot air balloon race poster, 1900s adventure style, wicker and altitude",
  "Snoopy on a retro penny farthing cycling poster, 1880s Victorian velocipede race, sepia",
  "Snoopy as a vintage medicine show poster, 1880s frontier huckster, elixir and crowd and wagon",
  "Snoopy on a retro traveling circus elephant poster, big top 1920s, gold and crimson and sawdust",
  "Snoopy as a vintage velodrome racing poster, 1930s track cycling, wooden oval and speed blur",
  "Snoopy on a retro Caribbean cruise poster, 1950s tropical adventure, steel band and hibiscus",
  "Snoopy as a vintage sideshow barker poster, 1920s carnival, tuxedo and megaphone and wonder",
  "Snoopy on a 1960s space-age kitchen appliance ad poster, Googie design, futuristic and atomic",
  "Snoopy as a vintage zeppelin passenger poster, 1930s Hindenburg era luxury, above the clouds",
  "Snoopy as a vintage skeet shooting poster, English country estate 1930s, barrels and clay target",
  "Snoopy on a retro 1950s barbershop quartet poster, harmony and pomade and checkerboard",
  "Snoopy as a vintage fencing academy poster, 1920s European style, epee and white jacket",
  "Snoopy on a retro beach boardwalk taffy ad, 1910s Atlantic City style, salt air and stripes",
  "Snoopy as a vintage Iditarod sled dog race poster, 1920s Alaskan adventure, snow and huskies",
  "Snoopy on a retro Mardi Gras krewe parade poster, New Orleans 1920s style, mask and feather",
  "Snoopy as a vintage Appalachian Trail hiking poster, 1930s CCC era illustration, summit vista",
  "Snoopy on a retro antique car rally poster, 1920s veteran car run, goggles and duster coat",
  "Snoopy on a retro Cape Cod summer resort poster, 1950s New England charm, lobster and lighthouse",
  "Snoopy as a vintage Venetian gondolier poster, 1920s Italian tourism, palazzo and serenade",
  "Snoopy on a retro Mykonos windmill poster, 1950s Greek tourism, whitewash and blue and bright sun",
  "Snoopy as a vintage 1940s US Navy sailor poster, dress whites and anchor, patriotic and proud",
  "Snoopy on a retro cattle drive trail poster, 1880s Texas longhorn drive, dust and cowboy horizon",
  "Snoopy as a vintage swimming hole poster, 1920s summer idyll, rope swing and old swimsuit style",
  "Snoopy on a retro 1950s malt shop ad poster, soda fountain Americana, poodle skirt and jukebox",
  "Snoopy on a retro harvest moon festival poster, 1930s rural America, barn dance and lantern",
  "Snoopy as a vintage Viennese coffee house poster, 1900s Secessionist style, Klimt-inspired frame",
  "Snoopy on a retro Moroccan caravan trade poster, 1920s Orientalist style, souk and spice",
  "Snoopy as a vintage Antarctic whaling expedition poster, 1920s South Georgia, ice and courage",
  "Snoopy on a retro Newfoundland iceberg tour poster, 1950s Canadian maritime, azure and white ice",
  "Snoopy as a vintage Quebec City winter carnival poster, 1930s Bonhomme style, ice palace",
  "Snoopy as a vintage Klondike gold rush poster, 1898 Yukon stampede, sluice and fortune",
  "Snoopy on a retro Oahu pineapple plantation poster, 1930s Dole era, tropical and golden",
  "Snoopy as a vintage Big Sur California poster, 1940s WPA cliff and cypress, golden state",
  "Snoopy on a retro Lake Tahoe winter sports poster, 1940s California ski resort, snow and pine",
  "Snoopy as a vintage Napa Valley wine country poster, 1940s California illustration, oak barrel",
  "Snoopy on a retro Oregon Trail pioneer poster, 1930s covered wagon, westward and dusty",
  "Snoopy as a vintage Puget Sound ferry poster, 1930s Seattle waterfront, totem and mountain",
  "Snoopy on a retro Santa Fe adobe arts poster, 1930s New Mexico, turquoise and pueblo and sky",
  "Snoopy on a retro Boundary Waters canoe poster, 1930s Minnesota wilderness, mirror lake and pine",
  "Snoopy on a retro Mackinac Island bicycle poster, 1910s no-car island style, fudge and bridge",
  "Snoopy as a vintage Cleveland steel mill poster, 1930s industrial heroism, smoke and spark",
  "Snoopy on a retro Detroit auto factory poster, 1930s assembly line heroism, Ford era strength",
  "Snoopy as a vintage Iowa state fair poster, 1950s Americana, Ferris wheel and blue ribbon",
  "Snoopy on a retro Adirondack Great Camp poster, 1920s New York elite escape, canoe and birch",
  "Snoopy on a retro Newport Jazz Festival poster, 1950s Rhode Island, cool jazz and ocean breeze",
  "Snoopy on a retro Nantucket whaling museum poster, 1940s New England maritime, harpoon and sea",
  "Snoopy on a retro Gettysburg battlefield tour poster, 1930s Civil War memorial, cannon and mist",
  "Snoopy as a vintage Lewis and Clark expedition poster, 1940s adventure style, river and new land",
  "Snoopy as a vintage Pony Express rider poster, 1920s American West, horse at full gallop",
  "Snoopy on a retro transcontinental railroad poster, 1869 golden spike era, locomotive and nation",
  "Snoopy as a vintage Brooklyn Bridge opening poster, 1883 era engineering triumph, cables and crowd",
  "Snoopy as a vintage Wright Brothers flight poster, 1903 Kitty Hawk, early aviation inspiration",
  "Snoopy on a retro Model T Ford road trip poster, 1910s automobile adventure, dirt road and picnic",
  "Snoopy as a vintage Harlem Renaissance cabaret poster, 1920s Cotton Club style, jazz and glamour",
  "Snoopy on a retro Tin Pan Alley sheet music poster, 1910s New York, upright piano and bowler hat",
  "Snoopy as a vintage vaudeville circuit poster, 1900s theatrical touring bill, trouper and trunk",
  "Snoopy on a retro Victory Garden poster, WWII era, vegetables and backyard and patriotic spirit",
  "Snoopy on a retro war bond poster, 1940s, star-spangled resolve and bold graphic type",
  "Snoopy on a retro public library reading poster, 1930s WPA library mural style, books and lamp",
  "Snoopy on a retro union labor day poster, 1930s worker solidarity art, fist and sunrise",
  "Snoopy on a retro Earth Day environmental poster, 1970s, globe hug and flower power",
  "Snoopy on a retro moon landing commemorative poster, 1969 achievement, eagle and bootprint",
  "Snoopy as a vintage robot future poster, 1960s Asimov era, chrome and positronic brain",
  "Snoopy on a retro monorail of tomorrow poster, 1964 World's Fair, futurism and hope",
  "Snoopy as a vintage flying car future city poster, 1950s Popular Mechanics style, glass domes",
  "Snoopy on a retro jet age airline poster, 1958 Pan Am style, globe and stratocruiser silhouette",
  "Snoopy as a vintage supersonic future poster, 1960s Concorde era, needle nose and sky",
  "Snoopy on a retro submarine adventure poster, 1950s Jules Verne style, porthole and deep blue",
  "Snoopy as a vintage time machine adventure poster, H.G. Wells 1895 style, Victorian and future",
  "Snoopy on a retro rocket ship adventure poster, Buck Rogers 1930s style, ray gun and alien planet",
  "Snoopy on a retro King Kong-style movie poster, 1930s creature feature, skyscraper and beast",
  "Snoopy as a vintage Frankenstein movie poster, 1931 Universal style, laboratory and lightning",
  "Snoopy on a retro Dracula movie poster, 1920s Nosferatu style, shadow and moonlight and castle",
  "Snoopy on a retro swamp creature poster, 1950s B-movie style, bayou and creature and scream",
  "Snoopy as a vintage giant bug sci-fi poster, 1954 atomic horror style, terror and small town",
  "Snoopy on a retro invasion sci-fi poster, 1956 era, paranoia and pods and suburban dread",
  "Snoopy on a retro drive-in horror double feature poster, 1960s grindhouse, scream queen camp",
  "Snoopy as a vintage blaxploitation movie poster, 1970s funk era, afro and platform and attitude",
  "Snoopy on a retro kung fu tournament poster, 1973 Shaw Brothers style, flying kick and Chinese seal",
  "Snoopy as a vintage spaghetti western movie poster, 1966 Leone style, wide brim and desert dust",
  "Snoopy on a retro samurai epic movie poster, Kurosawa era, mist and katana and honor",
  "Snoopy as a vintage French New Wave cinema poster, 1960s, black and white tinted with wit",
  "Snoopy on a retro Italian neorealism movie poster, Fellini era, cobblestone and raw emotion",
  "Snoopy as a vintage Soviet propaganda art poster, constructivist 1920s, bold diagonal and cog",
  "Snoopy on a retro German Bauhaus design poster, 1920s typography master class, pure form",
  "Snoopy as a vintage Czech surrealist poster, 1960s Prague Spring style, dreamlike and political",
  "Snoopy on a retro Polish theater poster, 1960s Lenica style, surreal and graphic and strange",
  "Snoopy on a retro Scandinavian design annual poster, 1960s Nordic style, clean and wood and snow",
  "Snoopy as a vintage Swiss graphic design poster, 1960s International Style, grid and Helvetica",
  "Snoopy on a retro Dutch De Stijl inspired poster, Mondrian palette, primary color and right angle",
  "Snoopy as a vintage Belgian Art Nouveau poster, Mucha-inspired florals, sinuous line and beauty",
  "Snoopy on a retro London Underground tube art poster, Beck-style design classic, modern and iconic",
  "Snoopy on a retro Festival of Britain 1951 poster, postwar optimism, atom and national hope",
  "Snoopy as a vintage Great Exhibition 1851 Crystal Palace poster, Victorian wonder and progress",
  "Snoopy on a retro Paris 1900 Exposition Universelle poster, Belle Epoque art nouveau splendor",
  "Snoopy on a retro 1939 New York World's Fair poster, trylon and perisphere, futureworld",
  "Snoopy on a retro 1970 Osaka Expo poster, Japanese modernism and metabolism architecture wonder",
  "Snoopy as a vintage Grease movie style poster, 1978 era, leather jacket and convertible at prom",
  "Snoopy on a retro Saturday Night Fever disco poster, 1977 style, white suit and polyester",
  "Snoopy as a vintage Flashdance style poster, 1983, torn sweatshirt and water and spotlight",
  "Snoopy on a retro Top Gun style poster, 1986, aviator glasses and jet exhaust and sky",
  "Snoopy on a retro Footloose style poster, 1984, banned dancing and warehouse lights and rebellion",
  "Snoopy as a vintage Say Anything poster, 1989, boombox above head in a suburb at dawn",
  "Snoopy on a retro Ferris Bueller style poster, 1986 Chicago day off adventure, bold and free",
  "Snoopy as a vintage Pretty in Pink poster, 1986, pastel prom dress and bittersweet choice",
  "Snoopy on a retro Dirty Dancing poster, 1987, silhouette lift and mountain resort at dusk",
  "Snoopy as a vintage Back to the Future poster, 1985, DeLorean and lightning and clock tower",
  "Snoopy on a retro ET style movie poster, 1982, bicycle silhouette and glowing moon",
  "Snoopy as a vintage Stand By Me poster, 1986, railroad tracks and four kids and summer",
  "Snoopy on a retro Goonies adventure poster, 1985, treasure map and underground and gang",
  "Snoopy as a vintage Karate Kid poster, 1984, crane kick silhouette at sunset",
  "Snoopy on a retro Ghostbusters style poster, 1984, proton pack and ghost logo and city",
  "Snoopy as a vintage Indiana Jones style poster, 1981, hat and whip and temple and adventure",
  "Snoopy on a retro Star Wars style tribute poster, 1977, twin suns and desert and epic horizon",
  "Snoopy as a vintage Rocky style movie poster, 1976, fist raised on steps in dawn light",
  "Snoopy on a retro Jaws style poster, 1975, shark fin below and swimmer above, dread",
  "Snoopy as a vintage Clockwork Orange style poster, 1971, bowler hat and cane and stare",
  "Snoopy on a retro Easy Rider style poster, 1969, chopper and desert highway and freedom",
  "Snoopy as a vintage 2001 Space Odyssey style poster, 1968, bone throw and stargate",
  "Snoopy on a retro Planet of the Apes style poster, 1968, Statue of Liberty and revelation",
  "Snoopy as a vintage Bullitt style poster, 1968, Mustang and San Francisco hill chase",
  "Snoopy on a retro Bonnie and Clyde style poster, 1967, sepia gangster couple and car",
  "Snoopy as a vintage Blow-Up style poster, 1966, London mod photographer and mystery",
  "Snoopy on a retro Great Escape style poster, 1963, motorcycle and barbed wire and daring",
  "Snoopy as a vintage Lawrence of Arabia style poster, 1962, desert and camel and epic scale",
  "Snoopy on a retro Ben-Hur style poster, 1959, chariot race and ancient Rome and triumph",
  "Snoopy as a vintage Casablanca style poster, 1942, trench coat and fog and airport",
  "Snoopy on a retro Citizen Kane style poster, 1941, low angle and newspaper and mystery",
  "Snoopy as a vintage King Kong 1933 style poster, Empire State and biplane and beauty",
  "Snoopy on a retro Metropolis 1927 style poster, expressionist city and robot and dystopia",
  "Snoopy as a vintage Birth of a Nation era silent film poster, 1915 illustrated, epic style",
  "Snoopy on a retro Chaplin Modern Times style poster, 1936, factory gears and little tramp",
  "Snoopy as a vintage Gone with the Wind style poster, 1939, silhouette and war and passion",
  "Snoopy on a retro Wizard of Oz style poster, 1939, yellow brick road and emerald city",
  "Snoopy as a vintage Fantasia style concert poster, 1940, musical and abstract and magical",
  "Snoopy on a retro Singin in the Rain style poster, 1952, lamppost and umbrella and joy",
  "Snoopy as a vintage Some Like It Hot poster, 1959, marilyn dress and beach and comedy",
  "Snoopy on a retro Psycho Hitchcock style poster, 1960, stark typography and shadow and dread",
  "Snoopy as a vintage Vertigo Hitchcock style poster, 1958, spiral and silhouette and obsession",
  "Snoopy on a retro North by Northwest style poster, 1959, biplane crop duster and empty field",
  "Snoopy as a vintage Rear Window style poster, 1954, courtyard and voyeur and tension",
  "Snoopy on a retro Dial M for Murder style poster, 1954, phone cord and drama and suspense",
  "Snoopy as a vintage Roman Holiday style poster, 1953, Vespa and Rome and runaway princess",
  "Snoopy on a retro Breakfast at Tiffanys style poster, 1961, pearls and sunglasses and Fifth Avenue",
  "Snoopy as a vintage Dr Strangelove style poster, 1964, bomb ride and war room and satire",
  "Snoopy on a retro Apocalypse Now style poster, 1979, jungle river and fog and darkness",
  "Snoopy as a vintage The Graduate style poster, 1967, nylon leg and young man and future",
  "Snoopy on a retro Midnight Cowboy style poster, 1969, two outcasts and New York and survival",
  "Snoopy as a vintage Chinatown style poster, 1974, Jack Nicholson and mystery and corruption",
  "Snoopy on a retro Dog Day Afternoon style poster, 1975, bank heist and heat and real life",
  "Snoopy as a vintage Taxi Driver style poster, 1976, neon night and city and alienation",
  "Snoopy on a retro Annie Hall style poster, 1977, New York and couple and neurosis and wit",
  "Snoopy as a vintage Deer Hunter style poster, 1978, mountain wedding and tragedy and war",
  "Snoopy on a retro Raging Bull style poster, 1980, black and white ring and champion",
  "Snoopy as a vintage Blade Runner style poster, 1982, neon rain and replicant and future noir",
  "Snoopy on a retro E.T. bicycle moon silhouette style poster, 1982, iconic and wonder",
  "Snoopy as a vintage Scarface style poster, 1983, white suit and power and Miami excess",
  "Snoopy on a retro Amadeus style poster, 1984, Mozart wig and court and genius and madness",
  "Snoopy as a vintage Platoon style poster, 1986, arms raised in jungle and moral crisis",
  "Snoopy on a retro Full Metal Jacket style poster, 1987, helmet graffiti and hard face and war",
  "Snoopy as a vintage Rain Man style poster, 1988, two brothers on a desert road trip",
  "Snoopy on a retro Do the Right Thing style poster, 1989, Brooklyn summer heat and tension",
  "Snoopy as a vintage Goodfellas style poster, 1990, mob dinner and sharp suits and loyalty",

  // ── ACTIVITY top-up (to reach 500) ──
  "Cartoon Snoopy doing a backflip off a diving board, hyper-realistic outdoor pool and blue sky",
  "Cartoon Snoopy swinging on a trapeze in a circus tent, hyper-realistic sawdust and spotlight",
  "Cartoon Snoopy doing a wheelie on a BMX bike, hyper-realistic skatepark ramp",
  "Cartoon Snoopy kiteboarding in turquoise water, hyper-realistic tropical coast",
  "Cartoon Snoopy wakeboarding behind a speedboat, hyper-realistic lake spray",
  "Cartoon Snoopy doing a front flip off a snowy jump, hyper-realistic ski resort halfpipe",
  "Cartoon Snoopy hand-gliding over a vineyard at sunset, hyper-realistic Napa Valley",
  "Cartoon Snoopy doing crossfit on a rooftop gym, hyper-realistic city skyline backdrop",
  "Cartoon Snoopy climbing an indoor wall in a bouldering gym, hyper-realistic modern gym",
  "Cartoon Snoopy doing a cartwheel across a soccer field, hyper-realistic stadium grass",
  "Cartoon Snoopy swimming butterfly in an Olympic pool, hyper-realistic blue lane water",
  "Cartoon Snoopy doing high jump at a track meet, hyper-realistic athletics stadium",
  "Cartoon Snoopy throwing a discus at a track and field event, hyper-realistic stadium",
  "Cartoon Snoopy doing a vault over a gymnastics horse, hyper-realistic arena floor",
  "Cartoon Snoopy swinging on uneven bars, hyper-realistic Olympic gymnastics venue",
  "Cartoon Snoopy doing a split at a dance competition, hyper-realistic stage and lights",
  "Cartoon Snoopy pirouetting on a stage, hyper-realistic ballet theater and curtain",
  "Cartoon Snoopy breakdancing at a street festival, hyper-realistic urban plaza crowd",
  "Cartoon Snoopy waltzing in a grand ballroom, hyper-realistic chandeliers and marble floor",
  "Cartoon Snoopy doing the Charleston at a 1920s party, hyper-realistic jazz club interior",
  "Cartoon Snoopy grinding a skateboard rail at sunset, hyper-realistic urban street",
  "Cartoon Snoopy doing a kickflip on a rooftop, hyper-realistic city skyline background",
  "Cartoon Snoopy longboarding downhill through a forest road, hyper-realistic autumn leaves",
  "Cartoon Snoopy doing a handstand on a SUP board, hyper-realistic calm morning lake",
  "Cartoon Snoopy racing a sea kayak, hyper-realistic coastal fjord and cliffs",
  "Cartoon Snoopy fly fishing with a chalk stream, hyper-realistic English meadow",
  "Cartoon Snoopy sailing a Sunfish dinghy, hyper-realistic summer bay",
  "Cartoon Snoopy rowing a wooden rowboat on a misty lake, hyper-realistic dawn reflection",
  "Cartoon Snoopy operating a drone in a field, hyper-realistic open meadow and blue sky",
  "Cartoon Snoopy playing table tennis outdoors in a park, hyper-realistic summer setting",
  "Cartoon Snoopy playing billiards in a vintage pool hall, hyper-realistic green felt and lamp",
  "Cartoon Snoopy bowling a perfect strike, hyper-realistic retro bowling alley",
  "Cartoon Snoopy doing laser tag in a neon arena, hyper-realistic glow and fog",
  "Cartoon Snoopy doing axe throwing at a bar, hyper-realistic rustic urban venue",
  "Cartoon Snoopy playing darts at a British pub, hyper-realistic warm pub interior",
  "Cartoon Snoopy in a pie baking competition, hyper-realistic country kitchen and judges",
  "Cartoon Snoopy at a spelling bee on stage, hyper-realistic school auditorium and mic",
  "Cartoon Snoopy doing a cooking show demo, hyper-realistic professional TV kitchen",
  "Cartoon Snoopy baking croissants at 4am in a Paris bakery, hyper-realistic golden interior",
  "Cartoon Snoopy decorating a Christmas tree, hyper-realistic cozy living room glow",
  "Cartoon Snoopy carving a Halloween pumpkin, hyper-realistic autumn porch and candles",
  "Cartoon Snoopy building a blanket fort, hyper-realistic cozy living room afternoon light",
  "Cartoon Snoopy doing a giant jigsaw puzzle, hyper-realistic library floor and firelight",
  "Cartoon Snoopy doing calligraphy at a desk, hyper-realistic Japanese paper and ink",
  "Cartoon Snoopy sketching portraits in a city park, hyper-realistic European square",
  "Cartoon Snoopy printing linocuts in an art studio, hyper-realistic hands and press",
  "Cartoon Snoopy welding a sculpture in an art studio, hyper-realistic spark shower",
  "Cartoon Snoopy doing mosaic tilework at a Mediterranean villa, hyper-realistic courtyard",
  "Cartoon Snoopy restoring a fresco on a cathedral ceiling, hyper-realistic scaffolding",
  "Cartoon Snoopy doing street chalk art on a plaza, hyper-realistic crowd watching",
  "Cartoon Snoopy building a ship in a bottle, hyper-realistic craftsman workshop",
  "Cartoon Snoopy making a stained glass window, hyper-realistic studio and light beams",
  "Cartoon Snoopy spinning wool on a traditional loom, hyper-realistic Scottish highland cottage",
  "Cartoon Snoopy carving a totem pole, hyper-realistic Pacific Northwest forest",
  "Cartoon Snoopy making Murano glass beads, hyper-realistic Venice furnace and color",
  "Cartoon Snoopy doing traditional Japanese calligraphy, hyper-realistic tatami and ink stone",
  "Cartoon Snoopy building a model train set, hyper-realistic basement hobby workshop",
  "Cartoon Snoopy doing macro photography of flowers, hyper-realistic spring garden bloom",
  "Cartoon Snoopy processing film in a darkroom, hyper-realistic red safelight and trays",
  "Cartoon Snoopy doing wildlife photography on a savanna, hyper-realistic Africa at dawn",
  "Cartoon Snoopy filming a YouTube video in a studio, hyper-realistic ring light and setup",
  "Cartoon Snoopy doing magic at a cruise ship show, hyper-realistic deck and sea horizon",
  "Cartoon Snoopy performing stand-up at a comedy festival, hyper-realistic outdoor stage",
  "Cartoon Snoopy busking in a New York subway, hyper-realistic tiled underground platform",
  "Cartoon Snoopy teaching a pottery class, hyper-realistic ceramics studio and students",
  "Cartoon Snoopy giving a cooking lesson at a Tuscany farmhouse, hyper-realistic kitchen",
  "Cartoon Snoopy leading a yoga retreat at sunrise, hyper-realistic Bali rice terraces",
  "Cartoon Snoopy guiding a wine tasting, hyper-realistic French chateau cellar",
  "Cartoon Snoopy leading a nature hike, hyper-realistic national park trail and forest",
  "Cartoon Snoopy teaching a ballet class, hyper-realistic dance studio and mirror wall",
  "Cartoon Snoopy walking a pack of dogs in a city park, hyper-realistic Manhattan morning",
  "Cartoon Snoopy delivering mail on a bicycle, hyper-realistic Dutch town street",
  "Cartoon Snoopy running a vintage bookshop, hyper-realistic London Thames book stall",
  "Cartoon Snoopy painting a fence on a summer day, hyper-realistic Americana backyard",
  "Cartoon Snoopy sweeping autumn leaves in a park, hyper-realistic golden October light",
  "Cartoon Snoopy building a birdhouse, hyper-realistic spring backyard workshop",
  "Cartoon Snoopy delivering a pizza on a moped, hyper-realistic Italian town street",
  "Cartoon Snoopy driving an ice cream truck, hyper-realistic summer suburb and kids",
  "Cartoon Snoopy operating a gelato cart in an Italian piazza, hyper-realistic warm square",
  "Cartoon Snoopy making mole sauce in an Oaxacan kitchen, hyper-realistic Mexican home",
  "Cartoon Snoopy shucking oysters at a New Orleans oyster bar, hyper-realistic raw bar",
  "Cartoon Snoopy flambeing a crepe in a Parisian bistro, hyper-realistic candlelit table",
  "Cartoon Snoopy spinning pizza dough in a Naples pizzeria, hyper-realistic wood-fired oven",
  "Cartoon Snoopy hand-pulling noodles in a Chinese noodle shop, hyper-realistic steam",
  "Cartoon Snoopy stacking dim sum baskets in a Hong Kong kitchen, hyper-realistic steam",
  "Cartoon Snoopy preparing a Japanese bento box, hyper-realistic minimalist kitchen",
  "Cartoon Snoopy judging a barbecue competition, hyper-realistic Texas smokehouse",
  "Cartoon Snoopy at a clambake on a New England beach, hyper-realistic coast and fire pit",
  "Cartoon Snoopy doing a Brazilian BBQ rodizio, hyper-realistic churrascaria and glowing coals",
  "Cartoon Snoopy stirring a crawfish boil, hyper-realistic Louisiana bayou at sunset",
  "Cartoon Snoopy doing a competitive hot wings eating contest, hyper-realistic sports bar",
  "Cartoon Snoopy winning a donut eating contest, hyper-realistic American diner interior",
  "Cartoon Snoopy making a French macaron tower, hyper-realistic Paris patisserie interior",
  "Cartoon Snoopy doing a tea ceremony in a Kyoto garden, hyper-realistic tatami and lanterns",
  "Cartoon Snoopy doing an elaborate afternoon tea, hyper-realistic English country hotel",
  "Cartoon Snoopy pressing apples at a cider mill, hyper-realistic New England autumn",
  "Cartoon Snoopy stomping grapes in a barrel, hyper-realistic Tuscan harvest festival",
  "Cartoon Snoopy paddleboarding under a tropical waterfall, hyper-realistic Hawaii pool",
  "Cartoon Snoopy racing a jet ski, hyper-realistic ocean spray and blue summer sky",
  "Cartoon Snoopy doing aerobatics in a biplane, hyper-realistic blue sky and contrails",
  "Cartoon Snoopy riding a Ducati on Italian Alps switchbacks, hyper-realistic mountain road",
  "Cartoon Snoopy crossing a marathon finish line, hyper-realistic city street and crowd roar",
  "Cartoon Snoopy throwing a perfect spiral pass, hyper-realistic NFL stadium and crowd",
  "Cartoon Snoopy hitting a home run at night, hyper-realistic ballpark lights and roar",
  "Cartoon Snoopy scoring a hat trick, hyper-realistic Premier League stadium crowd",
  "Cartoon Snoopy making a diving catch in the end zone, hyper-realistic crowd eruption",
  "Cartoon Snoopy doing a hole in one, hyper-realistic Augusta golf course green",
  "Cartoon Snoopy winning the Kentucky Derby, hyper-realistic Louisville track and roses",
  "Cartoon Snoopy winning a gold medal on the Olympic podium, hyper-realistic ceremony",
  "Cartoon Snoopy doing a cartwheel on a beach at sunrise, hyper-realistic golden sand",
  "Cartoon Snoopy doing the high dive at an outdoor pool, hyper-realistic summer sky",
  "Cartoon Snoopy doing a kickflip over a gap, hyper-realistic city street crowd",
  "Cartoon Snoopy at an open water triathlon finish, hyper-realistic beach and cheering",
  "Cartoon Snoopy doing a barrel roll in a small plane, hyper-realistic clear blue sky",
  "Cartoon Snoopy winning a sandcastle competition, hyper-realistic beach judges",
  "Cartoon Snoopy at a beach bonfire strumming a guitar, hyper-realistic ocean night sky",
  "Cartoon Snoopy carving a jack-o-lantern on a porch, hyper-realistic October neighborhood",
  "Cartoon Snoopy making homemade ice cream, hyper-realistic farmhouse kitchen summer",
  "Cartoon Snoopy doing starfish pose on a yoga mat, hyper-realistic meadow at dawn",
  "Cartoon Snoopy at a summer camp arts and crafts table, hyper-realistic rustic cabin",
  "Cartoon Snoopy on a paddleboat on a lily pond, hyper-realistic garden lake afternoon",

  // ── ALBUM COVER top-up (to reach 200) ──
  "Snoopy on a rooftop in New Orleans at dusk, jazz album cover, river behind and trumpet",
  "Snoopy sitting alone in a spotlight in a massive empty stadium, stadium rock album cover",
  "Snoopy in a flower field at golden hour, folk indie album cover, soft warmth and wind",
  "Snoopy at a piano bar after midnight, neo-soul album cover, dim light and emotion",
  "Snoopy looking out a rain-streaked train window, introspective indie album cover",
  "Snoopy with a drum kit in a garage, punk album cover, peeling walls and raw energy",
  "Snoopy playing a muted trumpet in a Paris alley, jazz album cover, cobblestone and fog",
  "Snoopy in a hot tub under desert stars, synth-wave album cover, neon and night sky",
  "Snoopy on a mountain peak at sunset with a guitar, folk rock album cover, epic alone",
  "Snoopy in a vinyl record store aisle, indie album cover, warm dust and discovery",
  "Snoopy on a fire escape at sunrise with coffee, bedroom pop album cover, golden light",
  "Snoopy in a Japanese ramen shop alone at 2am, city pop album cover, steam and neon",
  "Snoopy on a skateboard at an empty parking lot at dusk, lo-fi hip-hop album cover",
  "Snoopy holding a boom box under a window in the rain, 80s pop love album cover",
  "Snoopy on a rooftop garden surrounded by plants, indie ambient album cover, green",
  "Snoopy in a sunlit loft with morning coffee and vinyl, jazz album cover, warm intimate",
  "Snoopy on a night bus in London rain, britpop album cover, wet window and city glow",
  "Snoopy silhouetted in a doorway at sunset, soul album cover, long shadow warm dust",
  "Snoopy at a typewriter with a bottle of bourbon, outlaw country album cover, raw",
  "Snoopy wearing a fisherman knit sweater by the sea, folk album cover, cold grey morning",
  "Snoopy on a trampoline at night under stars, indie pop album cover, joyful and light",
  "Snoopy in a photo booth strip, pop album cover, four frames of different expressions",
  "Snoopy at a beach bonfire at night, folk summer album cover, embers and friends",
  "Snoopy jumping in a puddle in the rain, feel-good pop album cover, color and joy",
  "Snoopy looking up at a night sky full of satellites, electronic ambient album cover",
  "Snoopy in a moonlit cornfield, country gothic album cover, eerie and lonely",
  "Snoopy in front of a giant amplifier wall, heavy rock album cover, raw power",
  "Snoopy on a city rooftop with a megaphone at dawn, indie activist album cover",

  // ── RETRO POSTER top-up (to reach 300) ──
  "Snoopy as a 1940s pin-up pilot on a nose art poster, World War II bomber art style",
  "Snoopy on a vintage 1920s bootleg whiskey poster, Prohibition-era speakeasy style",
  "Snoopy on a 1960s surf shop window poster, hand-lettered California beach culture",
  "Snoopy as a vintage 1950s gas station attendant poster, Route 66 Americana style",
  "Snoopy as a vintage Olympic weightlifting poster, 1936 Berlin Games graphic style",
  "Snoopy on a vintage steeplechase horse racing poster, 1920s British turf club style",
  "Snoopy on a vintage wrestling championship poster, 1950s carnival wrestler bold art",
  "Snoopy as a vintage safari hunter poster, 1930s African expedition bold illustration",
  "Snoopy on a vintage 1920s flying club poster, barnstormer illustration and sky",
  "Snoopy on a vintage polar exploration poster, 1915 Shackleton era, ice and courage",
  "Snoopy on a retro submarine warfare poster, WWII underwater hunter graphic style",
  "Snoopy on a vintage parachute troop recruitment poster, WWII airborne graphic",
  "Snoopy on a retro Pacific island travel poster, 1930s colonial shipping line style",
  "Snoopy on a vintage Trans-Siberian Railway poster, 1920s Russian graphic style",
  "Snoopy as a vintage kung fu grandmaster scroll, traditional Chinese brush painting style",
  "Snoopy on a vintage Chinese New Year poster, bold red and gold and dragon",
  "Snoopy on a vintage Dia de los Muertos poster, Mexican folk art and marigolds",
  "Snoopy on a vintage Rio Carnival poster, 1940s Brazilian samba style, feathers and color",
  "Snoopy on a vintage Oktoberfest beer festival poster, 1920s Munich illustration style",
  "Snoopy on a vintage Midsummer festival poster, 1920s Scandinavian folk art style",
  "Snoopy on a vintage Highland Games poster, 1930s Scottish athletic illustration",
  "Snoopy on a vintage National Cherry Blossom Festival poster, 1920s Washington DC",
  "Snoopy on a retro Woodstock music festival poster, 1969 psychedelic era, dove and guitar",
  "Snoopy on a retro CBGB club poster, 1977 punk era, raw and Xerox aesthetic",
  "Snoopy on a retro Studio 54 nightclub poster, 1978 era, disco glamour and darkness",
  "Snoopy on a retro Haçienda Manchester nightclub poster, 1989 rave era FAC 51 style",
  "Snoopy on a retro Lollapalooza 1991 era festival poster, alternative rock and grunge",
  "Snoopy on a vintage underground zine cover, 1980s DIY culture, Xerox and collage",
  "Snoopy on a vintage carnival fortune teller poster, 1910s mystical fair aesthetic",
  "Snoopy on a vintage apothecary poster, 1880s medicine shop, serif type and tinctures",
  "Snoopy on a vintage Barnum and Bailey Greatest Show poster, 1900s billboard style",
  "Snoopy on a vintage Wild West show poster, Buffalo Bill 1880s style, horses and guns",
  "Snoopy on a vintage Snake Charmer sideshow poster, 1920s carnival illustration",
  "Snoopy on a vintage Brownie camera ad poster, 1900s Kodak illustration style",
  "Snoopy on a vintage Edison Phonograph ad poster, 1905 era, trumpet horn and wonder",
  "Snoopy on a vintage radio broadcast recruitment poster, 1930s BBC era illustration",
  "Snoopy on a vintage television debut ad poster, 1939 World's Fair cathode ray",
  "Snoopy on a vintage nuclear energy future poster, 1958 atomic optimism style",
  "Snoopy on a vintage Space Race satellite poster, 1957 Soviet Sputnik constructivist",
  "Snoopy on a vintage NASA Mission Control poster, 1960s engineering heroism graphic",
  "Snoopy on a vintage computer mainframe ad poster, 1965 IBM era, clean and modern",
  "Snoopy on a vintage Apple II era computer ad, 1978 garage startup poster aesthetic",
  "Snoopy on a vintage environmental Earth summit poster, 1972 Stockholm era graphic",
  "Snoopy on a retro bicycle lane infrastructure poster, 1970s Dutch cycling advocacy",
  "Snoopy on a vintage train safety poster, 1930s British Railways illustration",
  "Snoopy on a vintage school health poster, 1950s posture and hygiene graphic style",
  "Snoopy on a vintage swimming pool safety poster, 1960s municipal recreation style",
  "Snoopy on a vintage wildfire prevention poster, 1960s forest service illustration",
  "Snoopy on a vintage earthquake preparedness poster, 1970s California civil defense",
  "Snoopy on a vintage tornado shelter poster, 1950s Midwest safety graphic",
  "Snoopy on a vintage hurricane preparedness poster, 1940s Florida coastal style",
  "Snoopy on a vintage avalanche warning poster, 1930s Swiss Alpine style",
  "Snoopy on a vintage industrial worker safety poster, 1940s American factory heroism",
  "Snoopy on a vintage miners union hall poster, 1910s labor movement illustration",
  "Snoopy on a vintage steelworkers solidarity poster, 1930s Pittsburgh union hall art",
  "Snoopy on a vintage vote for suffrage poster, 1912 women's rights march illustration",
  "Snoopy on a vintage civil rights march poster, 1963 era bold graphic and dignity",
  "Snoopy on a retro anti-war march poster, 1969 Vietnam era protest graphic",
  "Snoopy on a vintage Ladies Bicycle Touring Club poster, 1898 New Woman era",
  "Snoopy on a retro internet is here poster, 1994 early web era, browser window graphic",
  "Snoopy on a vintage school fire drill poster, 1940s safety program graphic style",
  "Snoopy on a vintage camping is fun poster, 1950s National Park Service illustration",
  "Snoopy on a retro bowling league championship poster, 1960s American recreation style",
  "Snoopy on a vintage community theater opening night poster, 1940s local arts style",
  "Snoopy on a vintage garden show prize ribbon poster, 1930s horticultural society",
  "Snoopy on a vintage lighthouse preservation poster, 1920s maritime heritage style",
  "Snoopy on a retro folk music revival poster, 1963 Newport Folk era illustration",


  "Cartoon Snoopy winning an arm wrestling contest at a county fair, hyper-realistic summer crowd",
  "Cartoon Snoopy doing a wheelbarrow race at a school field day, hyper-realistic outdoor event",
  "Cartoon Snoopy doing the limbo at a company picnic, hyper-realistic summer corporate party",
  "Cartoon Snoopy competing in a tug of war at a beach, hyper-realistic sand and waves",
  "Cartoon Snoopy doing a cannonball off a tall dock, hyper-realistic lake and summer afternoon",
  "Cartoon Snoopy catching fireflies in a mason jar, hyper-realistic Tennessee meadow at dusk",
  "Cartoon Snoopy building a fort in a snowy backyard, hyper-realistic winter neighborhood",
  "Cartoon Snoopy making a leaf pile and jumping in, hyper-realistic golden October neighborhood",
  "Cartoon Snoopy doing a polar plunge on New Years Day, hyper-realistic icy beach crowd",
  "Cartoon Snoopy winning a chili cook-off, hyper-realistic Texas state fair and blue ribbon",
  "Cartoon Snoopy at a milking contest on a Vermont farm, hyper-realistic red barn and cows",
  "Cartoon Snoopy winning an egg and spoon race, hyper-realistic British school sports day",
  "Cartoon Snoopy doing a three-legged race at a fair, hyper-realistic summer Americana",
  "Cartoon Snoopy winning at horseshoes in a backyard, hyper-realistic summer barbecue",
  "Cartoon Snoopy competing in a corn maze race, hyper-realistic October farm and field",
  "Cartoon Snoopy doing competitive log splitting, hyper-realistic Maine homestead winter",
  "Cartoon Snoopy raking a zen garden, hyper-realistic Kyoto temple rock garden",
  "Cartoon Snoopy doing competitive hedge trimming, hyper-realistic English estate garden",
  "Cartoon Snoopy in a soap box derby race, hyper-realistic neighborhood hill and crowd",
  "Cartoon Snoopy operating a model train layout at a fair, hyper-realistic miniature village",
  "Cartoon Snoopy competing in a model rocketry launch, hyper-realistic open field and sky",
  "Cartoon Snoopy at a vintage car concours event, hyper-realistic manicured lawn and trophies",
  "Cartoon Snoopy riding a penny farthing through a park, hyper-realistic Victorian era dress",
  "Cartoon Snoopy doing competitive kite flying, hyper-realistic coastal meadow and wind",
  "Cartoon Snoopy at a rubber duck race in a stream, hyper-realistic town festival bridge",
  "Cartoon Snoopy entering a paper boat race in a fountain, hyper-realistic French jardin",
  "Cartoon Snoopy competing in a stilts race, hyper-realistic Dutch street festival",
  "Cartoon Snoopy playing giant outdoor chess, hyper-realistic European plaza summer",
  "Cartoon Snoopy competing in a competitive dog grooming contest, hyper-realistic fair tent",
  "Cartoon Snoopy doing an Olympic torch run, hyper-realistic stadium approach and crowd",
  "Cartoon Snoopy completing an Ironman triathlon, hyper-realistic sunset finish line",
  "Cartoon Snoopy finishing the Boston Marathon, hyper-realistic Boylston Street and crowd",
  "Cartoon Snoopy winning a spelling bee, hyper-realistic stage and packed gymnasium",
  "Cartoon Snoopy at a science olympiad competition, hyper-realistic university lab",
  "Cartoon Snoopy winning a debate tournament, hyper-realistic Oxford Union chamber",
  "Cartoon Snoopy competing in a robotics competition, hyper-realistic FIRST Robotics arena",
  "Cartoon Snoopy at a math olympiad, hyper-realistic international competition venue",
  "Cartoon Snoopy doing competitive speed painting, hyper-realistic art competition stage",
  "Cartoon Snoopy at a sandcastle competition on a French beach, hyper-realistic judges",
  "Cartoon Snoopy winning a flower growing contest, hyper-realistic Chelsea Flower Show",
  "Cartoon Snoopy competing in a cheesemaking contest, hyper-realistic Swiss mountain dairy",
  "Cartoon Snoopy in a pie eating contest at a county fair, hyper-realistic summer Americana",
  "Cartoon Snoopy completing a wilderness survival course, hyper-realistic forest and fire",
  "Cartoon Snoopy winning a fishing derby, hyper-realistic Maine lake at golden hour",
  "Snoopy on a vintage community swimming pool poster, 1950s municipal recreation style, bold and summery",
  "Snoopy on a retro youth hostel travel poster, 1960s backpacker hitchhiker style, Europe and optimism",
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
    var res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + NB_API_KEY,
        {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Based on this Snoopy art description: \"" + prompt + "\"\n\nGenerate an optimized Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n \"title\": \"Etsy title under 80 chars. Format: Snoopy [Scene] Canvas Print Peanuts [Theme] Wall Decor. NO dashes, NO hyphens, NO special characters.\",\n \"description\": \"3 engaging paragraphs about this specific artwork scene, the canvas print quality, and who would love it as a gift.\",\n \"tags\": [\"exactly 13 tags, each under 20 characters, focused on Snoopy Peanuts and the specific scene\"]\n}" }] }],
                generationConfig: { responseModalities: ["TEXT"] }
            })
        }
    );
    var data = await res.json();
    var text = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (!text) throw new Error("Listing generation failed: " + JSON.stringify(data));
    var clean = text.replace(/```json|```/g, "").trim();
    var listing = JSON.parse(clean);
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
    var isActivity = prompt.startsWith("Cartoon Snoopy");
    var isAlbum = prompt.toLowerCase().includes("album cover");
    var isPoster = prompt.toLowerCase().includes("poster");
    var suffix;
    if (isActivity) {
        suffix = " Generate as a tall vertical portrait artwork in 4:5 aspect ratio, taller than wide. "
            + "CRITICAL: fill the ENTIRE frame completely edge to edge — zero white space, zero margins, zero borders on any side. "
            + "The hyper-realistic background must bleed to every edge of the frame. "
            + "No text, no words, no letters, no numbers, no signs with writing. Canvas wall art suitable for print.";
    } else if (isAlbum) {
        suffix = " Generate as a tall 4:5 vertical album cover artwork. "
            + "Fill the ENTIRE frame edge to edge — no white borders or margins whatsoever. "
            + "Faithfully recreate the iconic visual composition and color palette of this famous album cover scene, but replace the original artist(s) with cartoon Snoopy. "
            + "Keep all other visual details — the lighting, setting, mood, colors, and composition — as close to the original as possible. "
            + "ABSOLUTELY NO TEXT, no words, no album title, no artist name, no letters, no numbers anywhere in the image.";
    } else if (isPoster) {
        suffix = " Generate as a tall vertical retro poster artwork in 4:5 aspect ratio. "
            + "Fill the ENTIRE frame edge to edge — no white margins, no borders, no blank areas. "
            + "Bold vintage poster graphic design with rich aged colors and strong composition. "
            + "Snoopy prominently featured as the hero of the poster design. "
            + "ABSOLUTELY NO TEXT, no words, no letters, no numbers, no title, no tagline anywhere in the image.";
    } else {
        suffix = " Generate as a tall vertical portrait artwork in 4:5 aspect ratio. "
            + "Fill the ENTIRE frame edge to edge, zero white space or margins. "
            + "No text, no words, no letters. Canvas wall art suitable for print.";
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
