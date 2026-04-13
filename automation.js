// POD Automation Pipeline
// Gemini → Printify → Etsy
// Run with: node automation.js

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = '18634010';
const BLUEPRINT_ID = 1159;
const PRINT_PROVIDER_ID = 99; // Printify Choice

// Etsy fee rates
const ETSY_TRANSACTION_FEE = 0.065;
const ETSY_PAYMENT_FEE = 0.03;
const ETSY_LISTING_FEE = 20; // cents

// 100 generalized style/mood prompts — UPDATED TO SNOOPY
const PROMPTS = [
  `snoopy in a spring setting, pastel colors, soft lighting`,
  `snoopy in a summer scene, bright warm tones, cheerful mood`,
  `snoopy in an autumn atmosphere, golden orange and red tones`,
  `snoopy in a winter scene, cool blues and whites, cozy feeling`,
  `snoopy at nighttime, deep blues and purples, starry sky`,
  `snoopy at sunrise, soft pinks and oranges, peaceful mood`,
  `snoopy at sunset, warm golden hues, silhouette style`,
  `snoopy in a cozy indoor setting, warm lighting, homey feel`,
  `snoopy outdoors in nature, lush greens, fresh and vibrant`,
  `snoopy in a whimsical fantasy setting, magical colors`,
  `snoopy in a retro vintage style, muted warm tones, nostalgic`,
  `snoopy in a minimalist setting, clean lines, simple background`,
  `snoopy in a watercolor style, soft blended colors, dreamy`,
  `snoopy in a bold graphic style, high contrast, vivid colors`,
  `snoopy in a soft pastel palette, gentle and calming mood`,
  `snoopy in a vibrant pop art style, bright saturated colors`,
  `snoopy in an earthy natural palette, greens and browns`,
  `snoopy in a celestial setting, stars and cosmic elements`,
  `snoopy in a tropical setting, lush vibrant greens and blues`,
  `snoopy in a serene peaceful mood, soft muted tones`,
  `snoopy in a playful fun style, bright primary colors`,
  `snoopy in a sophisticated elegant style, rich deep tones`,
  `snoopy in a rustic countryside setting, warm and natural`,
  `snoopy in an urban city atmosphere, modern and stylish`,
  `snoopy in a beachy coastal setting, blues and sandy tones`,
  `snoopy in a forest woodland setting, deep greens and earth tones`,
  `snoopy in a mountain landscape setting, cool crisp tones`,
  `snoopy in a garden setting, floral elements, soft colors`,
  `snoopy in a rainy mood, blues and grays, reflective`,
  `snoopy in a sunny cheerful mood, yellows and warm whites`,
  `snoopy in a dreamy cloudscape, soft whites and light blues`,
  `snoopy in a moody atmospheric style, dramatic lighting`,
  `snoopy in a cute kawaii style, soft pinks and pastels`,
  `snoopy in a bold modern art style, geometric shapes`,
  `snoopy in a storybook illustration style, warm and inviting`,
  `snoopy in a vintage botanical style, muted greens and creams`,
  `snoopy in a neon glow style, electric colors on dark background`,
  `snoopy in a soft romantic style, pinks and purples, delicate`,
  `snoopy in a nautical maritime setting, navy blues and whites`,
  `snoopy in an art deco style, gold and black elegant tones`,
  `snoopy in a Scandinavian minimalist style, clean and simple`,
  `snoopy in a boho bohemian style, earthy warm tones`,
  `snoopy in a festive holiday mood, reds and greens and gold`,
  `snoopy in a spooky Halloween mood, oranges and purples`,
  `snoopy in a spring floral setting, blooms and soft light`,
  `snoopy in a tranquil zen mood, balanced and serene`,
  `snoopy in a whimsical clouds and sky setting, soft blues`,
  `snoopy in a cozy café atmosphere, warm browns and creams`,
  `snoopy in a moonlit night scene, silvers and deep blues`,
  `snoopy in a rainbow bright palette, all colors, joyful`,
  `snoopy in a soft watercolor wash background, artistic`,
  `snoopy in a linen texture style, neutral warm tones`,
  `snoopy in a classic storybook style, timeless and charming`,
  `snoopy in a modern illustration style, flat and clean`,
  `snoopy in a painterly impressionist style, textured strokes`,
  `snoopy in a comic book style, bold outlines and flat colors`,
  `snoopy in a pencil sketch style, soft and detailed`,
  `snoopy in a gouache painting style, rich opaque colors`,
  `snoopy in a linocut print style, bold and graphic`,
  `snoopy in a tapestry textile pattern style, decorative`,
  `snoopy in a folk art style, bright naive colors and patterns`,
  `snoopy in a Japanese woodblock print style, elegant lines`,
  `snoopy in a stained glass style, rich jewel tones`,
  `snoopy in a mosaic tile style, colorful and geometric`,
  `snoopy in a silhouette style, bold black against vivid background`,
  `snoopy in a shadow puppet style, dark and playful`,
  `snoopy in a gradient color wash background, smooth transitions`,
  `snoopy in a duotone color scheme, two contrasting tones`,
  `snoopy in a monochrome blue palette, various shades of blue`,
  `snoopy in a monochrome pink palette, various shades of pink`,
  `snoopy in a monochrome green palette, various shades of green`,
  `snoopy in a warm terracotta and rust palette`,
  `snoopy in a cool lavender and sage palette`,
  `snoopy in a black and white high contrast style`,
  `snoopy in a sepia toned vintage photograph style`,
  `snoopy in a gold and cream luxurious palette`,
  `snoopy in a deep jewel toned palette, emerald and sapphire`,
  `snoopy in a soft mint and coral color palette`,
  `snoopy in a mustard yellow and navy blue palette`,
  `snoopy in a blush pink and rose gold palette`,
  `snoopy in a deep burgundy and forest green palette`,
  `snoopy in a sky blue and sunshine yellow palette`,
  `snoopy in a charcoal and warm cream palette`,
  `snoopy in a peach and cream soft dreamy palette`,
  `snoopy in a bright citrus orange and lime green palette`,
  `snoopy in an icy cool silver and white palette`,
  `snoopy in a rich chocolate brown and caramel palette`,
  `snoopy in a dusty mauve and slate blue palette`,
  `snoopy in a bright turquoise and coral tropical palette`,
  `snoopy in a deep indigo and gold celestial palette`,
  `snoopy in a soft sage green and cream palette`,
  `snoopy in a vibrant primary red blue and yellow palette`,
  `snoopy in a sunset ombre palette, pink to orange to purple`,
  `snoopy in a aurora borealis inspired palette, green and purple`,
  `snoopy in a desert sunset palette, warm sandy and pink tones`,
  `snoopy in a ocean inspired palette, deep teal and seafoam`,
  `snoopy in a wildflower meadow palette, mixed natural colors`,
  `snoopy in a candy pastel palette, soft sweet colors`,
  `snoopy in a midnight galaxy palette, deep space tones`,
];

