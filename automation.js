// POD Automation Pipeline
// Gemini → Printify → Etsy
// Run with: node automation.js

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const PRINTIFY_EMAIL = process.env.PRINTIFY_EMAIL;
const PRINTIFY_PASSWORD = process.env.PRINTIFY_PASSWORD;
const SHOP_ID = '18634010';
const EBAY_SHOP_ID = '27315339';
const BLUEPRINT_ID = 1159;
const PRINT_PROVIDER_ID = 99;

// Procedural retro color system - randomly picks one color from each pool per image.
// 55 x 31 x 35 x 20 = ~1.2 million unique palette combinations. Effectively unlimited variety.
// Each image gets a fresh background/title/accent/highlight combo picked at random.

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

function buildStyleSuffix(palette) {
  return " in vintage 1960s pulp comic book cover style, aged paper texture, halftone dot shading, bold black ink outlines, color scheme: " + palette + ", slight registration offset like old print, weathered edges, dynamic action composition, bold colorful flat illustration. Render the title text and ribbon banner text exactly as quoted in the prompt, clearly legible and prominently displayed at the top.";
}

const PROMPTS = [
  // FLYING ACE / AVIATION
  '"SNOOPY: FLYING ACE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "SCOURGE OF THE SKIES" yellow ribbon banner subtitle, Snoopy in goggles and red scarf piloting his red doghouse through clouds, biplanes and Woodstock wingmen circling around him',
  '"THE RED BARON RETURNS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DOGFIGHT AT DAWN" yellow ribbon banner subtitle, Snoopy as Flying Ace shaking his fist at the sky, smoke trails and propellers swirling around him',
  '"BEAGLE SQUADRON" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "NO MISSION TOO SMALL" yellow ribbon banner subtitle, Snoopy saluting in pilot gear, Woodstock co-pilot beside him, vintage airplane silhouettes in formation',
  '"CHAOS IN THE CLOUDS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WORLDS OKAYEST ADVENTURERS" yellow ribbon banner subtitle, Snoopy with parachute and Woodstock falling through clouds, birds circling around them',
  '"DAWN PATROL" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "EYES IN THE SKY" yellow ribbon banner subtitle, Snoopy in pilot gear scanning the horizon from the cockpit at sunrise',
  '"WINGS OF GLORY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "MEDAL OF HONOR" yellow ribbon banner subtitle, Snoopy in pilot uniform receiving a medal, Woodstock saluting beside him',
  '"ESCAPE FROM ENEMY LINES" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "NO BEAGLE LEFT BEHIND" yellow ribbon banner subtitle, Snoopy and Woodstock crawling under barbed wire, searchlights overhead',
  '"MIDNIGHT MISSION" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "STEALTH AND COURAGE" yellow ribbon banner subtitle, Snoopy in pilot gear sneaking past spotlights at night',
  '"PARACHUTE PANIC" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BAILOUT" yellow ribbon banner subtitle, Snoopy clutching parachute strings, Woodstock dangling beside him, tangled lines',
  '"BIPLANE BANDIT" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "RIDER OF THE WIND" yellow ribbon banner subtitle, Snoopy doing a barrel roll on his doghouse plane, Woodstock holding on for dear life',
  '"FLIGHT 1969" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DESTINATION UNKNOWN" yellow ribbon banner subtitle, Snoopy as airline captain at the controls, Woodstock as flight attendant in retro uniform',
  '"ACE OF THE SKIES" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TOP OF HIS GAME" yellow ribbon banner subtitle, Snoopy in flight goggles giving a thumbs up, vintage planes behind him',
  '"TURBULENCE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "HOLD ON TIGHT" yellow ribbon banner subtitle, Snoopy gripping his doghouse plane as it shakes through stormy clouds, Woodstock flapping wildly',
  '"CLOUDS OF DESTINY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ABOVE IT ALL" yellow ribbon banner subtitle, Snoopy soaring proudly through pillowy clouds with Woodstock by his side',
  '"AERIAL ARCHIVE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "UNTOLD STORIES" yellow ribbon banner subtitle, Snoopy holding aviator goggles and a scrapbook of his adventures',

  // WESTERN / OUTLAW
  '"WANTED" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DEAD OR ALIVE" yellow ribbon banner subtitle, Snoopy in cowboy hat and bandana, Woodstock as outlaw sidekick, desert cacti and wanted posters around them',
  '"THE GOOD THE BAD AND THE BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "HIGH NOON" yellow ribbon banner subtitle, Snoopy as cowboy at a showdown, tumbleweeds and a setting sun behind him',
  '"OUTLAW BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "LAST STAND" yellow ribbon banner subtitle, Snoopy with two pistols drawn, bandana over his snout, Woodstock with a tiny lasso',
  '"GUNSLINGER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "QUICK PAW" yellow ribbon banner subtitle, Snoopy in poncho squinting under his hat, dusty western town behind him',
  '"DESERT JUSTICE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WHEN THE SUN SETS" yellow ribbon banner subtitle, Snoopy riding a horse across red rock canyons at sunset',
  '"STAGECOACH HEIST" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "THE BEAGLE STRIKES" yellow ribbon banner subtitle, Snoopy in mask leaping onto a runaway stagecoach, Woodstock at the reins',
  '"SHERIFF SNOOPY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TOWN AINT BIG ENOUGH" yellow ribbon banner subtitle, Snoopy with a tin star badge standing in front of a saloon',
  '"RIDE OR DIE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TUMBLEWEED TRAIL" yellow ribbon banner subtitle, Snoopy galloping on a wild horse through the open prairie, Woodstock hanging on',
  '"WILD WEST WONDERS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FRONTIER LEGENDS" yellow ribbon banner subtitle, Snoopy and Woodstock as cowboys around a campfire, harmonica in hand',
  '"BOOT HILL BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "LEGEND OF THE WEST" yellow ribbon banner subtitle, Snoopy tipping his hat against a glowing desert horizon',

  // SPACE / SCI-FI
  '"MOON MISSION" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ONE SMALL PAW" yellow ribbon banner subtitle, Snoopy in astronaut helmet floating among planets, Woodstock in a tiny spacesuit beside him',
  '"COSMIC BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "LOST IN THE STARS" yellow ribbon banner subtitle, Snoopy in retro spacesuit pointing at a comet, rockets and ringed planets surrounding him',
  '"SPACE INVADERS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DEFEND THE GALAXY" yellow ribbon banner subtitle, Snoopy with a ray gun shooting at retro flying saucers, Woodstock in a bubble helmet',
  '"STARFLEET BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TO BOLDLY GO" yellow ribbon banner subtitle, Snoopy as a starship captain in a vintage uniform, Woodstock at the helm',
  '"ROCKET RIDERS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BLAST OFF" yellow ribbon banner subtitle, Snoopy and Woodstock launching in a vintage red rocket trailing flame',
  '"MARS OR BUST" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "RED PLANET ADVENTURE" yellow ribbon banner subtitle, Snoopy planting a flag on Mars, retro rover and Woodstock astronaut behind him',
  '"ALIEN ENCOUNTER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WE COME IN PEACE" yellow ribbon banner subtitle, Snoopy shaking hands with a friendly green alien, Woodstock peeking from a UFO',
  '"GALACTIC GUARDIANS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PROTECT THE COSMOS" yellow ribbon banner subtitle, Snoopy and Woodstock floating heroically among nebulae and starbursts',
  '"INTERSTELLAR" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "INTO THE UNKNOWN" yellow ribbon banner subtitle, Snoopy gazing through the porthole of a retro spaceship at distant galaxies',
  '"ZERO GRAVITY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FLOATING FREE" yellow ribbon banner subtitle, Snoopy and Woodstock weightless inside a spacecraft, food drifting around them',
  '"ROBOT REBELLION" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BEAGLE VS MACHINE" yellow ribbon banner subtitle, Snoopy battling a retro tin-foil robot with sparks flying',
  '"TIME WARP" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "STUCK IN THE 60S" yellow ribbon banner subtitle, Snoopy and Woodstock spinning through a swirling vortex of clocks and stars',
  '"ASTEROID ALERT" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DODGE EVERYTHING" yellow ribbon banner subtitle, Snoopy steering his rocket through a field of jagged asteroids',
  '"NEBULA NIGHTS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "STARLIGHT JOURNEY" yellow ribbon banner subtitle, Snoopy and Woodstock drifting through a glowing pink and purple nebula',
  '"FROM THE STARS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "THEY CAME IN PEACE" yellow ribbon banner subtitle, Snoopy emerging from a flying saucer with Woodstock as alien mascot',

  // SUPERHERO
  '"SUPER SNOOPY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DEFENDER OF THE DOGHOUSE" yellow ribbon banner subtitle, Snoopy in flowing red cape arms outstretched flying through clouds, comic action lines radiating outward',
  '"MASKED MARVEL" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BEWARE THE BEAGLE" yellow ribbon banner subtitle, Snoopy in a domino mask and cape striking a hero pose, Woodstock as sidekick at his feet',
  '"CAPTAIN BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WORLDS GREATEST" yellow ribbon banner subtitle, Snoopy in a star-spangled costume holding a shield, action burst behind him',
  '"BEAGLE-MAN" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WITH GREAT POWER" yellow ribbon banner subtitle, Snoopy swinging from a web between skyscrapers, Woodstock clinging to his back',
  '"WONDER BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "AMAZON OF THE BACKYARD" yellow ribbon banner subtitle, Snoopy with a golden lasso and tiara striking a heroic stance',
  '"NIGHT HOUND" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PROTECTOR OF THE DARK" yellow ribbon banner subtitle, Snoopy in a black cowl perched on a gargoyle over a city skyline',
  '"INCREDIBLE BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DONT MAKE HIM HUNGRY" yellow ribbon banner subtitle, Snoopy ripping off a sweater vest, Woodstock cheering nearby',
  '"FANTASTIC FOUR PAWS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TEAM OF HEROES" yellow ribbon banner subtitle, Snoopy leading a squad of caped beagles in a heroic pose',
  '"SECRET IDENTITY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WHO IS HE REALLY" yellow ribbon banner subtitle, Snoopy in glasses and tie pulling open his shirt to reveal a cape and S logo',
  '"ORIGIN STORY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "HOW IT ALL BEGAN" yellow ribbon banner subtitle, Snoopy struck by a glowing meteor, Woodstock watching in shock',

  // SPY / DETECTIVE
  '"SECRET AGENT SNOOPY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "LICENSE TO SNIFF" yellow ribbon banner subtitle, Snoopy in trench coat and fedora holding a magnifying glass, silhouettes of suspects in shadow behind him',
  '"THE BEAGLE FILES" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "CLASSIFIED" yellow ribbon banner subtitle, Snoopy as detective with a pipe, Woodstock in a tiny trench coat, foggy noir alley background',
  '"CODE NAME BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TOP SECRET" yellow ribbon banner subtitle, Snoopy in a tuxedo holding a martini glass, vintage spy gadgets around him',
  '"DETECTIVE BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "CASE CLOSED" yellow ribbon banner subtitle, Snoopy examining a clue with a magnifying glass, Woodstock taking notes',
  '"MIDNIGHT SPY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "SHADOWS AND SECRETS" yellow ribbon banner subtitle, Snoopy in dark trench coat lurking under a streetlamp at night',
  '"INSPECTOR SNOOPY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ON THE CASE" yellow ribbon banner subtitle, Snoopy in deerstalker hat and pipe, Woodstock as sidekick with a notepad',
  '"PRIVATE EYE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WHO DUNNIT" yellow ribbon banner subtitle, Snoopy in a noir office leaning back in a chair, suspect silhouettes on the wall',
  '"INTERNATIONAL INTRIGUE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "GLOBAL MISSION" yellow ribbon banner subtitle, Snoopy with a globe and passport, Woodstock with travel stamps swirling around',
  '"MISSION IMPAWSIBLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WE ACCEPT" yellow ribbon banner subtitle, Snoopy descending from a ceiling on a wire to grab a glowing briefcase',
  '"SPY VS SPY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BATTLE OF WITS" yellow ribbon banner subtitle, Snoopy and Woodstock in matching trench coats facing off across a chessboard',

  // HORROR / MONSTER PARODY
  '"BEAGLE VS THE CAT NEXT DOOR" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "EPIC SHOWDOWN" yellow ribbon banner subtitle, Snoopy in fighting stance, giant menacing cat shadow looming, fence and full moon background',
  '"NIGHT OF THE BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TERROR ON THE ROOF" yellow ribbon banner subtitle, Snoopy as the Vulture lurking on his doghouse, full moon and bats around him',
  '"DRACULA BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "THE BITE OF NIGHT" yellow ribbon banner subtitle, Snoopy in a black cape with vampire fangs, castle and bats in the background',
  '"WEREWOLF WOODSTOCK" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FULL MOON FRENZY" yellow ribbon banner subtitle, Woodstock transforming into a fluffy werewolf, Snoopy stepping back in horror',
  '"ZOMBIE INVASION" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "THE UNDEAD WALK" yellow ribbon banner subtitle, Snoopy and Woodstock running from a horde of cartoon zombies in a graveyard',
  '"GHOST IN THE DOGHOUSE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WHO YA GONNA CALL" yellow ribbon banner subtitle, Snoopy with a proton pack chasing a friendly ghost out of his red doghouse',
  '"FRANKENBEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ITS ALIVE" yellow ribbon banner subtitle, Snoopy with bolts in his neck on a lab table, Woodstock as mad scientist pulling a lever',
  '"MUMMY MENACE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ANCIENT CURSE" yellow ribbon banner subtitle, Snoopy wrapped in bandages stumbling out of a sarcophagus, Woodstock screaming',
  '"CREATURE FROM THE LAGOON" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BEAGLE BEWARE" yellow ribbon banner subtitle, Snoopy peeking nervously into a swamp, scaly hand reaching from the water',
  '"HAUNTED HOUSE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ENTER IF YOU DARE" yellow ribbon banner subtitle, Snoopy and Woodstock standing at the gates of a creepy mansion, lightning flashing',

  // PIRATE / NAUTICAL
  '"CAPTAIN SNOOPY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TERROR OF THE SEAS" yellow ribbon banner subtitle, Snoopy in pirate hat with eye patch holding a sword, Woodstock as parrot on his shoulder, ship and waves behind',
  '"TREASURE OF THE BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "X MARKS THE SPOT" yellow ribbon banner subtitle, Snoopy with a treasure map and shovel, palm trees and a treasure chest behind him',
  '"BUCCANEER BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "RAISE THE FLAG" yellow ribbon banner subtitle, Snoopy hoisting a Jolly Roger on a pirate ship, Woodstock climbing the rigging',
  '"JOLLY ROGER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PIRATES PROWL" yellow ribbon banner subtitle, Snoopy with a cutlass swinging from a rope across the deck of a galleon',
  '"MUTINY ON THE BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ALL HANDS ON DECK" yellow ribbon banner subtitle, Snoopy facing down a crew of mutinous Woodstock pirates on a stormy ship',
  '"DAVY JONES LOCKER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DEEP SEA DANGER" yellow ribbon banner subtitle, Snoopy in a diving helmet exploring an underwater shipwreck',
  '"CARIBBEAN CHAOS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PARROT ON THE SHOULDER" yellow ribbon banner subtitle, Snoopy as pirate captain steering through a tropical storm',
  '"TREASURE ISLAND" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "MAP TO MYSTERY" yellow ribbon banner subtitle, Snoopy with a spyglass spotting an island, Woodstock holding a treasure map',

  // JUNGLE / EXPLORATION
  '"SNOOPY OF THE JUNGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "KING OF THE VINES" yellow ribbon banner subtitle, Snoopy swinging on a vine in a loincloth, Woodstock flying alongside, jungle leaves and parrots framing them',
  '"INDIANA SNOOPY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "RAIDER OF THE LOST BONE" yellow ribbon banner subtitle, Snoopy in fedora and whip running from a giant boulder, ancient temple background',
  '"TARZAN BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "LORD OF THE FOREST" yellow ribbon banner subtitle, Snoopy beating his chest atop a tall tree with monkeys around him',
  '"AMAZON ADVENTURE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DEEP IN THE JUNGLE" yellow ribbon banner subtitle, Snoopy paddling a canoe down a winding river surrounded by toucans and crocodiles',
  '"LOST CITY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ANCIENT TREASURES" yellow ribbon banner subtitle, Snoopy and Woodstock discovering a stone temple covered in vines',
  '"TEMPLE OF DOOM" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FORTUNE AND GLORY" yellow ribbon banner subtitle, Snoopy dodging arrow traps inside a torchlit ruin, Woodstock zipping ahead',
  '"EXPEDITION UNKNOWN" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BEYOND THE MAP" yellow ribbon banner subtitle, Snoopy in pith helmet leading a caravan through dense jungle',
  '"JUNGLE FEVER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WILD WILD WORLD" yellow ribbon banner subtitle, Snoopy hacking through vines with a machete, Woodstock dodging a snake',
  '"TIGER TROUBLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FACE TO FACE" yellow ribbon banner subtitle, Snoopy in safari gear standing eye-to-eye with a friendly cartoon tiger',
  '"RIVERBOAT ADVENTURE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DOWN THE AMAZON" yellow ribbon banner subtitle, Snoopy steering a steamboat down a wild river, Woodstock waving at parrots',

  // SPORTS
  '"SLAMMIN SNOOPY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "HOME RUN HERO" yellow ribbon banner subtitle, Snoopy mid-baseball-swing in a vintage jersey, Woodstock as catcher, stadium lights and crowd silhouettes behind',
  '"GRIDIRON BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TOUCHDOWN" yellow ribbon banner subtitle, Snoopy in a football helmet running with the ball, Woodstock cheerleaders waving pom-poms',
  '"HOOPS HERO" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "NOTHIN BUT NET" yellow ribbon banner subtitle, Snoopy mid-dunk slamming a basketball through a hoop, crowd cheering',
  '"BOXING BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "KNOCKOUT KING" yellow ribbon banner subtitle, Snoopy in red boxing gloves throwing a punch, Woodstock as cornerman with a towel',
  '"GOLF GETAWAY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "HOLE IN ONE" yellow ribbon banner subtitle, Snoopy mid-swing on a green fairway, Woodstock holding the flag',
  '"SURF CHAMPION" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "RIDING THE WAVES" yellow ribbon banner subtitle, Snoopy on a surfboard riding a giant curl, Woodstock surfing on a smaller board beside him',
  '"TENNIS TITAN" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "GRAND SLAM" yellow ribbon banner subtitle, Snoopy mid-serve on a tennis court in retro whites, Woodstock as ball boy',
  '"ICE HOCKEY HERO" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "SHOOT TO SCORE" yellow ribbon banner subtitle, Snoopy in hockey gear slapping a puck, ice and goalie net behind him',
  '"RACING WHEELS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FAST AND FURRY" yellow ribbon banner subtitle, Snoopy in a red race car speeding around a curve, Woodstock waving a checkered flag',
  '"SKI JUMPER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "OFF THE CLIFF" yellow ribbon banner subtitle, Snoopy launching off a ski ramp midair, snowy peaks behind him',
  '"WRESTLING CHAMPION" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BODY SLAM" yellow ribbon banner subtitle, Snoopy in a wrestling singlet flexing in the ring, championship belt around his waist',
  '"OLYMPIC BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "GOING FOR GOLD" yellow ribbon banner subtitle, Snoopy holding a gold medal high, Woodstock waving a flag, podium beneath them',
  '"SKATEBOARD KING" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "AIRBORNE" yellow ribbon banner subtitle, Snoopy doing a kickflip mid-air on a skateboard, urban brick wall background',
  '"BMX BANDIT" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WHEELS OF STEEL" yellow ribbon banner subtitle, Snoopy popping a wheelie on a BMX bike, Woodstock cheering from the curb',

  // MUSIC / ROCK
  '"SNOOPY ROCKS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WORLD TOUR" yellow ribbon banner subtitle, Snoopy with electric guitar mid-jump, Woodstock on drums, stage lights and concert crowd silhouettes behind',
  '"THE BEAGLES" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "LIVE IN CONCERT" yellow ribbon banner subtitle, Snoopy and Woodstock as a band, vintage concert poster style with bold typography',
  '"JAZZ NIGHT" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ALL THAT JAZZ" yellow ribbon banner subtitle, Snoopy playing a saxophone in a smoky club, Woodstock on a tiny piano',
  '"ROCK STAR BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TURN IT UP" yellow ribbon banner subtitle, Snoopy with a microphone screaming on stage, amplifiers stacked behind him',
  '"DJ WOODSTOCK" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DROP THE BEAT" yellow ribbon banner subtitle, Woodstock spinning records on a turntable, Snoopy dancing in disco lights',
  '"PIANO MAN" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TICKLING THE IVORIES" yellow ribbon banner subtitle, Snoopy at a grand piano in a tuxedo, candelabras glowing',
  '"OPERA BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "HIT THE HIGH NOTE" yellow ribbon banner subtitle, Snoopy in opera costume singing dramatically, Woodstock conducting',
  '"BLUES BROTHERS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "MISSION FROM DOG" yellow ribbon banner subtitle, Snoopy and Woodstock in black suits, sunglasses and fedoras singing into mics',
  '"PUNK ROCK" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ANARCHY IN THE BACKYARD" yellow ribbon banner subtitle, Snoopy with a mohawk and electric guitar, Woodstock with safety pins through his feathers',
  '"BAND ON THE RUN" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WORLD TOUR FORTUNE" yellow ribbon banner subtitle, Snoopy and Woodstock running with instruments past adoring fans',

  // CIRCUS / PERFORMANCE
  '"SNOOPYS BIG TOP" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "GREATEST SHOW ON EARTH" yellow ribbon banner subtitle, Snoopy as ringmaster with top hat and red coat, Woodstock juggling beside him, circus tent background',
  '"THE FLYING BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DEATH DEFYING ACT" yellow ribbon banner subtitle, Snoopy as trapeze artist swinging high, Woodstock catching from another bar, big top tent stripes',
  '"RINGMASTER BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "STEP RIGHT UP" yellow ribbon banner subtitle, Snoopy in a red coat raising a megaphone, circus animals lined up behind him',
  '"MAGIC SHOW" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "NOW YOU SEE HIM" yellow ribbon banner subtitle, Snoopy in a wizard cape pulling Woodstock from a top hat, sparkles and stars around them',
  '"STRONGMAN BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FEATS OF STRENGTH" yellow ribbon banner subtitle, Snoopy with handlebar mustache lifting a giant barbell over his head',
  '"FIRE BREATHER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DONT TRY THIS HOME" yellow ribbon banner subtitle, Snoopy blowing a giant flame, Woodstock holding a fire extinguisher',
  '"CLOWN PRINCE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "JESTER OF THE RING" yellow ribbon banner subtitle, Snoopy in a clown costume juggling, Woodstock honking a tiny horn',
  '"TIGHTROPE TERROR" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ONE WRONG STEP" yellow ribbon banner subtitle, Snoopy balancing on a high wire with a parasol, Woodstock cheering from below',

  // RACING / SPEED
  '"BEAGLE SPEEDWAY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FULL THROTTLE" yellow ribbon banner subtitle, Snoopy in racing helmet driving a vintage race car, Woodstock holding a checkered flag, speed lines streaking',
  '"SNOOPY ON WHEELS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BORN TO RIDE" yellow ribbon banner subtitle, Snoopy on a vintage motorcycle wearing leather jacket, Woodstock riding shotgun, open highway behind',
  '"DRAG RACER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "QUARTER MILE KING" yellow ribbon banner subtitle, Snoopy in a hot rod laying down rubber at a starting line',
  '"RALLY CHAMPION" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "OFF THE BEATEN PATH" yellow ribbon banner subtitle, Snoopy driving a rally car through mud and dust, Woodstock as navigator with a map',
  '"BIKER BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BURN RUBBER" yellow ribbon banner subtitle, Snoopy in leather jacket and aviators on a chopper motorcycle, Route 66 sign in the back',
  '"GRAND PRIX GLORY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "LAP OF VICTORY" yellow ribbon banner subtitle, Snoopy spraying champagne on a podium, Woodstock holding a trophy',

  // HOLIDAY / SEASONAL
  '"SNOOPY SAVES CHRISTMAS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "A HOLIDAY ADVENTURE" yellow ribbon banner subtitle, Snoopy in Santa hat carrying a giant gift, Woodstock as elf, snowflakes and pine trees framing them',
  '"SLEIGH BELL BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ROCKIN AROUND THE DOGHOUSE" yellow ribbon banner subtitle, Snoopy ice skating in a scarf, retro Christmas ornaments and holly around him',
  '"HALLOWEEN HORROR" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TRICK OR TREAT" yellow ribbon banner subtitle, Snoopy in a ghost costume holding a candy bag, Woodstock as a pumpkin',
  '"GREAT PUMPKIN PATCH" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WAITING ALL NIGHT" yellow ribbon banner subtitle, Snoopy and Woodstock sitting in a moonlit pumpkin field looking up at the sky',
  '"VALENTINES VICTORY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BE MINE" yellow ribbon banner subtitle, Snoopy holding a giant heart-shaped box of chocolates, Woodstock with cupid wings',
  '"EASTER ESCAPADE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "EGGSTRA SPECIAL" yellow ribbon banner subtitle, Snoopy in bunny ears holding a basket, Woodstock hopping with painted eggs',
  '"FOURTH OF JULY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "STARS AND STRIPES" yellow ribbon banner subtitle, Snoopy holding sparklers, Woodstock with a tiny flag, fireworks bursting',
  '"THANKSGIVING FEAST" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "GOBBLE GOBBLE" yellow ribbon banner subtitle, Snoopy in a pilgrim hat at a giant turkey dinner, Woodstock perched on the gravy boat',
  '"NEW YEAR NEW BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "HAPPY NEW YEAR" yellow ribbon banner subtitle, Snoopy with a party hat and noisemaker, confetti raining down, clock at midnight',
  '"WINTER WONDERLAND" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "SNOWY ADVENTURES" yellow ribbon banner subtitle, Snoopy and Woodstock building a snowman in a falling snow scene',
  '"AUTUMN ADVENTURE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FALLING LEAVES" yellow ribbon banner subtitle, Snoopy jumping in a giant pile of red and orange leaves, Woodstock floating among them',
  '"SPRING AWAKENING" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BLOOM AND GROW" yellow ribbon banner subtitle, Snoopy in a flower crown, Woodstock surrounded by butterflies and tulips',
  '"SUMMER VACATION" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ENDLESS DAYS" yellow ribbon banner subtitle, Snoopy in sunglasses on a beach chair sipping a drink, Woodstock on a tiny float',
  '"BACK TO SCHOOL" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FIRST DAY JITTERS" yellow ribbon banner subtitle, Snoopy with a backpack and apple, Woodstock with a tiny notebook',

  // TRAVEL / CITIES
  '"PARIS ADVENTURE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "VIVE LE BEAGLE" yellow ribbon banner subtitle, Snoopy with a beret and baguette, Eiffel Tower behind him, Woodstock balancing on a croissant',
  '"NEW YORK STORY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BIG APPLE BEAGLE" yellow ribbon banner subtitle, Snoopy in a yellow taxi with the Statue of Liberty and skyline behind him',
  '"TOKYO NIGHTS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "NEON DREAMS" yellow ribbon banner subtitle, Snoopy holding ramen in a glowing alley with neon signs, Woodstock peeking from a lantern',
  '"LONDON CALLING" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "CHEERIO" yellow ribbon banner subtitle, Snoopy in a red telephone booth with Big Ben behind him, Woodstock with a bowler hat',
  '"ROMAN HOLIDAY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WHEN IN ROME" yellow ribbon banner subtitle, Snoopy on a vintage scooter, Colosseum in the background, Woodstock holding gelato',
  '"SAFARI ADVENTURE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WILD AT HEART" yellow ribbon banner subtitle, Snoopy in pith helmet and binoculars, giraffes and elephants in the savanna behind',
  '"EGYPTIAN MYSTERY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PAWS OF THE PHARAOH" yellow ribbon banner subtitle, Snoopy on a camel beside the pyramids, Woodstock with hieroglyphic wings',
  '"VENICE GONDOLA" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FLOATING ROMANCE" yellow ribbon banner subtitle, Snoopy as a gondolier in a striped shirt, Woodstock as passenger with a rose',
  '"SWISS ALPS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PEAK PERFORMANCE" yellow ribbon banner subtitle, Snoopy in lederhosen yodeling on a mountaintop, snow-capped peaks around him',
  '"TROPICAL ESCAPE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PARADISE FOUND" yellow ribbon banner subtitle, Snoopy in a Hawaiian shirt with a coconut drink under a palm tree',
  '"MOUNTAIN MISSION" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "REACH THE SUMMIT" yellow ribbon banner subtitle, Snoopy planting a flag on top of a snowy peak, Woodstock huddled in a parka',
  '"DESERT JOURNEY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ENDLESS HORIZON" yellow ribbon banner subtitle, Snoopy in a turban riding a camel through golden dunes',
  '"ARCTIC ADVENTURE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FROZEN FRONTIER" yellow ribbon banner subtitle, Snoopy bundled in fur on a dogsled, Woodstock leading a tiny husky team',
  '"OUTBACK ADVENTURE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DOWN UNDER" yellow ribbon banner subtitle, Snoopy in a cork hat with a kangaroo and koala, red Australian desert behind',
  '"GREEK GETAWAY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ANCIENT WONDERS" yellow ribbon banner subtitle, Snoopy among white-and-blue Greek buildings, Woodstock with a tiny laurel crown',

  // OUTDOOR / NATURE
  '"CAMPFIRE TALES" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "STORIES IN THE SMOKE" yellow ribbon banner subtitle, Snoopy roasting marshmallows by a fire, Woodstock toasting one on a stick',
  '"FISHING TRIP" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "GONE FISHIN" yellow ribbon banner subtitle, Snoopy in a bucket hat fishing from a small boat, Woodstock on a tiny lily pad',
  '"MOUNTAIN CLIMBER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "REACH THE TOP" yellow ribbon banner subtitle, Snoopy scaling a cliff with rope and pickaxe, Woodstock floating above with a balloon',
  '"RIVER RAFTING" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "RAPIDS AHEAD" yellow ribbon banner subtitle, Snoopy paddling a raft through whitewater, Woodstock holding on for dear life',
  '"FOREST RANGER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PROTECT THE WILD" yellow ribbon banner subtitle, Snoopy in a ranger uniform and hat next to a wooden sign, Woodstock perched on his shoulder',
  '"STORM CHASER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "RIDING THE TWISTER" yellow ribbon banner subtitle, Snoopy clinging to a windmill in a tornado, Woodstock spinning by',
  '"TRAIL BLAZER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "INTO THE WILD" yellow ribbon banner subtitle, Snoopy in hiking boots and backpack on a mountain trail, compass in hand',
  '"LAKE LIFE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PERFECT DAY" yellow ribbon banner subtitle, Snoopy floating on an inflatable in a calm lake, Woodstock as lifeguard',
  '"FOREST ADVENTURE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "INTO THE WOODS" yellow ribbon banner subtitle, Snoopy and Woodstock walking through a mossy forest with sunbeams',
  '"AVALANCHE ATTACK" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "OUTRUN THE SNOW" yellow ribbon banner subtitle, Snoopy on skis racing down a slope, giant snow wave chasing him',

  // DOMESTIC / COZY
  '"BREAKFAST CLUB" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PANCAKES AND PALS" yellow ribbon banner subtitle, Snoopy flipping a giant pancake, Woodstock catching one on his head',
  '"MOVIE NIGHT" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "POPCORN AND PALS" yellow ribbon banner subtitle, Snoopy in 3D glasses with a giant popcorn bucket, Woodstock peeking out of it',
  '"BOOK CLUB" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PAGE TURNERS" yellow ribbon banner subtitle, Snoopy reading a giant book in an armchair, Woodstock perched on the spine',
  '"GAME NIGHT" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DICE AND DOGS" yellow ribbon banner subtitle, Snoopy and Woodstock playing a board game at a glowing table',
  '"PIZZA NIGHT" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "EXTRA CHEESE" yellow ribbon banner subtitle, Snoopy holding a giant slice of pizza, Woodstock balancing on a pepperoni',
  '"TEA TIME" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PROPER PROPER" yellow ribbon banner subtitle, Snoopy with a teacup and monocle, Woodstock perched on a sugar cube',
  '"BAKING DAY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FLOUR POWER" yellow ribbon banner subtitle, Snoopy in apron and chef hat covered in flour, Woodstock rolling out dough',

  // DISASTER / PERIL (vintage pulp style)
  '"VOLCANO ESCAPE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "OUTRUN THE LAVA" yellow ribbon banner subtitle, Snoopy and Woodstock sprinting away from an erupting volcano, lava flowing behind',
  '"TIDAL WAVE TERROR" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TO HIGHER GROUND" yellow ribbon banner subtitle, Snoopy clinging to a palm tree as a giant wave crashes, Woodstock flying for safety',
  '"EARTHQUAKE EMERGENCY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "SHAKE RATTLE AND ROLL" yellow ribbon banner subtitle, Snoopy bracing in a doorway as buildings sway around him',
  '"BLIZZARD BATTLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FROZEN FATE" yellow ribbon banner subtitle, Snoopy trudging through a snowstorm in a heavy coat, Woodstock huddled in his hood',
  '"FOREST FIRE FRENZY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "INTO THE FLAMES" yellow ribbon banner subtitle, Snoopy as firefighter spraying a hose at a burning forest, Woodstock with a tiny axe',
  '"QUICKSAND PERIL" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "SLOWLY SINKING" yellow ribbon banner subtitle, Snoopy reaching for a vine as he sinks into quicksand, Woodstock pulling',
  '"DEEP SEA DESCENT" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TO THE DEPTHS" yellow ribbon banner subtitle, Snoopy in a vintage diving suit on the ocean floor, giant fish silhouettes around him',
  '"TYPHOON TROUBLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "INTO THE EYE" yellow ribbon banner subtitle, Snoopy steering a small boat through enormous stormy waves',

  // ROMANCE PARODY
  '"BEAGLE LOVE STORY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "FOREVER AND ALWAYS" yellow ribbon banner subtitle, Snoopy presenting a single rose, Woodstock with hearts floating around him',
  '"FROM PARIS WITH LOVE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "LE GRAND AMOUR" yellow ribbon banner subtitle, Snoopy holding a heart-shaped balloon under the Eiffel Tower at sunset',
  '"SUMMER ROMANCE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ENDLESS LOVE" yellow ribbon banner subtitle, Snoopy and Woodstock walking on a beach at sunset with footprints in the sand',
  '"WEDDING DAY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "I DO" yellow ribbon banner subtitle, Snoopy in a top hat and bowtie, Woodstock as flower bird, confetti raining down',
  '"FIRST DATE JITTERS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "WILL HE OR WONT HE" yellow ribbon banner subtitle, Snoopy nervously holding flowers at a doorstep, Woodstock peeking out',

  // BEACH / SURF
  '"SURFIN SNOOPY" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "CATCH A WAVE" yellow ribbon banner subtitle, Snoopy on a surfboard riding a giant curl, Woodstock surfing on a smaller board beside him',
  '"BEACH BUM BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "SUMMER OF 69" yellow ribbon banner subtitle, Snoopy in sunglasses lounging with a coconut drink, palm trees and sun rays framing him',
  '"TROPICAL TROUBLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PARADISE LOST" yellow ribbon banner subtitle, Snoopy stranded on a tiny island holding an SOS sign, Woodstock fanning him with a leaf',
  '"SHARK ATTACK" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "GET OUT OF THE WATER" yellow ribbon banner subtitle, Snoopy paddling away on a surfboard from a cartoon shark fin chasing him',
  '"TIKI ISLAND" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ALOHA ADVENTURES" yellow ribbon banner subtitle, Snoopy with a lei and ukulele in front of giant tiki statues',

  // VINTAGE PROFESSIONS
  '"FIREMAN BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "HEROES IN RED" yellow ribbon banner subtitle, Snoopy in fireman gear holding a hose, Woodstock as dalmatian sidekick',
  '"LIGHTHOUSE KEEPER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "GUARDING THE COAST" yellow ribbon banner subtitle, Snoopy in a sailor cap shining a lantern from a lighthouse in a stormy night',
  '"BEEKEEPER BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "SWEET STING" yellow ribbon banner subtitle, Snoopy in a beekeeping suit holding a honeycomb, bees buzzing around',
  '"MAILMAN MISSION" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "RAIN OR SHINE" yellow ribbon banner subtitle, Snoopy in mail carrier uniform delivering letters, Woodstock fluttering beside him',
  '"PARK RANGER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "PROTECTING NATURE" yellow ribbon banner subtitle, Snoopy in ranger gear next to a national park sign, mountains behind',
  '"RAILROAD ENGINEER" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ALL ABOARD" yellow ribbon banner subtitle, Snoopy in striped overalls and conductor cap leaning out of a steam train',
  '"MINER MISSION" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "GOLD RUSH" yellow ribbon banner subtitle, Snoopy with a pickaxe and lantern striking gold, Woodstock holding a nugget',
  '"SAILOR BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "ANCHORS AWEIGH" yellow ribbon banner subtitle, Snoopy in a navy uniform saluting on the deck of a ship',
  '"DOCTOR BEAGLE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DOCTORS ORDERS" yellow ribbon banner subtitle, Snoopy in a white coat with a stethoscope, Woodstock holding a giant pill',
  '"TEACHER TROUBLES" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "BACK TO SCHOOL" yellow ribbon banner subtitle, Snoopy at a chalkboard pointing at math problems, Woodstock as struggling student',

  // JOE COOL / RETRO LIFESTYLE
  '"JOE COOL" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "TOO COOL FOR SCHOOL" yellow ribbon banner subtitle, Snoopy in black sunglasses leaning against a brick wall, Woodstock perched on his shoulder, retro starbursts framing him',
  '"THE LEGEND OF JOE COOL" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "EST 1971" yellow ribbon banner subtitle, Snoopy with sunglasses arms crossed in a heroic stance, vintage starburst halftone background',
  '"DISCO INFERNO" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "GET DOWN" yellow ribbon banner subtitle, Snoopy in a white suit pointing to the sky on a lit-up disco floor, Woodstock spinning a mirror ball',
  '"DRIVE IN MOVIE" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "DOUBLE FEATURE" yellow ribbon banner subtitle, Snoopy in a vintage convertible at a drive-in theater, Woodstock with popcorn',
  '"DINER DAYS" arched block-letter title at top in mustard yellow with thick red outline and drop shadow, "MILKSHAKES AND MEMORIES" yellow ribbon banner subtitle, Snoopy on a stool at a 1950s diner counter, Woodstock sipping a shake',
];

