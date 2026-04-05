const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../core/response/responseHandler');
const httpStatus = require('../../constants/httpStatus');
const messages = require('../../constants/messages');

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  sendSuccess(res, { statusCode: httpStatus.CREATED, message: data.message, data });
});

const resendOtp = asyncHandler(async (req, res) => {
  const data = await authService.resendOtp(req.body);
  sendSuccess(res, { message: data.message });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const data = await authService.verifyOtp(req.body);
  sendSuccess(res, { message: data.message });
});

const setPassword = asyncHandler(async (req, res) => {
  const data = await authService.setPassword(req.body);
  sendSuccess(res, { message: data.message });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  sendSuccess(res, { message: messages.SUCCESS, data });
});

const refreshToken = asyncHandler(async (req, res) => {
  const data = await authService.refreshAccessToken(req.body.refreshToken);
  sendSuccess(res, { message: messages.SUCCESS, data });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  await authService.logout(token);
  sendSuccess(res, { message: 'Logged out successfully' });
});

module.exports = { register, resendOtp, verifyOtp, setPassword, login, refreshToken, logout };
