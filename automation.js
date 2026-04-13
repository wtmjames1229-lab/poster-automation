// POD Automation Pipeline
// Gemini → Printify → Etsy
// Run with: node automation.js

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = '18634010';
const BLUEPRINT_ID = 1159;
const PRINT_PROVIDER_ID = 99; // Printify Choice

// SET YOUR IMAGE PROMPT HERE
const IMAGE_PROMPT = 'snoopy poster, flat design, minimalist, solid color background, no texture, no shadows, digital illustration style';';

// Etsy fee rates
const ETSY_TRANSACTION_FEE = 0.065;
const ETSY_PAYMENT_FEE = 0.03;
const ETSY_LISTING_FEE = 20; // cents

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
// profit_margin = (price - cost - etsy_fees) / price = 0.5
// etsy_fees = price * (transaction + payment) + listing_fee
// price - cost - price * 0.095 - 20 = 0.5 * price
// price * (1 - 0.095 - 0.5) = cost + 20
// price = (cost + 20) / 0.405
function calculatePrice(cost) {
  return Math.ceil((cost + ETSY_LISTING_FEE) / (1 - ETSY_TRANSACTION_FEE - ETSY_PAYMENT_FEE - 0.5));
}

async function generateListing() {
  console.log('Generating listing content with Gemini...');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${NB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Based on this art description: "${IMAGE_PROMPT}"

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

async function generateImage() {
  console.log('Generating image with Gemini...');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${NB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: IMAGE_PROMPT + ' Generate as a high quality vertical portrait artwork, taller than wide, suitable for canvas wall art print.' }]
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

  // Log prices for verification
  VERTICAL_VARIANTS.forEach(v => {
    const price = calculatePrice(v.cost);
    const profit = price - v.cost - Math.round(price * (ETSY_TRANSACTION_FEE + ETSY_PAYMENT_FEE)) - ETSY_LISTING_FEE;
    const margin = Math.round((profit / price) * 100);
    console.log(`Variant ${v.id}: cost=${v.cost} price=${price} margin=${margin}%`);
  });

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
  const data = await res.json();
  console.log('Shipping response:', JSON.stringify(data));
}

async function publishToEtsy(productId) {
  console.log('Publishing to Etsy...');
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
  const data = await res.json();
  console.log('Publish response:', JSON.stringify(data));
  return data;
}

async function run() {
  try {
    const listing = await generateListing();
    const base64Image = await generateImage();
    const imageId = await uploadToPrintify(base64Image);
    const productId = await createProduct(imageId, listing);
    await enableEconomyShipping(productId);
    await publishToEtsy(productId);
    console.log('Done! New listing is live on Etsy.');
  } catch (err) {
    console.error('Pipeline failed:', err.message);
  }
}

run();
