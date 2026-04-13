// POD Automation Pipeline
// Gemini → Printify → Etsy
// Run with: node automation.js

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = '18634010';
const BLUEPRINT_ID = 1159;
const PRINT_PROVIDER_ID = 99; // Printify Choice

// SET YOUR IMAGE PROMPT HERE
const IMAGE_PROMPT = 'snoopy wallpaper';

// Vertical canvas variants with exact 50% margin prices (in cents)
const VERTICAL_VARIANTS = [
  { id: 101413, w: 2400,  h: 3000,  price: 2576  }, // 8x10
  { id: 91641,  w: 3300,  h: 4200,  price: 3220  }, // 11x14
  { id: 91644,  w: 3600,  h: 5400,  price: 4416  }, // 12x18
  { id: 91647,  w: 4800,  h: 7200,  price: 5714  }, // 16x24
  { id: 91649,  w: 6000,  h: 7200,  price: 7076  }, // 20x24
  { id: 101411, w: 7200,  h: 9000,  price: 9198  }, // 24x30
  { id: 91654,  w: 9000,  h: 12000, price: 12722 }, // 30x40
  { id: 91655,  w: 9600,  h: 14400, price: 18628 }, // 32x48
  { id: 112955, w: 12000, h: 18000, price: 25442 }, // 40x60
];

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

async function createProduct(imageId) {
  console.log('Creating Printify product...');

  const variants = VERTICAL_VARIANTS.map(v => ({
    id: v.id,
    is_enabled: true,
    price: v.price
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
      title: 'Matte Canvas Wall Art',
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
  console.log('Shipping updated:', JSON.stringify(data));
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
  console.log('Published to Etsy!', data);
  return data;
}

async function run() {
  try {
    const base64Image = await generateImage();
    const imageId = await uploadToPrintify(base64Image);
    const productId = await createProduct(imageId);
    await enableEconomyShipping(productId);
    await publishToEtsy(productId);
    console.log('Done! New listing is live on Etsy.');
  } catch (err) {
    console.error('Pipeline failed:', err.message);
  }
}

run();
