const { z } = require('zod');
const { STATUS } = require('../../../constants/enums');

const createMappingSchema = z.object({
  module_name: z.string().min(2).max(100),
  key:         z.string().min(2).max(50).optional(),
  resources:   z.array(z.number()).optional(),
  status:      z.enum(Object.values(STATUS)).optional(),
});

const updateMappingSchema = z
  .object({
    module_name: z.string().min(2).max(100).optional(),
    key:         z.string().min(2).max(50).optional(),
    resources:   z.array(z.number()).optional(),
    status:      z.enum(Object.values(STATUS)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

module.exports = { createMappingSchema, updateMappingSchema };
