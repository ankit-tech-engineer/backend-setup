const Resource = require('./resources.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const { parseQueryOptions, paginatedResponse } = require('../../../utils/pagination');

const create = async (body) => {
  const key = body.key || body.name.toLowerCase().trim().replace(/\s+/g, '_');
  const existing = await Resource.findOne({ key });
  if (existing) {
    if (existing.isDeleted) {
      return await Resource.findOneAndUpdate(
        { key },
        { ...body, isDeleted: false },
        { new: true, runValidators: true }
      );
    }
    throw new AppError('Resource key already exists', httpStatus.CONFLICT);
  }
  return await Resource.create({ ...body, key });
};

const getAll = async (query) => {
  const options = parseQueryOptions(query);
  const filter = { isDeleted: false, ...options.filter };

  const dbQuery = Resource.find(filter).sort(options.sort).skip(options.skip).select(options.selectStr);
  if (!options.noLimit) dbQuery.limit(options.limit);

  const [docs, total] = await Promise.all([
    options.select.length > 0
      ? dbQuery.lean().then((list) => list.map(({ __v, ...rest }) => rest))
      : dbQuery,
    Resource.countDocuments(filter),
  ]);

  return paginatedResponse(docs, total, { ...options, filter });
};

const getById = async (id) => {
  const filter = { id, isDeleted: false };

  const doc = await Resource.findOne(filter).select('-__v');
  if (!doc) throw new AppError('Resource not found', httpStatus.NOT_FOUND);
  return doc;
};

const update = async (id, body) => {
  const filter = { id, isDeleted: false };

  const doc = await Resource.findOneAndUpdate(filter, body, { new: true, runValidators: true }).select('-__v');
  if (!doc) throw new AppError('Resource not found', httpStatus.NOT_FOUND);
  return doc;
};

const remove = async (id) => {
  const filter = { id };

  const doc = await Resource.findOneAndUpdate(filter, { isDeleted: true }, { new: true });
  if (!doc) throw new AppError('Resource not found', httpStatus.NOT_FOUND);
};

module.exports = { create, getAll, getById, update, remove };
