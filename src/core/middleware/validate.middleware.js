const AppError = require('../error/AppError');
const httpStatus = require('../../constants/httpStatus');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(', ');
    return next(new AppError(message, httpStatus.BAD_REQUEST));
  }
  req.body = result.data;
  next();
};

module.exports = validate;
