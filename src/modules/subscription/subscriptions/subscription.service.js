const Subscription = require('./subscription.model');
const SubscriptionHistory = require('./subscriptionHistory.model');
const Plan = require('../plans/plan.model');
const Coupon = require('../coupons/coupon.model');
const Vendor = require('../../vendor/vendor.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const couponService = require('../coupons/coupon.service');
const paymentService = require('../../payment/payment.service');

const initiatePurchase = async (vendorId, planId, couponCode = null, callbackUrl) => {
    console.log(vendorId, planId, couponCode, callbackUrl);
    const vendor = await Vendor.findOne({ id: vendorId, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);

    const plan = await Plan.findOne({ id: planId, status: 'active', isDeleted: false });
    if (!plan) throw new AppError('Plan not found or inactive', httpStatus.NOT_FOUND);

    const existingActive = await Subscription.findOne({ vendorId, status: 'ACTIVE', isDeleted: false });
    if (existingActive) throw new AppError('Vendor already has an active subscription.', httpStatus.BAD_REQUEST);

    let amountToPay = plan.price;
    let discount = 0;

    if (couponCode) {
        const { discount: calculatedDiscount } = await couponService.validateCoupon(couponCode, amountToPay);
        discount = calculatedDiscount;
        amountToPay -= discount;
    }

    // Create Razorpay Payment Link
    return await paymentService.createPaymentLink(amountToPay, vendor, {
        type: 'subscription',
        action: 'PURCHASE',
        vendorId,
        planId,
        couponCode,
        discount,
        description: `Subscription for ${plan.name}`
    }, callbackUrl);
};

const initiateRenew = async (vendorId, couponCode = null, callbackUrl) => {
    const vendor = await Vendor.findOne({ id: vendorId, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);

    const subscription = await Subscription.findOne({ 
        vendorId, 
        status: { $in: ['ACTIVE', 'EXPIRED'] }, 
        isDeleted: false 
    }).sort({ createdAt: -1 });

    if (!subscription) throw new AppError('No subscription found to renew', httpStatus.NOT_FOUND);

    const plan = await Plan.findOne({ id: subscription.planId, status: 'active', isDeleted: false });
    if (!plan) throw new AppError('Plan no longer available', httpStatus.BAD_REQUEST);

    let amountToPay = plan.price;
    let discount = 0;

    if (couponCode) {
        const { discount: calculatedDiscount } = await couponService.validateCoupon(couponCode, amountToPay);
        discount = calculatedDiscount;
        amountToPay -= discount;
    }

    return await paymentService.createPaymentLink(amountToPay, vendor, {
        type: 'subscription',
        action: 'RENEW',
        vendorId,
        planId: plan.id,
        couponCode,
        discount,
        description: `Renewal for ${plan.name}`
    }, callbackUrl);
};

const initiateUpgrade = async (vendorId, newPlanId, couponCode = null, callbackUrl) => {
    const vendor = await Vendor.findOne({ id: vendorId, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);

    const currentSub = await Subscription.findOne({ vendorId, status: 'ACTIVE', isDeleted: false });
    if (!currentSub) throw new AppError('No active subscription found to upgrade', httpStatus.NOT_FOUND);

    const newPlan = await Plan.findOne({ id: newPlanId, status: 'active', isDeleted: false });
    if (!newPlan) throw new AppError('New plan not found', httpStatus.NOT_FOUND);

    // Proration logic
    const now = new Date();
    const totalDuration = currentSub.endDate - currentSub.startDate;
    const remainingDuration = currentSub.endDate - now;
    
    let credit = 0;
    if (remainingDuration > 0) {
        credit = (currentSub.amountPaid * remainingDuration) / totalDuration;
    }

    let amountToPay = newPlan.price - credit;
    if (amountToPay < 0) amountToPay = 0;

    let discount = 0;
    if (couponCode) {
        const { discount: calculatedDiscount } = await couponService.validateCoupon(couponCode, amountToPay);
        discount = calculatedDiscount;
        amountToPay -= discount;
    }

    return await paymentService.createPaymentLink(amountToPay, vendor, {
        type: 'subscription',
        action: 'UPGRADE',
        vendorId,
        newPlanId,
        couponCode,
        creditApplied: credit,
        discount,
        description: `Upgrade to ${newPlan.name}`
    }, callbackUrl);
};

const handlePaymentSuccess = async (data) => {
    const { action, vendorId, planId, newPlanId, couponCode, discount, amount, paymentId } = data;

    // 0. Idempotency Check (Prevent duplicate activation)
    if (paymentId) {
        const alreadyProcessed = await SubscriptionHistory.findOne({ 
            'details.paymentId': paymentId 
        });
        if (alreadyProcessed) return; // Silent return, already handled
    }

    const vendor = await Vendor.findOne({ id: vendorId });

    if (action === 'PURCHASE') {
        const plan = await Plan.findOne({ id: planId });
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.validityDays);

        const subscription = await Subscription.create({
            vendorId, planId, startDate: new Date(), endDate,
            amountPaid: amount, discountAmount: discount,
            tenantKey: vendor.tenantKey, status: 'ACTIVE'
        });

        vendor.isPlanActivate = true; vendor.onTrial = false;
        vendor.currentSubscriptionId = subscription.id;
        await vendor.save();
    } 
    else if (action === 'RENEW') {
        const subscription = await Subscription.findOne({ vendorId, status: { $in: ['ACTIVE', 'EXPIRED'] } }).sort({ createdAt: -1 });
        const plan = await Plan.findOne({ id: planId });
        
        let startDate = new Date();
        if (subscription.status === 'ACTIVE' && subscription.endDate > new Date()) startDate = new Date(subscription.endDate);
        
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + plan.validityDays);

        subscription.endDate = endDate; subscription.status = 'ACTIVE';
        await subscription.save();
    }
    else if (action === 'UPGRADE') {
        const currentSub = await Subscription.findOne({ vendorId, status: 'ACTIVE' });
        const newPlan = await Plan.findOne({ id: newPlanId });
        
        currentSub.status = 'UPGRADED'; await currentSub.save();

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + newPlan.validityDays);

        const newSubscription = await Subscription.create({
            vendorId, planId: newPlanId, startDate: new Date(), endDate,
            amountPaid: amount, discountAmount: discount,
            tenantKey: vendor.tenantKey, status: 'ACTIVE'
        });

        vendor.currentSubscriptionId = newSubscription.id;
        await vendor.save();
    }

    if (couponCode) await Coupon.updateOne({ code: couponCode }, { $inc: { usedCount: 1 } });

    await SubscriptionHistory.create({
        subscriptionId: vendor.currentSubscriptionId,
        vendorId,
        planId: action === 'UPGRADE' ? newPlanId : planId,
        action,
        amount,
        tenantKey: vendor.tenantKey,
        details: data
    });
};

const getSubscriptions = async (query = {}) => {
    const { parseQueryOptions, paginatedResponse } = require('../../../utils/pagination');
    const options = parseQueryOptions(query);
    const filter = { isDeleted: false, ...options.filter };

    const dbQuery = Subscription.find(filter)
        .populate({ path: 'planId', model: 'Plan', foreignField: 'id', select: 'id name price' })
        .populate({ path: 'vendorId', model: 'Vendor', foreignField: 'id', select: 'id name email' })
        .sort(options.sort)
        .skip(options.skip);

    if (!options.noLimit) dbQuery.limit(options.limit);

    const [list, total] = await Promise.all([dbQuery, Subscription.countDocuments(filter)]);
    return paginatedResponse(list, total, options);
};

const getActiveSubscription = async (vendorId) => {
    const subscription = await Subscription.findOne({ vendorId, status: 'ACTIVE', isDeleted: false })
        .populate({ path: 'planId', model: 'Plan', foreignField: 'id', populate: { path: 'features', model: 'Feature', foreignField: 'id', select: 'id name code' } });
    if (!subscription) throw new AppError('No active subscription found', httpStatus.NOT_FOUND);
    return subscription;
};

const getSubscriptionHistory = async (query = {}) => {
    const { parseQueryOptions, paginatedResponse } = require('../../../utils/pagination');
    const options = parseQueryOptions(query);
    const filter = { ...options.filter };
    const dbQuery = SubscriptionHistory.find(filter)
        .populate({ path: 'planId', model: 'Plan', foreignField: 'id', select: 'id name price' })
        .populate({ path: 'vendorId', model: 'Vendor', foreignField: 'id', select: 'id name email' })
        .sort(options.sort).skip(options.skip);

    if (!options.noLimit) dbQuery.limit(options.limit);
    const [list, total] = await Promise.all([dbQuery, SubscriptionHistory.countDocuments(filter)]);
    return paginatedResponse(list, total, options);
};

module.exports = {
    initiatePurchase,
    initiateRenew,
    initiateUpgrade,
    handlePaymentSuccess,
    getSubscriptions,
    getActiveSubscription,
    getSubscriptionHistory,
};
