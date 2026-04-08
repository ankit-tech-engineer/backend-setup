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

const verifyPayment = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  razorpayPaymentLinkReferenceId: z.string().optional(),
  razorpayPaymentLinkStatus: z.string().optional(),
});

const manualAssign = z.object({
  vendorId: z.number().int().positive(),
  planId: z.number().int().positive(),
});

module.exports = {
  purchasePlan,
  renewPlan,
  upgradePlan,
  verifyPayment,
  manualAssign,
};
