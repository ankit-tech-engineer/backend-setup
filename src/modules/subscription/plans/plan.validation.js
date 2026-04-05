const { z } = require('zod');
const { STATUS } = require('../../../constants/enums');

const createPlan = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  validityDays: z.number().int().min(1),
  features: z.array(z.number()).min(1),
  limits: z.record(z.any()).optional(),
  isTrial: z.boolean().optional(),
  status: z.nativeEnum(STATUS).optional(),
});

const updatePlan = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  validityDays: z.number().int().min(1).optional(),
  features: z.array(z.number()).min(1).optional(),
  limits: z.record(z.any()).optional(),
  isTrial: z.boolean().optional(),
  status: z.nativeEnum(STATUS).optional(),
});

module.exports = {
  createPlan,
  updatePlan,
};
