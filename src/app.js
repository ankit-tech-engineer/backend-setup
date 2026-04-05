const express = require('express');
const { configureApp } = require('./config/app.config');
const routes = require('./routes/index');
const errorHandler = require('./core/error/errorHandler');
const AppError = require('./core/error/AppError');
const httpStatus = require('./constants/httpStatus');

const app = express();

configureApp(app);

app.use('/api/v1', routes);

app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, httpStatus.NOT_FOUND));
});

app.use(errorHandler);

module.exports = app;
