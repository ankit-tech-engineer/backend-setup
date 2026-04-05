const { z } = require('zod');
const { STATUS } = require('../../../constants/enums');

const createResourceSchema = z.object({
  name: z.string().min(2).max(50),
  key:  z.string().min(2).max(50).optional(),
});

const updateResourceSchema = z
  .object({
    name:   z.string().min(2).max(50).optional(),
    key:    z.string().min(2).max(50).optional(),
    status: z.enum(Object.values(STATUS)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

module.exports = { createResourceSchema, updateResourceSchema };
