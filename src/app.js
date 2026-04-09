const express = require('express');
const { configureApp } = require('./config/app.config');
const routes = require('./routes/index');
const errorHandler = require('./core/error/errorHandler');
const AppError = require('./core/error/AppError');
const httpStatus = require('./constants/httpStatus');

const app = express();

// Trust proxy for Render/Load Balancers to get real client IP
app.set('trust proxy', 1);

configureApp(app);

app.use('/api/v1', routes);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the SaaS API. The server is healthy and running.',
    timestamp: new Date().toISOString()
  });
});

app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, httpStatus.NOT_FOUND));
});

app.use(errorHandler);

module.exports = app;
