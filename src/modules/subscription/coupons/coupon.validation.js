const { z } = require('zod');
const { STATUS } = require('../../../constants/enums');

const createCoupon = z.object({
  code: z.string().min(2).toUpperCase(),
  type: z.enum(['FIXED', 'PERCENTAGE']),
  value: z.number().min(0),
  minPurchase: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  expiryDate: z.string().datetime().or(z.date()), // Zod for ISO date strings
  usageLimit: z.number().int().min(1).optional(),
  status: z.nativeEnum(STATUS).optional(),
});

const updateCoupon = z.object({
  code: z.string().min(2).toUpperCase().optional(),
  type: z.enum(['FIXED', 'PERCENTAGE']).optional(),
  value: z.number().min(0).optional(),
  minPurchase: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  expiryDate: z.string().datetime().or(z.date()).optional(),
  usageLimit: z.number().int().min(1).optional(),
  status: z.nativeEnum(STATUS).optional(),
});

module.exports = {
  createCoupon,
  updateCoupon,
};
