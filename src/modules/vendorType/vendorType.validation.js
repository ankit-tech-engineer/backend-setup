const { z } = require('zod');

const createVendorTypeSchema = z.object({
  name: z.string().min(2).max(50),
  key: z.string().optional(),
});

const updateVendorTypeSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  key: z.string().optional(),
});

module.exports = {
  createVendorTypeSchema,
  updateVendorTypeSchema,
};
