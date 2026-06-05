function requireEnv(name) {
    var val = process.env[name];
  if (!val) {
    throw new Error('Missing required environment variable: ' + name);
  }
  return val;
}

var config = {
  get printifyApiKey() { return requireEnv('PRINTIFY_API_KEY'); },
  get shopId() { return process.env.PRINTIFY_SHOP_ID || '18634010'; },
  get nbApiKey() { return requireEnv('NB_API_KEY'); },
  get email() { return requireEnv('PRINTIFY_EMAIL'); },
  get password() { return requireEnv('PRINTIFY_PASSWORD'); },
};

function validateForPlaywright() {
    requireEnv('PRINTIFY_EMAIL');
  requireEnv('PRINTIFY_PASSWORD');
}

function validateForPipeline() {
    requireEnv('NB_API_KEY');
  requireEnv('PRINTIFY_API_KEY');
  validateForPlaywright();
}

module.exports = {
  config,
      validateForPlaywright,
      validateForPipeline
    };
