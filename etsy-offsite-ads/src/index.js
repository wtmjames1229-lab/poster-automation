'use strict';

const { loadEnv } = require('./config');
loadEnv();

module.exports = {
  ...require('./offsiteAds'),
  printifyShop: require('./printifyShop'),
  runAdsSync: require('./adsSyncEngine').runAdsSync,
  jobStore: require('./adsJobStore'),
};