// Vertical canvas variants with production costs (in cents)
const VERTICAL_VARIANTS = [
  { id: 101413, w: 2400,  h: 3000,  cost: 1288  }, // 8x10
  { id: 91641,  w: 3300,  h: 4200,  cost: 1610  }, // 11x14
  { id: 91644,  w: 3600,  h: 5400,  cost: 2208  }, // 12x18
  { id: 91647,  w: 4800,  h: 7200,  cost: 2857  }, // 16x24
  { id: 91649,  w: 6000,  h: 7200,  cost: 3538  }, // 20x24
  { id: 101411, w: 7200,  h: 9000,  cost: 4599  }, // 24x30
  { id: 91654,  w: 9000,  h: 12000, cost: 6361  }, // 30x40
  { id: 91655,  w: 9600,  h: 14400, cost: 9314  }, // 32x48
  { id: 112955, w: 12000, h: 18000, cost: 12721 }, // 40x60
];
 
// Calculate price for exactly 50% profit margin after all Etsy fees
function calculatePrice(cost) {
  return Math.ceil((cost + ETSY_LISTING_FEE) / (1 - ETSY_TRANSACTION_FEE - ETSY_PAYMENT_FEE - 0.5));
}
 
// Pick 5 unique random prompts for this run
function pickPrompts() {
  const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}
 
