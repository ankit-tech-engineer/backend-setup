const Role = require('./roles.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const { parseQueryOptions, paginatedResponse } = require('../../../utils/pagination');

const create = async (body, tenantKey) => {
  const key = body.key || body.name.toLowerCase().trim().replace(/\s+/g, '_');
  const existing = await Role.findOne({ key, tenantKey });
  if (existing) {
    if (existing.isDeleted) {
      return await Role.findOneAndUpdate(
        { key, tenantKey },
        { ...body, isDeleted: false },
        { new: true, runValidators: true }
      );
    }
    throw new AppError('Role key already exists', httpStatus.CONFLICT);
  }
  return await Role.create({ ...body, key, tenantKey });
};

const getAll = async (query, tenantKey) => {
  const options = parseQueryOptions(query);
  const filter = { isDeleted: false, ...options.filter };

  // Enforce tenantKey if not Super Admin (tenantKey == null)
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const dbQuery = Role.find(filter).sort(options.sort).skip(options.skip).select(options.selectStr);
  if (!options.noLimit) dbQuery.limit(options.limit);

  const [docs, total] = await Promise.all([
    options.select.length > 0
      ? dbQuery.lean().then((list) => list.map(({ __v, ...rest }) => rest))
      : dbQuery,
    Role.countDocuments(filter),
  ]);

  return paginatedResponse(docs, total, { ...options, filter });
};

const getById = async (id, tenantKey) => {
  const filter = { id, isDeleted: false };
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const doc = await Role.findOne(filter).select('-__v');
  if (!doc) throw new AppError('Role not found', httpStatus.NOT_FOUND);
  return doc;
};

const update = async (id, body, tenantKey) => {
  const filter = { id, isDeleted: false };
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const doc = await Role.findOneAndUpdate(filter, body, { new: true, runValidators: true }).select('-__v');
  if (!doc) throw new AppError('Role not found', httpStatus.NOT_FOUND);
  return doc;
};

const remove = async (id, tenantKey) => {
  const filter = { id };
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const doc = await Role.findOneAndUpdate(filter, { isDeleted: true }, { new: true });
  if (!doc) throw new AppError('Role not found', httpStatus.NOT_FOUND);
};

module.exports = { create, getAll, getById, update, remove };
