const PRINTIFY_API_KEY = process.env.PRINTIFY_API_KEY;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID || '18634010';

async function fetchAllShopProducts() {
  console.log('Fetching all shop products from Printify...');
    var allProducts = [];
      var page = 1;
        var limit = 100;
          while (true) {
              var res = await fetch(
                    'https://api.printify.com/v1/shops/' + SHOP_ID + '/products.json?limit=' + limit + '&page=' + page,
                          { headers: { 'Authorization': 'Bearer ' + PRINTIFY_API_KEY } }
                              );
                                  var data = await res.json();
                                      var products = data.data || [];
                                          allProducts = allProducts.concat(products);
                                              if (products.length < limit) break;
                                                  page++;
                                                    }
                                                      console.log('Total products fetched:', allProducts.length);
                                                        return allProducts;
                                                        }

                                                        async function getProduct(productId) {
                                                          var res = await fetch(
                                                              'https://api.printify.com/v1/shops/' + SHOP_ID + '/products/' + productId + '.json',
                                                                  { headers: { 'Authorization': 'Bearer ' + PRINTIFY_API_KEY } }
                                                                    );
                                                                      return await res.json();
                                                                      }

                                                                      function isPublishedToEtsy(product) {
                                                                        if (!product) return false;
                                                                          if (product.publishing_status === 'succeeded') return true;
                                                                            if (product.external && product.external.id) return true;
                                                                              return false;
                                                                              }

                                                                              function isCanvasProduct(product) {
                                                                                if (!product) return false;
                                                                                  return product.blueprint_id === 1297;
                                                                                  }

                                                                                  module.exports = {
                                                                                    fetchAllShopProducts,
                                                                                      getProduct,
                                                                                        isPublishedToEtsy,
                                                                                          isCanvasProduct
                                                                                          };
