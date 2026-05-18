#!/usr/bin/env node
'use strict';

/** Print first Etsy-published product id (for session verify on CI). */

const { loadEnv } = require('../src/config');
loadEnv();

const {
  fetchAllShopProducts,
  filterEtsyPublished,
} = require('../src/printifyShop');

async function main() {
  const products = await fetchAllShopProducts();
  const etsy = filterEtsyPublished(products);
  const pick = etsy[0] || products[0];
  if (!pick?.id) {
    console.error('No products in shop');
    process.exit(1);
  }
  process.stdout.write(String(pick.id));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
