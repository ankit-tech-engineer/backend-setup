const mappingService = require('./module-resource-mapping.service');
const asyncHandler = require('../../../utils/asyncHandler');
const httpStatus = require('../../../constants/httpStatus');

const create = asyncHandler(async (req, res) => {
  const doc = await mappingService.create(req.body);
  res.status(httpStatus.CREATED).json({ success: true, data: doc });
});

const getAll = asyncHandler(async (req, res) => {
  const result = await mappingService.getAll(req.query);
  res.status(httpStatus.OK).json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const doc = await mappingService.getById(req.params.id);
  res.status(httpStatus.OK).json({ success: true, data: doc });
});

const update = asyncHandler(async (req, res) => {
  const doc = await mappingService.update(req.params.id, req.body);
  res.status(httpStatus.OK).json({ success: true, data: doc });
});

const remove = asyncHandler(async (req, res) => {
  await mappingService.remove(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = { create, getAll, getById, update, remove };
