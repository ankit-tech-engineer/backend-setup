const userService = require('./user.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../core/response/responseHandler');
const AppError = require('../../core/error/AppError');
const httpStatus = require('../../constants/httpStatus');
const messages = require('../../constants/messages');

const parseId = (id) => {
  const parsed = parseInt(id);
  if (isNaN(parsed)) throw new AppError('Invalid id', httpStatus.BAD_REQUEST);
  return parsed;
};

const createUser = asyncHandler(async (req, res) => {
  const data = await userService.createUser(req.body, req.user.tenantKey);
  sendSuccess(res, { statusCode: httpStatus.CREATED, message: 'User created successfully', data });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const { meta, data } = await userService.getAllUsers(req.query, req.user.tenantKey);
  sendSuccess(res, { message: messages.SUCCESS, meta, data });
});

const getUserById = asyncHandler(async (req, res) => {
  const data = await userService.getUserById(parseId(req.params.id), req.user.tenantKey);
  sendSuccess(res, { message: messages.SUCCESS, data });
});

const updateUser = asyncHandler(async (req, res) => {
  const data = await userService.updateUser(parseId(req.params.id), req.body, req.user.tenantKey);
  sendSuccess(res, { message: messages.SUCCESS, data });
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(parseId(req.params.id), req.user.tenantKey);
  sendSuccess(res, { statusCode: httpStatus.NO_CONTENT, message: messages.DELETED });
});

const activate = asyncHandler(async (req, res) => {
  const data = await userService.activateUser(parseId(req.params.id), req.user.tenantKey);
  sendSuccess(res, { message: 'User activated successfully', data });
});

const deactivate = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  const data = await userService.deactivateUser(parseId(req.params.id), req.user.tenantKey, token);
  sendSuccess(res, { message: 'User deactivated successfully', data });
});

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser, activate, deactivate };
