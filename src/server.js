const { app, logger } = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server listening for traffic');
});

const gracefulShutdown = (signal) => {
  logger.info({ signal }, 'Termination signal received. Closing HTTP server');

  server.close(() => {
    logger.info('HTTP server closed. Exiting process');
    process.exit(0);
  });

  // Force shutdown after timeout if connections stall
  setTimeout(() => {
    logger.error('Forced shutdown timeout reached (10s). Terminating process');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
