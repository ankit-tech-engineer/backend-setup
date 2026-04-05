const { z } = require('zod');

const createVendorSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  vendorType: z.number().int().positive().optional(),
  tenantKey: z.string().optional(),
});

const updateVendorSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  vendorType: z.number().int().positive().optional(),
  tenantKey: z.string().optional(),
  status: z.string().optional(),
});

module.exports = {
  createVendorSchema,
  updateVendorSchema,
};
