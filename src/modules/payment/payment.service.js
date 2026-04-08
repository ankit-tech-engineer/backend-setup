const Razorpay = require('razorpay');
const crypto = require('crypto');
const { env } = require('../../config/env.config');
const Payment = require('./payment.model');
const AppError = require('../../core/error/AppError');
const httpStatus = require('../../constants/httpStatus');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: env.RAZOR_PAY_API_KEY,
  key_secret: env.RAZOR_PAY_SECRET_KEY,
});

/**
 * createOrder(amount, vendor, metadata)
 * @param {number} amount - Amount in basic unit (e.g., INR)
 * @param {object} vendor - Vendor object { id, tenantKey }
 * @param {object} metadata - Custom data for callback logic
 */
const createOrder = async (amount, vendor, metadata = {}) => {
  const options = {
    amount: Math.round(amount * 100), // Razorpay expects amount in paise (x100)
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
    notes: {
      tenantKey: vendor.tenantKey,
      vendorId: vendor.id,
      ...metadata,
    },
  };

  try {
    const order = await razorpay.orders.create(options);

    // Save PENDING payment record
    const payment = await Payment.create({
      razorpayOrderId: order.id,
      amount: amount,
      vendorId: vendor.id,
      tenantKey: vendor.tenantKey,
      metadata: metadata,
      status: 'PENDING',
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment.id,
    };
  } catch (error) {
    throw new AppError(`Razorpay Order Error: ${error.message}`, httpStatus.INTERNAL_SERVER);
  }
};

/**
 * verifySignature(paymentDetails)
 * @param {object} details - { razorpayOrderId, razorpayPaymentId, razorpaySignature }
 */
const verifySignature = async (details) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = details;

  let text = `${razorpayOrderId}|${razorpayPaymentId}`;

  // If it's a Payment Link signature, use the 4-field formula: link_id|ref_id|status|payment_id
  if (razorpayOrderId.startsWith('plink_')) {
    const { razorpayPaymentLinkReferenceId, razorpayPaymentLinkStatus } = details;
    if (!razorpayPaymentLinkReferenceId || !razorpayPaymentLinkStatus) {
      throw new AppError('Payment Link reference ID and status are required for verification.', httpStatus.BAD_REQUEST);
    }
    text = `${razorpayOrderId}|${razorpayPaymentLinkReferenceId}|${razorpayPaymentLinkStatus}|${razorpayPaymentId}`;
  }

  const generatedSignature = crypto
    .createHmac('sha256', env.RAZOR_PAY_SECRET_KEY)
    .update(text)
    .digest('hex');

  const isValid = generatedSignature === razorpaySignature;

  if (!isValid) {
    // Update record to FAILED
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { 
        status: 'FAILED', 
        razorpayPaymentId, 
        razorpaySignature,
        razorpayPaymentLinkReferenceId: details.razorpayPaymentLinkReferenceId,
        razorpayPaymentLinkStatus: details.razorpayPaymentLinkStatus
      }
    );
    throw new AppError('Invalid payment signature. Payment verification failed.', httpStatus.BAD_REQUEST);
  }

  // Update record to SUCCESS
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    { 
      status: 'SUCCESS', 
      razorpayPaymentId, 
      razorpaySignature,
      razorpayPaymentLinkReferenceId: details.razorpayPaymentLinkReferenceId,
      razorpayPaymentLinkStatus: details.razorpayPaymentLinkStatus
    },
    { new: true }
  );

  return payment;
};

const getPaymentByOrderId = async (orderId) => {
    return await Payment.findOne({ razorpayOrderId: orderId });
};

/**
 * createPaymentLink(amount, vendor, metadata, callbackUrl)
 * Creates a hosted payment link for a specific vendor and purpose.
 */
const createPaymentLink = async (amount, vendor, metadata = {}, callbackUrl) => {
  const options = {
    amount: Math.round(amount * 100),
    currency: 'INR',
    accept_partial: false,
    expire_by: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    reference_id: `ref_${Date.now()}`,
    description: metadata.description || 'Payment for Subscription',
    customer: {
      name: vendor.name,
      email: vendor.email,
      contact: vendor.phone,
    },
    notify: {
      sms: true,
      email: true,
    },
    reminder_enable: true,
    notes: {
      tenantKey: vendor.tenantKey,
      vendorId: vendor.id,
      ...metadata,
    },
    callback_url: callbackUrl,
    callback_method: 'get',
  };

  try {
    const response = await razorpay.paymentLink.create(options);

    // Save PENDING payment record with reference_id
    const payment = await Payment.create({
      razorpayOrderId: response.id, // Stores plink_id as orderId
      razorpayPaymentLinkReferenceId: options.reference_id,
      amount: amount,
      vendorId: vendor.id,
      tenantKey: vendor.tenantKey,
      metadata: metadata,
      status: 'PENDING',
    });

    return {
      paymentLink: response.short_url,
      paymentLinkId: response.id,
      amount: response.amount,
      currency: response.currency,
    };
  } catch (error) {
    throw new AppError(`Razorpay Link Error: ${error.message}`, httpStatus.INTERNAL_SERVER);
  }
};

/**
 * verifyWebhookSignature(body, signature)
 * Verifies that the webhook request actually came from Razorpay using HMAC-SHA256.
 */
const verifyWebhookSignature = (body, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZOR_PAY_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');

  return expectedSignature === signature;
};

module.exports = {
  createOrder,
  createPaymentLink,
  verifySignature,
  verifyWebhookSignature,
  getPaymentByOrderId,
};
