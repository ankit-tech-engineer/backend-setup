const mongoose = require('mongoose');
const { env } = require('./env.config');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async (retries = MAX_RETRIES) => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('MongoDB connected successfully');
  } catch (err) {
    if (retries === 0) {
      logger.error('MongoDB connection failed after max retries');
      process.exit(1);
    }
    logger.warn(`MongoDB connection failed. Retrying in ${RETRY_DELAY_MS / 1000}s... (${retries} retries left)`);
    await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
    return connectDB(retries - 1);
  }
};

mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('error', (err) => logger.error(`MongoDB error: ${err.message}`));

module.exports = { connectDB };
