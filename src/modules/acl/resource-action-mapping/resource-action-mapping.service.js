const ResourceActionMapping = require('./resource-action-mapping.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const { parseQueryOptions, paginatedResponse } = require('../../../utils/pagination');

const create = async (body) => {
  const existing = await ResourceActionMapping.findOne({ resourceId: body.resourceId });
  if (existing) {
    if (existing.isDeleted) {
      return await ResourceActionMapping.findOneAndUpdate(
        { resourceId: body.resourceId },
        { ...body, isDeleted: false },
        { new: true, runValidators: true }
      );
    }
    throw new AppError('Mapping for this resource already exists', httpStatus.CONFLICT);
  }
  return await ResourceActionMapping.create(body);
};

const getAll = async (query) => {
  const options = parseQueryOptions(query);
  const filter = { isDeleted: false, ...options.filter };

  const dbQuery = ResourceActionMapping.find(filter)
    .populate({ path: 'resourceId', model: 'Resource', foreignField: 'id', select: 'id name key -_id' })
    .populate({ path: 'actions', model: 'Action', foreignField: 'id', select: 'id name key -_id' })
    .sort(options.sort)
    .skip(options.skip)
    .select(options.selectStr);

  if (!options.noLimit) dbQuery.limit(options.limit);

  const [docs, total] = await Promise.all([
    options.select.length > 0
      ? dbQuery.lean().then((list) => list.map(({ __v, ...rest }) => rest))
      : dbQuery,
    ResourceActionMapping.countDocuments(filter),
  ]);

  return paginatedResponse(docs, total, { ...options, filter });
};

const getById = async (id) => {
  const filter = { id, isDeleted: false };
  const doc = await ResourceActionMapping.findOne(filter)
    .populate({ path: 'resourceId', model: 'Resource', foreignField: 'id', select: 'id name key -_id' })
    .populate({ path: 'actions', model: 'Action', foreignField: 'id', select: 'id name key -_id' })
    .select('-__v');
  if (!doc) throw new AppError('Mapping not found', httpStatus.NOT_FOUND);
  return doc;
};

const update = async (id, body) => {
  const filter = { id, isDeleted: false };
  const doc = await ResourceActionMapping.findOneAndUpdate(filter, body, { new: true, runValidators: true })
    .populate({ path: 'resourceId', model: 'Resource', foreignField: 'id', select: 'id name key -_id' })
    .populate({ path: 'actions', model: 'Action', foreignField: 'id', select: 'id name key -_id' })
    .select('-__v');
  if (!doc) throw new AppError('Mapping not found', httpStatus.NOT_FOUND);
  return doc;
};

const remove = async (id) => {
  const filter = { id };
  const doc = await ResourceActionMapping.findOneAndUpdate(filter, { isDeleted: true }, { new: true });
  if (!doc) throw new AppError('Mapping not found', httpStatus.NOT_FOUND);
};

module.exports = { create, getAll, getById, update, remove };
