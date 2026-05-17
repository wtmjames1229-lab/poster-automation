'use strict';

/**
 * Shared Printify shop helpers (API fetch + Etsy publish detection).
 */

const SHOP_ID = process.env.PRINTIFY_SHOP_ID || '18634010';
const BLUEPRINT_ID = parseInt(process.env.CANVAS_BLUEPRINT_ID || '1297', 10);

function isPublishedToEtsy(product) {
  if (!product) return false;
  const ext = product.external;
  if (Array.isArray(ext) && ext.length > 0 && ext[0] && ext[0].id) return true;
  if (ext && typeof ext === 'object' && !Array.isArray(ext) && ext.id) return true;
  return false;
}

function isCanvasProduct(product) {
  return product && Number(product.blueprint_id) === BLUEPRINT_ID;
}

async function fetchAllShopProducts(apiKey, shopId) {
  const key = apiKey || process.env.PRINTIFY_API_KEY;
  const id = shopId || SHOP_ID;
  if (!key) throw new Error('PRINTIFY_API_KEY is not set');

  const PAGE_SIZE = 50; // Printify API max per page
  const products = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://api.printify.com/v1/shops/${id}/products.json?limit=${PAGE_SIZE}&page=${page}`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to fetch products (page ${page}): ${res.status} ${body}`);
    }
    const data = await res.json();
    const batch = data.data || [];
    products.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    page++;
  }
  return products;
}

function filterEtsyPublished(products, options) {
  options = options || {};
  let list = products.filter(isPublishedToEtsy);
  if (options.canvasOnly) list = list.filter(isCanvasProduct);
  return list;
}

async function getProduct(productId, apiKey, shopId) {
  const key = apiKey || process.env.PRINTIFY_API_KEY;
  const id = shopId || SHOP_ID;
  const res = await fetch(
    `https://api.printify.com/v1/shops/${id}/products/${productId}.json`,
    { headers: { Authorization: `Bearer ${key}` } }
  );
  if (!res.ok) throw new Error(`Failed to fetch product ${productId}: ${res.status}`);
  return res.json();
}

module.exports = {
  SHOP_ID,
  BLUEPRINT_ID,
  isPublishedToEtsy,
  isCanvasProduct,
  fetchAllShopProducts,
  filterEtsyPublished,
  getProduct,
};
