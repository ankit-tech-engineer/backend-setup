const { env } = require('../../config/env.config');
const logger = require('../../utils/logger');
const httpStatus = require('../../constants/httpStatus');

const handleCastError = (err) => ({
  statusCode: httpStatus.BAD_REQUEST,
  message: `Invalid ${err.path}: ${err.value}`,
});

const handleDuplicateKey = (err) => ({
  statusCode: httpStatus.CONFLICT,
  message: `Duplicate value for field: ${Object.keys(err.keyValue).join(', ')}`,
});

const handleValidationError = (err) => ({
  statusCode: httpStatus.UNPROCESSABLE,
  message: Object.values(err.errors).map((e) => e.message).join(', '),
});

const handleJWTError = () => ({
  statusCode: httpStatus.UNAUTHORIZED,
  message: 'Invalid token. Please log in again.',
});

const handleJWTExpired = () => ({
  statusCode: httpStatus.UNAUTHORIZED,
  message: 'Token expired. Please log in again.',
});

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') ({ statusCode, message } = handleCastError(err));
  if (err.code === 11000) ({ statusCode, message } = handleDuplicateKey(err));
  if (err.name === 'ValidationError') ({ statusCode, message } = handleValidationError(err));
  if (err.name === 'JsonWebTokenError') ({ statusCode, message } = handleJWTError());
  if (err.name === 'TokenExpiredError') ({ statusCode, message } = handleJWTExpired());

  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`);

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
