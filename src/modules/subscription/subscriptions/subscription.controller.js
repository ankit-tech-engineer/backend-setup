const httpStatus = require('../../../constants/httpStatus');
const subscriptionService = require('./subscription.service');
const asyncHandler = require('../../../utils/asyncHandler');
const { sendSuccess } = require('../../../core/response/responseHandler');

const purchasePlan = asyncHandler(async (req, res) => {
    const { planId, couponCode, callbackUrl } = req.body;
    const vendorId = req.user.vendorId;
    console.log(req.user);
    
    // Returns Razorpay Payment Link
    const linkData = await subscriptionService.initiatePurchase(vendorId, planId, couponCode, callbackUrl);
    
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Subscription payment link generated successfully.',
        data: linkData,
    });
});

const renewPlan = asyncHandler(async (req, res) => {
    const { couponCode, callbackUrl } = req.body;
    const vendorId = req.user.vendorId;
    
    const linkData = await subscriptionService.initiateRenew(vendorId, couponCode, callbackUrl);
    
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Renewal payment link generated successfully.',
        data: linkData,
    });
});

const upgradePlan = asyncHandler(async (req, res) => {
    const { newPlanId, couponCode, callbackUrl } = req.body;
    const vendorId = req.user.vendorId;
    
    const linkData = await subscriptionService.initiateUpgrade(vendorId, newPlanId, couponCode, callbackUrl);
    
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Upgrade payment link generated successfully.',
        data: linkData,
    });
});

const getSubscriptions = asyncHandler(async (req, res) => {
    const result = await subscriptionService.getSubscriptions(req.query);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Subscriptions fetched successfully',
        data: result.data,
        meta: result.meta,
    });
});

const getActiveSubscription = asyncHandler(async (req, res) => {
    const vendorId = req.user.vendorId;
    const subscription = await subscriptionService.getActiveSubscription(vendorId);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Active subscription fetched successfully',
        data: subscription,
    });
});

const getSubscriptionHistory = asyncHandler(async (req, res) => {
    const query = { ...req.query };
    if (req.user.tenantKey) {
        query.tenantKey = req.user.tenantKey;
    }
    const result = await subscriptionService.getSubscriptionHistory(query);
    sendSuccess(res, {
        statusCode: httpStatus.OK,
        message: 'Subscription history fetched successfully',
        data: result.data,
        meta: result.meta,
    });
});

module.exports = {
    purchasePlan,
    renewPlan,
    upgradePlan,
    getSubscriptions,
    getActiveSubscription,
    getSubscriptionHistory,
};
