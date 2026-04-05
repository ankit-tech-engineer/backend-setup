const { z } = require('zod');
const { STATUS } = require('../../constants/enums');

const createUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  roles: z.array(z.number().int().positive()).min(1),
  password: z.string().min(6),
  status: z.enum(Object.values(STATUS)).optional(),
});

const updateUserSchema = z
  .object({
    name:   z.string().min(2).max(50).optional(),
    email:  z.string().email().optional(),
    roles:  z.array(z.number().int().positive()).min(1).optional(),
    status: z.enum(Object.values(STATUS)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

module.exports = { createUserSchema, updateUserSchema };
