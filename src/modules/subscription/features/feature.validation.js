const { z } = require('zod');
const { STATUS } = require('../../../constants/enums');

const createFeature = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  status: z.nativeEnum(STATUS).optional(),
});

const updateFeature = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(STATUS).optional(),
});

module.exports = {
  createFeature,
  updateFeature,
};
