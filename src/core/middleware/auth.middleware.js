const jwt = require('jsonwebtoken');
const { env } = require('../../config/env.config');
const AppError = require('../error/AppError');
const httpStatus = require('../../constants/httpStatus');
const asyncHandler = require('../../utils/asyncHandler');
const TokenBlacklist = require('../../modules/auth/auth.tokenBlacklist.model');
const User = require('../../modules/user/user.model');
const Vendor = require('../../modules/vendor/vendor.model');
const { STATUS } = require('../../constants/enums');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No token provided', httpStatus.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, env.JWT_SECRET);

  // Check if token has been blacklisted (logged out)
  const tokenHash = TokenBlacklist.hash(token);
  const isBlacklisted = await TokenBlacklist.findOne({ tokenHash });
  if (isBlacklisted) throw new AppError('Token has been invalidated. Please log in again.', httpStatus.UNAUTHORIZED);

  req.user = decoded;

  // 1. User Status Check
  const user = await User.findOne({ id: decoded.id, isDeleted: false }).select('isActive status tenantKey vendorId');
  if (!user) throw new AppError('User not found', httpStatus.UNAUTHORIZED);
  
  // Attach latest DB values to req.user
  req.user.tenantKey = user.tenantKey;
  req.user.vendorId = user.vendorId;
  
  if (!user.isActive || user.status !== STATUS.ACTIVE) {
    throw new AppError('Your account is inactive. Please contact support.', httpStatus.FORBIDDEN);
  }

  // 2. Vendor Status Check (Multi-tenant isolation)
  if (user.tenantKey) {
    const vendor = await Vendor.findOne({ tenantKey: user.tenantKey, isDeleted: false }).select('status');
    if (!vendor || vendor.status !== STATUS.ACTIVE) {
      throw new AppError('This tenant account is inactive. All services are currently suspended.', httpStatus.FORBIDDEN);
    }
  }

  next();
});

module.exports = { authenticate };
