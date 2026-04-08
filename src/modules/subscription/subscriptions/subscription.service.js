const Subscription = require('./subscription.model');
const SubscriptionHistory = require('./subscriptionHistory.model');
const Plan = require('../plans/plan.model');
const Coupon = require('../coupons/coupon.model');
const Vendor = require('../../vendor/vendor.model');
const Payment = require('../../payment/payment.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');
const couponService = require('../coupons/coupon.service');
const paymentService = require('../../payment/payment.service');
const { STATUS } = require('../../../constants/enums');

/**
 * Utility: Retire any existing active subscription for a vendor
 */
const retireExistingSubscription = async (vendorId, excludeSubscriptionId, newStatus = 'EXPIRED') => {
    return await Subscription.updateMany(
        { 
            vendorId, 
            status: 'ACTIVE', 
            id: { $ne: excludeSubscriptionId } 
        },
        { status: newStatus }
    );
};

/**
 * Utility: Generate Subscription Code
 */
const generateSubscriptionCode = () => {
    return `SUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

/**
 * Initiate Purchase
 */
const initiatePurchase = async (vendorId, planId, couponCode = null, callbackUrl) => {
    const vendor = await Vendor.findOne({ id: vendorId, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);

    const plan = await Plan.findOne({ id: planId, status: STATUS.ACTIVE, isDeleted: false });
    if (!plan) throw new AppError('Plan not found or inactive', httpStatus.NOT_FOUND);

    const existingActive = await Subscription.findOne({ vendorId, status: 'ACTIVE', isDeleted: false });
    if (existingActive) throw new AppError('Vendor already has an active subscription.', httpStatus.BAD_REQUEST);

    let baseAmount = plan.price;
    let discount = 0;
    let couponId = null;

    if (couponCode) {
        const { coupon, discount: calculatedDiscount } = await couponService.validateCoupon(couponCode, baseAmount);
        discount = calculatedDiscount;
        couponId = coupon.id;
    }

    const finalAmount = baseAmount - discount;

    // 1. Create Pending Subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.validityDays);

    const subscription = await Subscription.create({
        subscriptionCode: generateSubscriptionCode(),
        vendorId, planId, startDate: new Date(), endDate,
        purchaseType: 'PURCHASE',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        baseAmount, finalAmount, discountAmount: discount,
        couponId,
        tenantKey: vendor.tenantKey
    });

    // 2. Create Payment Link
    const linkData = await paymentService.createPaymentLink(finalAmount, vendor, {
        type: 'subscription',
        action: 'PURCHASE',
        vendorId,
        planId,
        subscriptionId: subscription.id,
        description: `Subscription for ${plan.name}`
    }, callbackUrl);

    // 3. Update Subscription with Payment ID and Payment Record
    const paymentRecord = await Payment.findOne({ razorpayOrderId: linkData.paymentLinkId });
    if (paymentRecord) {
        paymentRecord.subscriptionId = subscription.id;
        paymentRecord.paymentFor = 'SUBSCRIPTION_PURCHASE';
        paymentRecord.expectedAmount = finalAmount;
        await paymentRecord.save();

        subscription.paymentId = paymentRecord._id;
        await subscription.save();
    }

    return linkData;
};

/**
 * Initiate Renew
 */
const initiateRenew = async (vendorId, couponCode = null, callbackUrl) => {
    const vendor = await Vendor.findOne({ id: vendorId, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);

    const currentSub = await Subscription.findOne({ 
        vendorId, 
        status: { $in: ['ACTIVE', 'EXPIRED'] }, 
        isDeleted: false 
    }).sort({ createdAt: -1 });

    if (!currentSub) throw new AppError('No subscription found to renew', httpStatus.NOT_FOUND);

    const plan = await Plan.findOne({ id: currentSub.planId, status: STATUS.ACTIVE, isDeleted: false });
    if (!plan) throw new AppError('Plan no longer available', httpStatus.BAD_REQUEST);

    let baseAmount = plan.price;
    let discount = 0;
    let couponId = null;

    if (couponCode) {
        const { coupon, discount: calculatedDiscount } = await couponService.validateCoupon(couponCode, baseAmount);
        discount = calculatedDiscount;
        couponId = coupon.id;
    }

    const finalAmount = baseAmount - discount;

    // 1. Create Pending Renewal Subscription
    let startDate = new Date();
    if (currentSub.status === 'ACTIVE' && currentSub.endDate > new Date()) {
        startDate = new Date(currentSub.endDate);
    }
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.validityDays);

    const subscription = await Subscription.create({
        subscriptionCode: generateSubscriptionCode(),
        vendorId, planId: plan.id, 
        parentSubscriptionId: currentSub.id,
        startDate, endDate,
        purchaseType: 'RENEW',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        baseAmount, finalAmount, discountAmount: discount,
        couponId,
        tenantKey: vendor.tenantKey
    });

    // 2. Create Payment Link
    const linkData = await paymentService.createPaymentLink(finalAmount, vendor, {
        type: 'subscription',
        action: 'RENEW',
        vendorId,
        planId: plan.id,
        subscriptionId: subscription.id,
        description: `Renewal for ${plan.name}`
    }, callbackUrl);

    // 3. Update Records
    const paymentRecord = await Payment.findOne({ razorpayOrderId: linkData.paymentLinkId });
    if (paymentRecord) {
        paymentRecord.subscriptionId = subscription.id;
        paymentRecord.paymentFor = 'RENEW';
        paymentRecord.expectedAmount = finalAmount;
        await paymentRecord.save();

        subscription.paymentId = paymentRecord._id;
        await subscription.save();
    }

    return linkData;
};

/**
 * Initiate Upgrade
 */
const initiateUpgrade = async (vendorId, newPlanId, couponCode = null, callbackUrl) => {
    const vendor = await Vendor.findOne({ id: vendorId, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);

    const currentSub = await Subscription.findOne({ vendorId, status: 'ACTIVE', isDeleted: false });
    if (!currentSub) throw new AppError('No active subscription found to upgrade', httpStatus.NOT_FOUND);

    const newPlan = await Plan.findOne({ id: newPlanId, status: STATUS.ACTIVE, isDeleted: false });
    if (!newPlan) throw new AppError('New plan not found', httpStatus.NOT_FOUND);

    // Proration logic
    const now = new Date();
    const totalDuration = currentSub.endDate - currentSub.startDate;
    const remainingDuration = currentSub.endDate - now;
    
    let credit = 0;
    if (remainingDuration > 0 && totalDuration > 0) {
        credit = (currentSub.finalAmount * remainingDuration) / totalDuration;
    }

    let baseAmount = newPlan.price - credit;
    if (baseAmount < 0) baseAmount = 0;

    let discount = 0;
    let couponId = null;

    if (couponCode) {
        const { coupon, discount: calculatedDiscount } = await couponService.validateCoupon(couponCode, baseAmount);
        discount = calculatedDiscount;
        couponId = coupon.id;
    }

    const finalAmount = baseAmount - discount;

    // 1. Create Pending Upgrade Subscription
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + newPlan.validityDays);

    const subscription = await Subscription.create({
        subscriptionCode: generateSubscriptionCode(),
        vendorId, planId: newPlanId,
        parentSubscriptionId: currentSub.id,
        startDate: new Date(), endDate,
        purchaseType: 'UPGRADE',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        baseAmount, finalAmount, discountAmount: discount,
        couponId,
        tenantKey: vendor.tenantKey
    });

    // 2. Create Payment Link
    const linkData = await paymentService.createPaymentLink(finalAmount, vendor, {
        type: 'subscription',
        action: 'UPGRADE',
        vendorId,
        currentSubscriptionId: currentSub.id,
        subscriptionId: subscription.id,
        newPlanId,
        couponId,
        creditApplied: Math.round(credit),
        discount,
        description: `Upgrade to ${newPlan.name}`
    }, callbackUrl);

    // 3. Update Records
    const paymentRecord = await Payment.findOne({ razorpayOrderId: linkData.paymentLinkId });
    if (paymentRecord) {
        paymentRecord.subscriptionId = subscription.id;
        paymentRecord.paymentFor = 'UPGRADE';
        paymentRecord.expectedAmount = finalAmount;
        await paymentRecord.save();

        subscription.paymentId = paymentRecord._id;
        await subscription.save();
    }

    return linkData;
};

/**
 * Verify Payment
 */
const verifySubscriptionPayment = async (paymentDetails) => {
    const paymentRecord = await paymentService.verifySignature(paymentDetails);
    
    if (paymentRecord.status !== 'SUCCESS') {
        throw new AppError('Payment verification failed', httpStatus.BAD_REQUEST);
    }

    // Mark Payment as Verified
    paymentRecord.isVerified = true;
    paymentRecord.paidAt = new Date();
    await paymentRecord.save();

    // Activate Subscription
    return await activateSubscription(paymentRecord);
};

/**
 * Activate Subscription
 */
const activateSubscription = async (paymentRecord) => {
    const subscription = await Subscription.findOne({ id: paymentRecord.subscriptionId });
    if (!subscription) throw new AppError('Subscription not found', httpStatus.NOT_FOUND);

    const vendor = await Vendor.findOne({ id: paymentRecord.vendorId });
    if (!vendor) throw new AppError('Vendor not found', httpStatus.NOT_FOUND);

    // 1. Update Subscription Status
    subscription.status = 'ACTIVE';
    subscription.paymentStatus = 'SUCCESS';
    await subscription.save();

    // 2. Retire any other existing ACTIVE subscriptions
    const retirementStatus = subscription.purchaseType === 'UPGRADE' ? 'UPGRADED' : 'EXPIRED';
    await retireExistingSubscription(vendor.id, subscription.id, retirementStatus);

    // 3. Update Vendor Plan Status
    vendor.isPlanActivate = true;
    vendor.onTrial = false;
    vendor.currentSubscriptionId = subscription.id;
    await vendor.save();

    // 4. Log to history
    await logHistory(subscription, paymentRecord);

    // 5. Log Coupon Usage
    if (subscription.couponId) {
        await couponService.logUsage(subscription.couponId, vendor.id, subscription.id, subscription.discountAmount, vendor.tenantKey);
    }

    return subscription;
};

/**
 * Manual Assign Plan (Admin)
 */
const manualAssignPlan = async (vendorId, planId, moderatorId) => {
    const vendor = await Vendor.findOne({ id: vendorId });
    const plan = await Plan.findOne({ id: planId });

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.validityDays);

    const subscription = await Subscription.create({
        subscriptionCode: generateSubscriptionCode(),
        vendorId, planId, 
        startDate: new Date(), endDate,
        purchaseType: 'MANUAL_ASSIGN',
        status: 'ACTIVE',
        paymentStatus: 'NOT_REQUIRED',
        baseAmount: plan.price, 
        finalAmount: 0,
        tenantKey: vendor.tenantKey
    });

    // Retire any existing ACTIVE subscriptions before marking new one as current
    await retireExistingSubscription(vendorId, subscription.id, 'CANCELLED');

    vendor.isPlanActivate = true;
    vendor.onTrial = false;
    vendor.currentSubscriptionId = subscription.id;
    await vendor.save();

    await logHistory(subscription, null, 'MANUAL_ASSIGN', moderatorId);

    return subscription;
};

/**
 * Helper: Log History
 */
const logHistory = async (subscription, paymentRecord = null, actionOverride = null, moderatorId = null) => {
    let parentSub = null;
    if (subscription.parentSubscriptionId) {
        parentSub = await Subscription.findOne({ id: subscription.parentSubscriptionId });
    }

    await SubscriptionHistory.create({
        subscriptionId: subscription.id,
        parentSubscriptionId: subscription.parentSubscriptionId,
        vendorId: subscription.vendorId,
        oldPlanId: parentSub ? parentSub.planId : null,
        newPlanId: subscription.planId,
        oldStartDate: parentSub ? parentSub.startDate : null,
        oldEndDate: parentSub ? parentSub.endDate : null,
        newStartDate: subscription.startDate,
        newEndDate: subscription.endDate,
        oldAmount: parentSub ? parentSub.finalAmount : 0,
        newAmount: subscription.finalAmount,
        paymentId: paymentRecord ? paymentRecord._id : null,
        action: actionOverride || subscription.purchaseType,
        tenantKey: subscription.tenantKey,
        details: { moderatorId, paymentDetails: paymentRecord ? paymentRecord.metadata : {} }
    });
};

/**
 * Feature Entitlement Resolution
 */
const getEntitlements = async (vendorId) => {
    const subscription = await Subscription.findOne({ vendorId, status: 'ACTIVE', isDeleted: false })
        .populate({ 
            path: 'planId', 
            model: 'Plan', 
            foreignField: 'id', 
            populate: { path: 'features', model: 'Feature', foreignField: 'id', select: 'id name code' } 
        });

    if (!subscription) return { hasActivePlan: false, features: [], limits: {} };

    const plan = subscription.planId;
    return {
        hasActivePlan: true,
        planName: plan.name,
        expiryDate: subscription.endDate,
        features: plan.features.map(f => ({ id: f.id, name: f.name, code: f.code })),
        limits: plan.limits || {}
    };
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
    verifySubscriptionPayment,
    activateSubscription,
    manualAssignPlan,
    getEntitlements,
    getSubscriptions,
    getActiveSubscription,
    getSubscriptionHistory,
};
