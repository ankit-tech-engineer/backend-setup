const Permission = require('./permissions.model');
const Role = require('../roles/roles.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const { STATUS } = require('../../../constants/enums');
const { parseQueryOptions, paginatedResponse } = require('../../../utils/pagination');

// Create or Update permissions for a role
const create = async (body, tenantKey) => {
  const { roleId, permissions } = body;

  const role = await Role.findOne({ id: roleId, isDeleted: false, status: STATUS.ACTIVE });
  if (!role) throw new AppError('Role not found', httpStatus.NOT_FOUND);

  // Normalize permissions
  const normalizedPermissions = permissions.map(p => ({
    resource: p.resource.toLowerCase().trim(),
    action:   p.action.map(a => a.toLowerCase().trim())
  }));

  // Find existing by roleId and tenantKey
  let doc = await Permission.findOne({ roleId, tenantKey, isDeleted: false });

  if (doc) {
    doc.permissions = normalizedPermissions;
    doc.status = STATUS.ACTIVE;
    return await doc.save();
  }

  return await Permission.create({
    roleId,
    permissions: normalizedPermissions,
    tenantKey,
    status: STATUS.ACTIVE
  });
};

const getAll = async (query, tenantKey) => {
  const options = parseQueryOptions(query);
  const filter  = { isDeleted: false, ...options.filter };

  if (tenantKey !== null) filter.tenantKey = tenantKey;
  if (query.roleId) filter.roleId = parseInt(query.roleId);

  const dbQuery = Permission.find(filter)
    .populate({ path: 'roleId', model: 'Role', foreignField: 'id', select: 'id name key -_id' })
    .sort(options.sort)
    .skip(options.skip)
    .select(options.selectStr);

  if (!options.noLimit) dbQuery.limit(options.limit);

  const [docs, total] = await Promise.all([
    options.select.length > 0
      ? dbQuery.lean().then((list) => list.map(({ __v, ...rest }) => rest))
      : dbQuery,
    Permission.countDocuments(filter),
  ]);

  return paginatedResponse(docs, total, { ...options, filter });
};

const getById = async (id, tenantKey) => {
  const filter = { id, isDeleted: false };
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const doc = await Permission.findOne(filter)
    .populate({ path: 'roleId', model: 'Role', foreignField: 'id', select: 'id name key -_id' })
    .select('-__v');
  if (!doc) throw new AppError('Permission not found', httpStatus.NOT_FOUND);
  return doc;
};

// Update specific fields of a permission doc
const update = async (id, body, tenantKey) => {
  const filter = { id, isDeleted: false };
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const doc = await Permission.findOneAndUpdate(
    filter,
    body,
    { new: true, runValidators: true }
  ).populate({ path: 'roleId', model: 'Role', foreignField: 'id', select: 'id name key -_id' })
   .select('-__v');
  
  if (!doc) throw new AppError('Permission not found', httpStatus.NOT_FOUND);
  return doc;
};

const remove = async (id, tenantKey) => {
  const filter = { id };
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const doc = await Permission.findOneAndUpdate(filter, { isDeleted: true }, { new: true });
  if (!doc) throw new AppError('Permission not found', httpStatus.NOT_FOUND);
};

module.exports = { create, getAll, getById, update, remove };
