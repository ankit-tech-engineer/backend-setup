const { z } = require('zod');
const { STATUS } = require('../../../constants/enums');

const createMappingSchema = z.object({
  resourceId: z.number().int(),
  actions:    z.array(z.number().int()),
  status:     z.enum(Object.values(STATUS)).optional(),
});

const updateMappingSchema = z
  .object({
    resourceId: z.number().int().optional(),
    actions:    z.array(z.number().int()).optional(),
    status:     z.enum(Object.values(STATUS)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

module.exports = { createMappingSchema, updateMappingSchema };
