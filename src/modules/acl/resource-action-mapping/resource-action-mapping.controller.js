const mappingService = require('./resource-action-mapping.service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../core/response/responseHandler');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const messages = require('../../../constants/messages');

const parseId = (id) => {
  const parsed = parseInt(id);
  if (isNaN(parsed)) throw new AppError('Invalid id', httpStatus.BAD_REQUEST);
  return parsed;
};

const create = asyncHandler(async (req, res) => {
  const data = await mappingService.create(req.body);
  sendSuccess(res, { statusCode: httpStatus.CREATED, message: messages.CREATED, data });
});

const getAll = asyncHandler(async (req, res) => {
  const { meta, data } = await mappingService.getAll(req.query);
  sendSuccess(res, { message: messages.SUCCESS, meta, data });
});

const getById = asyncHandler(async (req, res) => {
  const data = await mappingService.getById(parseId(req.params.id));
  sendSuccess(res, { message: messages.SUCCESS, data });
});

const update = asyncHandler(async (req, res) => {
  const data = await mappingService.update(parseId(req.params.id), req.body);
  sendSuccess(res, { message: messages.SUCCESS, data });
});

const remove = asyncHandler(async (req, res) => {
  await mappingService.remove(parseId(req.params.id));
  sendSuccess(res, { statusCode: httpStatus.NO_CONTENT, message: messages.DELETED });
});

module.exports = { create, getAll, getById, update, remove };
