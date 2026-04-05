const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const validate = require('../../core/middleware/validate.middleware');
const { authenticate } = require('../../core/middleware/auth.middleware');
const { 
  registerSchema, 
  verifyOtpSchema, 
  setPasswordSchema, 
  loginSchema, 
  refreshTokenSchema,
  resendOtpSchema,
} = require('./auth.validation');

router.post('/register',      validate(registerSchema),      authController.register);
router.post('/resend-otp',    validate(resendOtpSchema),     authController.resendOtp);
router.post('/verify-otp',    validate(verifyOtpSchema),     authController.verifyOtp);
router.post('/set-password',  validate(setPasswordSchema),   authController.setPassword);
router.post('/login',         validate(loginSchema),         authController.login);
router.post('/refresh-token', validate(refreshTokenSchema),  authController.refreshToken);
router.post('/logout',        authenticate,                  authController.logout);

module.exports = router;
