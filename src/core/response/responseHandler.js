const httpStatus = require('../../constants/httpStatus');

const sendSuccess = (res, { statusCode = httpStatus.OK, message = 'Success', data = null, meta = null } = {}) => {
  const response = { success: true, code: statusCode, message };
  if (meta !== null) response.meta = meta;
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

const sendError = (res, { statusCode = httpStatus.INTERNAL_SERVER, message = 'Error' } = {}) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { sendSuccess, sendError };
