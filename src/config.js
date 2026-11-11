const config = {
  port: parseInt(process.env.APP_PORT || '8080', 10),
  logLevel: process.env.APP_LOG_LEVEL || 'info',
  env: process.env.NODE_ENV || 'production',
  version: process.env.APP_VERSION || require('../package.json').version
};

module.exports = config;