async function generateListing(prompt) {
  console.log('Generating listing content with Gemini...');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${NB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Based on this art description: "${prompt}"
 
Generate an Etsy product listing. Respond with raw JSON only, no markdown, no backticks:
{
  "title": "catchy Etsy title under 140 chars with wall art canvas keywords",
  "description": "3 paragraph Etsy product description, engaging and SEO friendly, mention canvas print, wall art, home decor, available in multiple sizes",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13"]
}` }]
        }],
        generationConfig: { responseModalities: ['TEXT'] }
      })
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Listing generation failed: ' + JSON.stringify(data));
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const listing = JSON.parse(clean);
    console.log('Listing generated:', listing.title);
    return listing;
  } catch (e) {
    throw new Error('Failed to parse listing JSON: ' + text);
  }
}
 
async function generateImage(prompt) {
  console.log('Generating image with Gemini...');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${NB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt + ` Generate as a high quality vertical portrait artwork, taller than wide, suitable for canvas wall art print, flat design, minimalist style.` }]
        }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
      })
    }
  );
  const data = await res.json();
  const imagePart = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!imagePart) throw new Error('Image generation failed: ' + JSON.stringify(data));
  console.log('Image generated successfully');
  return imagePart.inlineData.data;
}
 
async function uploadToPrintify(base64Data) {
  console.log('Uploading image to Printify...');
  const res = await fetch('https://api.printify.com/v1/uploads/images.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file_name: 'canvas_' + Date.now() + '.png',
      contents: base64Data
    })
  });
  const data = await res.json();
  if (!data.id) throw new Error('Upload failed: ' + JSON.stringify(data));
  console.log('Uploaded, image ID:', data.id);
  return data.id;
}
 
async function createProduct(imageId, listing) {
  console.log('Creating Printify product...');
 
  const variants = VERTICAL_VARIANTS.map(v => ({
    id: v.id,
    is_enabled: true,
    price: calculatePrice(v.cost)
  }));
 
  const print_areas = VERTICAL_VARIANTS.map(v => ({
    variant_ids: [v.id],
    placeholders: [{
      position: 'front',
      images: [{
        id: imageId,
        x: 0.5,
        y: 0.5,
        scale: 1,
        angle: 0,
        print_area_width: v.w,
        print_area_height: v.h
      }]
    }]
  }));
 
  const res = await fetch(`https://api.printify.com/v1/shops/${SHOP_ID}/products.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: listing.title,
      description: listing.description,
      tags: listing.tags,
      blueprint_id: BLUEPRINT_ID,
      print_provider_id: PRINT_PROVIDER_ID,
      variants,
      print_areas
    })
  });
  const data = await res.json();
  if (!data.id) throw new Error('Product creation failed: ' + JSON.stringify(data));
  console.log('Product created, ID:', data.id);
  return data.id;
}
 
async function enableEconomyShipping(productId) {
  console.log('Waiting for product to be ready...');
  await new Promise(r => setTimeout(r, 5000));
  console.log('Enabling economy shipping...');
  const res = await fetch(
    `https://api.printify.com/v2/shops/${SHOP_ID}/products/${productId}/shipping.json`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shipping_handling: {
          economy: { enabled: true },
          standard: { enabled: true }
        }
      })
    }
  );
  const text = await res.text();
  console.log('Shipping response:', text);
}
 
async function publishToEtsy(productId) {
  console.log('Publishing to Etsy...');
  await new Promise(r => setTimeout(r, 3000));
  const res = await fetch(
    `https://api.printify.com/v1/shops/${SHOP_ID}/products/${productId}/publish.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: true,
        description: true,
        images: true,
        variants: true,
        tags: true,
        keyFeatures: true,
        shipping_template: true,
        offsite_ads: true
      })
    }
  );
  const text = await res.text();
  console.log('Publish response:', text);
  return text;
}
 
async function run() {
  const prompts = pickPrompts();
  console.log('Selected 5 unique prompts for this run');
 
  for (let i = 0; i < 5; i++) {
    const prompt = prompts[i];
    console.log(`\n--- Listing ${i + 1} of 5 ---`);
    console.log('Prompt:', prompt);
    try {
      const listing = await generateListing(prompt);
      const base64Image = await generateImage(prompt);
      const imageId = await uploadToPrintify(base64Image);
      const productId = await createProduct(imageId, listing);
      await enableEconomyShipping(productId);
      await publishToEtsy(productId);
      console.log(`Listing ${i + 1} live on Etsy!`);
      if (i < 4) await new Promise(r => setTimeout(r, 10000));
    } catch (err) {
      console.error(`Listing ${i + 1} failed:`, err.message);
    }
  }
  console.log('\nDone! All 5 listings processed.');
}
 
run();
 
