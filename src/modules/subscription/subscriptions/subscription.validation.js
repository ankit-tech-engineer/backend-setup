const { z } = require('zod');

const purchasePlan = z.object({
  planId: z.number().int().positive(),
  couponCode: z.string().optional().nullable(),
  callbackUrl: z.string().url().optional(),
});

const renewPlan = z.object({
  couponCode: z.string().optional().nullable(),
  callbackUrl: z.string().url().optional(),
});

const upgradePlan = z.object({
  newPlanId: z.number().int().positive(),
  couponCode: z.string().optional().nullable(),
  callbackUrl: z.string().url().optional(),
});

module.exports = {
  purchasePlan,
  renewPlan,
  upgradePlan,
};
