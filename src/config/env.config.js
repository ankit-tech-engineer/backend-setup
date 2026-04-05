require('dotenv').config();
const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET:              z.string().min(1),
  JWT_EXPIRES_IN:          z.string().default('8h'),
  JWT_REFRESH_SECRET:      z.string().min(1),
  JWT_REFRESH_EXPIRES_IN:  z.string().default('7d'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().min(1),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  RAZOR_PAY_API_KEY: z.string().min(1),
  RAZOR_PAY_SECRET_KEY: z.string().min(1),
  RAZOR_PAY_WEBHOOK_SECRET: z.string().default('2VdkF7r7jdysV@N'),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  throw new Error(`Env validation error: ${result.error.errors.map((e) => e.message).join(', ')}`);
}

module.exports = { env: result.data };