// Flat rate prices in cents - only 2:3 ratio variants for perfect framing
const VERTICAL_VARIANTS = [
  { id: 91644,  w: 3600,  h: 5400,  price: 8420  }, // 12 x 18
  { id: 91647,  w: 4800,  h: 7200,  price: 10820 }, // 16 x 24
  { id: 91655,  w: 9600,  h: 14400, price: 34684 }, // 32 x 48
  { id: 112955, w: 12000, h: 18000, price: 50026 }, // 40 x 60
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
        contents: [{ parts: [{ text: "Based on this Snoopy and Woodstock retro vintage comic poster description: \"" + prompt + "\"\n\nGenerate an optimized Etsy product listing. Respond with raw JSON only, no markdown, no backticks:\n{\n  \"title\": \"Etsy optimized title under 80 chars. Format: Snoopy Woodstock [Theme/Title from comic] Canvas Print Retro Comic Poster Vintage Wall Art. Examples: Snoopy Woodstock Flying Ace Canvas Print Retro Comic Poster Vintage Wall Art. Snoopy Woodstock Joe Cool Canvas Print Retro Comic Poster Vintage Wall Art. NO dashes, NO hyphens, NO special characters, keep it clean and specific to the comic theme.\",\n  \"description\": \"3 engaging paragraphs about this specific retro vintage comic-style artwork, the canvas print quality, the 1960s pulp comic poster aesthetic with halftone shading and aged paper textures, and who would love it as a gift.\",\n  \"tags\": [\"IMPORTANT: exactly 13 tags, each tag must be under 20 characters, no special characters, focused on retro vintage comic Snoopy Peanuts theme. Examples: Snoopy wall art, retro comic art, vintage Snoopy, Peanuts poster, comic book art, Snoopy gift, Woodstock print, vintage poster, Snoopy canvas, retro Peanuts, pulp comic art, Snoopy lover, beagle wall art\"]\n}" }] }],
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
    "retro comic art",
    "vintage Snoopy",
    "Peanuts poster",
    "comic book art",
    "Snoopy gift",
    "Woodstock print",
    "vintage poster",
    "Snoopy canvas",
    "retro Peanuts",
    "pulp comic art",
    "Snoopy lover",
    "beagle wall art",
    "Peanuts decor",
    "Peanuts fan gift",
    "comic poster art",
    "vintage wall art",
    "Snoopy print",
    "retro wall art",
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
  var palette = pickPalette();
  console.log("Using palette:", palette);
  var fullPrompt = prompt + buildStyleSuffix(palette) + " Generate as a tall vertical portrait poster artwork in 2:3 aspect ratio, taller than wide, fill the entire frame edge to edge with no white borders, no margins, suitable for canvas wall art print.";
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
  // Image is generated at 2:3 ratio (3000x4500). For each variant:
  // - scale: cover-fill the print area regardless of aspect ratio
  // - y position: anchor the top edge of the image to the top edge of the print
  //   area so the title is never cropped. Bottom (clouds/decoration) gets cropped
  //   instead. Math: y = scale/2 places image-top exactly at print-area-top.
  //   For 2:3 variants (scale 1.0) this gives y=0.5 (centered, no crop).
  var IMAGE_RATIO = 3000 / 4500; // 0.667
  var print_areas = VERTICAL_VARIANTS.map(function(v) {
    var variantRatio = v.w / v.h;
    var scale = Math.max(variantRatio, IMAGE_RATIO) / Math.min(variantRatio, IMAGE_RATIO);
    var yPos = scale / 2;
    console.log("Variant " + v.id + " (" + v.w + "x" + v.h + ") -> scale " + scale.toFixed(3) + ", y " + yPos.toFixed(3));
    return {
      variant_ids: [v.id],
      placeholders: [{ position: "front", images: [{ id: imageId, x: 0.5, y: yPos, scale: scale, angle: 0, print_area_width: v.w, print_area_height: v.h }] }]
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
  var PRINTIFY_BEARER = process.env.PRINTIFY_BEARER;
  if (!PRINTIFY_BEARER) {
    console.log("No PRINTIFY_BEARER token set, skipping offsite ads");
    return;
  }
  console.log("Enabling offsite ads via bearer token...");
  try {
    var USER_ID = "19310315";
    var res = await fetch(
      "https://printify.com/api/v1/users/" + USER_ID + "/shops/" + SHOP_ID + "/products/" + productId,
      {
        method: "PUT",
        headers: {
          "Authorization": "Bearer " + PRINTIFY_BEARER,
          "Content-Type": "application/json",
          "Origin": "https://printify.com",
          "Referer": "https://printify.com/app/store/products/1"
        },
        body: JSON.stringify({ sales_channel_properties: { etsy: { offsite_adds: 0.12 } } })
      }
    );
    var text = await res.text();
    console.log("Offsite ads response (status " + res.status + "):", text.substring(0, 200));
  } catch (err) {
    console.log("Offsite ads error:", err.message);
  }
}


async function createAndPublishEbay(etsyProductId) {
  console.log("Copying product to eBay store...");
  var res = await fetch(
    "https://api.printify.com/v1/shops/" + SHOP_ID + "/products/" + etsyProductId + "/duplicate.json",
    {
      method: "POST",
      headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ shop_id: parseInt(EBAY_SHOP_ID) })
    }
  );
  var data = await res.json();
  console.log("Copy response (status " + res.status + "):", JSON.stringify(data).substring(0, 200));
  if (!data.id) { console.log("eBay copy failed"); return; }
  console.log("eBay product copied, ID:", data.id);

  // Publish to eBay
  await new Promise(function(r) { setTimeout(r, 15000); });
  console.log("Publishing to eBay...");
  var pubRes = await fetch(
    "https://api.printify.com/v1/shops/" + EBAY_SHOP_ID + "/products/" + data.id + "/publish.json",
    {
      method: "POST",
      headers: { "Authorization": "Bearer " + PRINTIFY_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true })
    }
  );
  console.log("eBay publish response (status " + pubRes.status + "):", await pubRes.text());
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
      await createAndPublishEbay(productId);
      console.log("Listing " + (i + 1) + " live on Etsy!");
      if (i < 4) await new Promise(function(r) { setTimeout(r, 10000); });
    } catch (err) {
      console.error("Listing " + (i + 1) + " failed:", err.message);
    }
  }
  console.log("\nDone! All 5 listings processed.");
}

run();
