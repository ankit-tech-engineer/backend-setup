const ModuleResourceMapping = require('./module-resource-mapping.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const { parseQueryOptions, paginatedResponse } = require('../../../utils/pagination');

const create = async (body) => {
  const key = body.key || body.module_name.toLowerCase().trim().replace(/\s+/g, '_');
  const existing = await ModuleResourceMapping.findOne({ key });

  if (existing) {
    if (existing.isDeleted) {
      return await ModuleResourceMapping.findOneAndUpdate(
        { key },
        { ...body, isDeleted: false },
        { new: true, runValidators: true }
      );
    }
    throw new AppError('Module mapping key already exists', httpStatus.CONFLICT);
  }

  return await ModuleResourceMapping.create({ ...body, key });
};

const getAll = async (query) => {
  const options = parseQueryOptions(query);
  const filter = { isDeleted: false, ...options.filter };

  const dbQuery = ModuleResourceMapping.find(filter)
    .populate({
      path: 'resources',
      model: 'Resource',
      foreignField: 'id',
      select: 'id name key -_id'
    })
    .sort(options.sort)
    .skip(options.skip)
    .select(options.selectStr);

  if (!options.noLimit) dbQuery.limit(options.limit);

  const [docs, total] = await Promise.all([
    options.select.length > 0
      ? dbQuery.lean().then((list) => list.map(({ __v, ...rest }) => rest))
      : dbQuery,
    ModuleResourceMapping.countDocuments(filter),
  ]);

  return paginatedResponse(docs, total, { ...options, filter });
};

const getById = async (id) => {
  const filter = { id, isDeleted: false };

  const doc = await ModuleResourceMapping.findOne(filter)
    .populate({
      path: 'resources',
      model: 'Resource',
      foreignField: 'id',
      select: 'id name key -_id'
    })
    .select('-__v');
  if (!doc) throw new AppError('Module mapping not found', httpStatus.NOT_FOUND);
  return doc;
};

const update = async (id, body) => {
  const filter = { id, isDeleted: false };

  const doc = await ModuleResourceMapping.findOneAndUpdate(filter, body, { new: true, runValidators: true })
    .populate({
      path: 'resources',
      model: 'Resource',
      foreignField: 'id',
      select: 'id name key -_id'
    })
    .select('-__v');

  if (!doc) throw new AppError('Module mapping not found', httpStatus.NOT_FOUND);
  return doc;
};

const remove = async (id) => {
  const filter = { id };

  const doc = await ModuleResourceMapping.findOneAndUpdate(filter, { isDeleted: true }, { new: true });
  if (!doc) throw new AppError('Module mapping not found', httpStatus.NOT_FOUND);
};

module.exports = { create, getAll, getById, update, remove };
