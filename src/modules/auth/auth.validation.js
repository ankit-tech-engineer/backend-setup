const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  vendorName: z.string().min(2).max(100),
  vendorType: z.number().int().positive(),
  phone: z.string().optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const setPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const resendOtpSchema = z.object({
  email: z.string().email(),
});

module.exports = {
  registerSchema,
  verifyOtpSchema,
  setPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resendOtpSchema,
};
