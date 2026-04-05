const app = require('./src/app');
const { connectDB } = require('./src/config/db.config');
const { env } = require('./src/config/env.config');
const { seedSuperAdmin } = require('./src/seeders/admin.seeder');
const logger = require('./src/utils/logger');
const { startEmailWorker } = require('./src/queues/email.queue');

const startServer = async () => {
  await connectDB();
  await seedSuperAdmin();
  startEmailWorker();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
