#!/usr/bin/env node
'use strict';

require('dotenv').config();
const { validateForApi, config } = require('../config');
const { fetchAllShopProducts, filterEtsyPublished, isCanvasProduct } = require('../printifyShop');

async function main() {
  console.log('\n── Printify POD — setup check ──\n');
  validateForApi();

  const checks = [
    ['PRINTIFY_API_KEY', Boolean(process.env.PRINTIFY_API_KEY)],
    ['PRINTIFY_SHOP_ID', Boolean(process.env.PRINTIFY_SHOP_ID)],
    ['PRINTIFY_EMAIL', Boolean(process.env.PRINTIFY_EMAIL)],
    ['PRINTIFY_PASSWORD', Boolean(process.env.PRINTIFY_PASSWORD)],
    ['NB_API_KEY (for npm start)', config.gemini.hasKey()],
  ];
  checks.forEach(([name, ok]) => console.log(`  ${ok ? '✓' : '○'} ${name}`));

  const shopsRes = await fetch('https://api.printify.com/v1/shops.json', {
    headers: { Authorization: `Bearer ${process.env.PRINTIFY_API_KEY}` },
  });
  const shops = await shopsRes.json();
  if (!shopsRes.ok) throw new Error(JSON.stringify(shops));

  console.log('\n  Connected shops:');
  shops.forEach((s) => {
    const active = String(s.id) === String(config.printify.shopId) ? ' ← active' : '';
    console.log(`    • ${s.id}  ${s.title}  (${s.sales_channel})${active}`);
  });

  const products = await fetchAllShopProducts();
  const etsy = filterEtsyPublished(products);
  const canvasEtsy = etsy.filter(isCanvasProduct);

  console.log(`\n  Products in shop ${config.printify.shopId}: ${products.length}`);
  console.log(`  Published to Etsy: ${etsy.length}`);
  console.log(`  Canvas on Etsy: ${canvasEtsy.length}`);
  console.log('\n  Ready commands:');
  console.log('    npm run ads:status');
  console.log('    npm run ads:off');
  console.log('    npm start  (needs NB_API_KEY)\n');
}

main().catch((err) => {
  console.error('\n  ✗', err.message);
  process.exit(1);
});
