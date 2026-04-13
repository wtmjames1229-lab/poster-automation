// POD Automation Pipeline
// Gemini (Nano Banana 2) → Printify → Etsy
// Run with: node automation.js

const NB_API_KEY = process.env.NB_API_KEY;
const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = 'YOUR_SHOP_ID';
const BLUEPRINT_ID = 388;
const PRINT_PROVIDER_ID = 1;
const LISTING_TITLE = 'YOUR LISTING TITLE | Wall Art Poster';

// Describe your character and art style here
const IMAGE_PROMPT = 'YOUR IMAGE PROMPT HERE';

async function generateImage() {
  console.log('Generating image with Gemini...');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${NB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: IMAGE_PROMPT + ' Generate as a high quality poster image.' }]
        }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
      })
    }
  );
  const data = await res.json();
  const imagePart = data?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!imagePart) throw new Error('Image generation failed: ' + JSON.stringify(data));
  console.log('Image generated successfully');
  return imagePart.inlineData.data; // base64 image data
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
      file_name: 'poster_' + Date.now() + '.png',
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
  const res = await fetch(`https://api.printify.com/v1/shops/${SHOP_ID}/products.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: LISTING_TITLE,
      blueprint_id: BLUEPRINT_ID,
      print_provider_id: PRINT_PROVIDER_ID,
      variants: [{ id: 1, is_enabled: true }],
      print_areas: [{
        variant_ids: [1],
        placeholders: [{
          position: 'front',
          images: [{ id: imageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }]
        }]
      }]
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
