const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const { env } = require('./env.config');
const rateLimiter = require('../core/middleware/rateLimiter.middleware');

const configureApp = (app) => {
  app.use(helmet());
  app.use(cors());
  app.use(mongoSanitize());
  app.use(compression());
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  app.use('/api', rateLimiter);
};

module.exports = { configureApp };
