const { z } = require('zod');
const { STATUS } = require('../../../constants/enums');

const permissionEntrySchema = z.object({
  resource: z.string().min(1),
  action:   z.array(z.string()).min(1),
});

const createPermissionSchema = z.object({
  roleId:      z.number().int().positive(),
  permissions: z.array(permissionEntrySchema).min(1),
});

const updatePermissionSchema = z
  .object({
    permissions: z.array(permissionEntrySchema).min(1).optional(),
    status:      z.enum(Object.values(STATUS)).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

module.exports = { createPermissionSchema, updatePermissionSchema };
