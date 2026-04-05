const User = require('./user.model');
const Role = require('../acl/roles/roles.model');
const AppError = require('../../core/error/AppError');
const httpStatus = require('../../constants/httpStatus');
const { STATUS } = require('../../constants/enums');
const { parseQueryOptions, paginatedResponse } = require('../../utils/pagination');
const { validateQuota } = require('../subscription/subscriptions/subscription.utils');
const TokenBlacklist = require('../auth/auth.tokenBlacklist.model');
const RefreshToken = require('../auth/auth.refreshToken.model');
const jwt = require('jsonwebtoken');
const config = require('../../config/app.config');

const createUser = async (body, tenantKey) => {
  // 1. Quota Check (for Vendors)
  if (tenantKey) {
    const currentCount = await User.countDocuments({ tenantKey, isDeleted: false });
    await validateQuota(tenantKey, 'MAX_USERS', currentCount);
  }

  const existing = await User.findOne({ email: body.email });
  if (existing) throw new AppError('Email already exists', httpStatus.CONFLICT);

  const payload = { ...body, tenantKey, isActive: true, isVerified: true };

  // Validate roles within the tenant
  if (payload.roles && payload.roles.length > 0) {
    const rolesFilter = { id: { $in: payload.roles }, isDeleted: false, status: STATUS.ACTIVE };
    if (tenantKey !== null) rolesFilter.tenantKey = tenantKey;

    const roles = await Role.find(rolesFilter).select('id');
    if (roles.length !== payload.roles.length) {
      throw new AppError('One or more role ids are invalid or not allowed for this tenant', httpStatus.BAD_REQUEST);
    }
  }

  const user = await User.create(payload);
  return await User.findById(user._id).populate({ path: 'roles', model: 'Role', foreignField: 'id', select: 'id name key -_id' }).select('-__v -password');
};
const getAllUsers = async (query, tenantKey) => {
  const options = parseQueryOptions(query);
  const filter = { isDeleted: false, ...options.filter };

  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const dbQuery = User.find(filter)
    .populate({ path: 'roles', model: 'Role', foreignField: 'id', select: 'id name key -_id' })
    .sort(options.sort).skip(options.skip).select(options.selectStr);
  if (!options.noLimit) dbQuery.limit(options.limit);

  const [users, total] = await Promise.all([
    options.select.length > 0
      ? dbQuery.lean().then((docs) => docs.map(({ __v, ...rest }) => rest))
      : dbQuery,
    User.countDocuments(filter),
  ]);

  return paginatedResponse(users, total, { ...options, filter });
};

const getUserById = async (id, tenantKey) => {
  const filter = { id, isDeleted: false };
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const user = await User.findOne(filter)
    .populate({ path: 'roles', model: 'Role', foreignField: 'id', select: 'id name key -_id' })
    .select('-__v');
  if (!user) throw new AppError('User not found', httpStatus.NOT_FOUND);
  return user;
};

const updateUser = async (id, body, tenantKey) => {
  const filter = { id, isDeleted: false };
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const payload = { ...body };

  if (payload.roles && payload.roles.length > 0) {
    const roles = await Role.find({ id: { $in: payload.roles }, isDeleted: false, status: STATUS.ACTIVE }).select('id');
    if (roles.length !== payload.roles.length) {
      throw new AppError('One or more role ids are invalid', httpStatus.BAD_REQUEST);
    }
    payload.roles = roles.map((r) => r.id);
  }

  const user = await User.findOneAndUpdate(
    filter,
    payload,
    { new: true, runValidators: true }
  ).populate({ path: 'roles', model: 'Role', foreignField: 'id', select: 'id name key -_id' }).select('-__v');
  if (!user) throw new AppError('User not found', httpStatus.NOT_FOUND);
  return user;
};

const deleteUser = async (id, tenantKey) => {
  const filter = { id };
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const user = await User.findOneAndUpdate(filter, { isDeleted: true }, { new: true });
  if (!user) throw new AppError('User not found', httpStatus.NOT_FOUND);
};

const activateUser = async (id, tenantKey) => {
  const filter = { id, isDeleted: false };
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const user = await User.findOneAndUpdate(filter, { isActive: true }, { new: true });
  if (!user) throw new AppError('User not found', httpStatus.NOT_FOUND);
  return user;
};

const deactivateUser = async (id, tenantKey, currentAccessToken = null) => {
  const filter = { id, isDeleted: false };
  if (tenantKey !== null) filter.tenantKey = tenantKey;

  const user = await User.findOne(filter);
  if (!user) throw new AppError('User not found', httpStatus.NOT_FOUND);

  // 1. Mark as Inactive
  user.isActive = false;
  await user.save();

  // 2. Revoke all Refresh Tokens
  await RefreshToken.updateMany({ userId: user._id, isRevoked: false }, { isRevoked: true });

  // 3. Blacklist current access token if provided
  if (currentAccessToken) {
    try {
      const decoded = jwt.verify(currentAccessToken, config.jwt.secret);
      const tokenHash = TokenBlacklist.hash(currentAccessToken);
      const expiresAt = new Date(decoded.exp * 1000);
      await TokenBlacklist.findOneAndUpdate({ tokenHash }, { tokenHash, expiresAt }, { upsert: true });
    } catch (err) {
      // Token might already be expired or invalid, ignore
    }
  }

  return user;
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser, activateUser, deactivateUser };
