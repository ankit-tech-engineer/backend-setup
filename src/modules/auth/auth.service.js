const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../user/user.model');
const Role = require('../acl/roles/roles.model');
const Vendor = require('../vendor/vendor.model');
const RefreshToken = require('./auth.refreshToken.model');
const TokenBlacklist = require('./auth.tokenBlacklist.model');
const AppError = require('../../core/error/AppError');
const httpStatus = require('../../constants/httpStatus');
const { env } = require('../../config/env.config');
const { STATUS } = require('../../constants/enums');
const { emailQueue } = require('../../queues/email.queue');
const { otpTemplate, resendOtpTemplate, welcomeTemplate } = require('../../utils/emailTemplates');

const generateAccessToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

const saveRefreshToken = async (userId, token) => {
  const tokenHash = RefreshToken.hash(token);
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);
  await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
  await RefreshToken.create({ userId, tokenHash, expiresAt });
};

const buildTokenResponse = (user) => {
  const payload = { id: user.id, roles: user.roles, tenantKey: user.tenantKey };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ id: user.id });
  return { accessToken, refreshToken };
};

const register = async (body) => {
  const { name, email, vendorName, phone } = body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already in use', httpStatus.CONFLICT);

  // 1. Create Vendor
  const tenantKey = crypto.randomUUID();
  const vendor = await Vendor.create({
    name: vendorName,
    tenantKey,
    email,
    phone,
    vendorType: body.vendorType
  });

  const roleIds = body.roles && body.roles.length > 0 ? body.roles : [2];
  const roles = await Role.find({ id: { $in: roleIds }, isDeleted: false, status: STATUS.ACTIVE }).select('id');
  if (roles.length !== roleIds.length) throw new AppError('One or more role ids are invalid', httpStatus.BAD_REQUEST);
  const resolvedRoleIds = roles.map((r) => r.id);

  // 3. Create User
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const user = await User.create({
    name,
    email,
    tenantKey,
    vendorId: vendor.id,
    otp,
    otp_expiry,
    roles: resolvedRoleIds,
    isVerified: false,
    isActive: false,
    password: null
  });

  // 4. Update Vendor with userId
  vendor.userId = user.id;
  await vendor.save();

  // 4. Enqueue OTP email
  await emailQueue.add('send-otp', {
    to: email,
    subject: 'Verification OTP - SaaS Project',
    html: otpTemplate(name, otp),
  });

  return {
    message: 'Registration successful. Please verify OTP sent to your email.',
    tenantKey
  };
};

const resendOtp = async ({ email }) => {
  const user = await User.findOne({ email, isVerified: false, isDeleted: false });
  if (!user) throw new AppError('User not found or already verified', httpStatus.BAD_REQUEST);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otp_expiry = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otp_expiry = otp_expiry;
  await user.save();

  // Enqueue OTP email
  await emailQueue.add('send-otp', {
    to: email,
    subject: 'Resend OTP - SaaS Project',
    html: resendOtpTemplate(user.name, otp),
  });

  return { message: 'OTP resent successfully. Please check your email.' };
};

const verifyOtp = async ({ email, otp }) => {
  const user = await User.findOne({ email, otp, otp_expiry: { $gt: new Date() } });
  if (!user) throw new AppError('Invalid or expired OTP', httpStatus.BAD_REQUEST);

  user.isVerified = true;
  user.otp = undefined;
  user.otp_expiry = undefined;
  await user.save();

  return { message: 'Email verified successfully. Please set your password.' };
};

const setPassword = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !user.isVerified) throw new AppError('User not verified or not found', httpStatus.BAD_REQUEST);
  if (user.isActive) throw new AppError('User is already active', httpStatus.BAD_REQUEST);
  if (user.password) throw new AppError('Password is already set', httpStatus.BAD_REQUEST);

  user.password = password;
  user.isActive = true;
  await user.save();

  // Update Vendor status
  if (user.tenantKey) {
    await Vendor.findOneAndUpdate(
      { tenantKey: user.tenantKey },
      { onTrial: true, isLoginActivate: true }
    );
  }

  await emailQueue.add('welcome', {
    to: user.email,
    subject: 'Welcome to SaaS Project!',
    html: welcomeTemplate(user.name, user.email, password),
  });

  return { message: 'Password set successfully. You can now login.' };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email, isDeleted: false })
    .select('+password')
    .populate({ path: 'roles', model: 'Role', foreignField: 'id', select: 'id name key -_id' });

  if (!user || user.password === null || !(await user.comparePassword(password)))
    throw new AppError('Invalid email or password', httpStatus.UNAUTHORIZED);

  if (!user.isVerified) throw new AppError('Email not verified', httpStatus.FORBIDDEN);
  if (!user.isActive) throw new AppError('Account is not active', httpStatus.FORBIDDEN);
  if (user.status !== STATUS.ACTIVE) throw new AppError('Account is disabled', httpStatus.FORBIDDEN);

  const { accessToken, refreshToken } = buildTokenResponse(user);
  await saveRefreshToken(user._id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, roles: user.roles, tenantKey: user.tenantKey },
  };
};

const refreshAccessToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', httpStatus.UNAUTHORIZED);
  }

  const tokenHash = RefreshToken.hash(token);
  const storedToken = await RefreshToken.findOne({ tokenHash, isRevoked: false });
  if (!storedToken) throw new AppError('Refresh token has been revoked', httpStatus.UNAUTHORIZED);

  const user = await User.findOne({ id: decoded.id, isDeleted: false })
    .populate({ path: 'roles', model: 'Role', foreignField: 'id', select: 'id name key -_id' });
  if (!user) throw new AppError('User not found', httpStatus.UNAUTHORIZED);

  const { accessToken, refreshToken: newRefreshToken } = buildTokenResponse(user);
  await saveRefreshToken(user._id, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
};

const logout = async (accessToken) => {
  if (!accessToken) throw new AppError('Access token is required', httpStatus.BAD_REQUEST);
  let decoded;
  try {
    decoded = jwt.verify(accessToken, env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired access token', httpStatus.UNAUTHORIZED);
  }

  const tokenHash = TokenBlacklist.hash(accessToken);
  const expiresAt = new Date(decoded.exp * 1000);
  await TokenBlacklist.findOneAndUpdate({ tokenHash }, { tokenHash, expiresAt }, { upsert: true });
  await RefreshToken.updateMany({ userId: decoded._id }, { isRevoked: true });
};

module.exports = { register, resendOtp, verifyOtp, setPassword, login, refreshAccessToken, logout };
