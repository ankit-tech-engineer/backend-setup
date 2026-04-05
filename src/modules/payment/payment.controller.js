const httpStatus = require('../../constants/httpStatus');
const paymentService = require('./payment.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../core/response/responseHandler');
const subscriptionService = require('../subscription/subscriptions/subscription.service');
const AppError = require('../../core/error/AppError');

const createOrder = asyncHandler(async (req, res) => {
    const { amount, metadata } = req.body;
    const vendor = { id: req.user.vendorId, tenantKey: req.user.tenantKey };
    
    const order = await paymentService.createOrder(amount, vendor, metadata);
    
    sendSuccess(res, {
        statusCode: httpStatus.CREATED,
        message: 'Order created successfully',
        data: order,
    });
});

const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const payment = await paymentService.verifySignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
    });

    if (payment.metadata && payment.metadata.type === 'subscription') {
        await subscriptionService.handlePaymentSuccess({
            ...payment.metadata,
            paymentId: payment.id,
            amount: payment.amount
        });
    }

    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Payment verified and processed successfully',
        data: payment,
    });
});

/**
 * handleWebhook(req, res)
 * Automated handler for Razorpay Webhook events.
 */
const handleWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // 1. Verify Signature
    const isValid = paymentService.verifyWebhookSignature(body, signature);
    if (!isValid) {
        throw new AppError('Invalid webhook signature', httpStatus.BAD_REQUEST);
    }

    // 2. Process Event
    const event = body.event;
    
    // We mainly care about payment link successes
    if (event === 'payment_link.paid') {
        const entity = body.payload.payment_link.entity;
        const notes = entity.notes;
        const plinkId = entity.id;

        // Find and update local payment record
        const payment = await paymentService.getPaymentByOrderId(plinkId);
        if (payment && payment.status !== 'SUCCESS') {
            payment.status = 'SUCCESS';
            payment.razorpayPaymentId = body.payload.payment.entity.id;
            await payment.save();

            // Dispatch to subscription module
            if (notes && notes.type === 'subscription') {
                await subscriptionService.handlePaymentSuccess({
                    ...notes,
                    paymentId: payment.id,
                    amount: payment.amount
                });
            }
        }
    }

    // Always return 200 to Razorpay
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Webhook processed successfully',
    });
});

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
};
