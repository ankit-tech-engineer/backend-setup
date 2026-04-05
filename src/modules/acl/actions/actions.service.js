const Action = require('./actions.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const { parseQueryOptions, paginatedResponse } = require('../../../utils/pagination');

const create = async (body) => {
  const key = body.key || body.name.toLowerCase().trim().replace(/\s+/g, '_');
  const existing = await Action.findOne({ key });
  if (existing) {
    if (existing.isDeleted) {
      return await Action.findOneAndUpdate(
        { key },
        { ...body, isDeleted: false },
        { new: true, runValidators: true }
      );
    }
    throw new AppError('Action key already exists', httpStatus.CONFLICT);
  }
  return await Action.create({ ...body, key });
};

const getAll = async (query) => {
  const options = parseQueryOptions(query);
  const filter = { isDeleted: false, ...options.filter };

  const dbQuery = Action.find(filter).sort(options.sort).skip(options.skip).select(options.selectStr);
  if (!options.noLimit) dbQuery.limit(options.limit);

  const [docs, total] = await Promise.all([
    options.select.length > 0
      ? dbQuery.lean().then((list) => list.map(({ __v, ...rest }) => rest))
      : dbQuery,
    Action.countDocuments(filter),
  ]);

  return paginatedResponse(docs, total, { ...options, filter });
};

const getById = async (id) => {
  const filter = { id, isDeleted: false };

  const doc = await Action.findOne(filter).select('-__v');
  if (!doc) throw new AppError('Action not found', httpStatus.NOT_FOUND);
  return doc;
};

const update = async (id, body) => {
  const filter = { id, isDeleted: false };

  const doc = await Action.findOneAndUpdate(filter, body, { new: true, runValidators: true }).select('-__v');
  if (!doc) throw new AppError('Action not found', httpStatus.NOT_FOUND);
  return doc;
};

const remove = async (id) => {
  const filter = { id };

  const doc = await Action.findOneAndUpdate(filter, { isDeleted: true }, { new: true });
  if (!doc) throw new AppError('Action not found', httpStatus.NOT_FOUND);
};

module.exports = { create, getAll, getById, update, remove };
