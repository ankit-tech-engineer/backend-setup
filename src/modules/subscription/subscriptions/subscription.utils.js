const Vendor = require('../../vendor/vendor.model');
const Plan = require('../plans/plan.model');
const Subscription = require('./subscription.model');
const AppError = require('../../../core/error/AppError');
const httpStatus = require('../../../constants/httpStatus');

/**
 * checkFeatureLimit(tenantKey, limitKey)
 * Retrieves the numeric limit for a specific feature for a given tenant.
 * Accounts for Trial Plans and Active Subscriptions.
 */
const getFeatureLimit = async (tenantKey, limitKey) => {
    // 1. Fetch vendor to check trial status
    const vendor = await Vendor.findOne({ tenantKey, isDeleted: false });
    if (!vendor) return null; // Or throw error if you prefer

    let activePlanId = null;

    if (vendor.onTrial) {
        // 2. If on trial, find the designated trial plan
        const trialPlan = await Plan.findOne({ isTrial: true, status: 'active', isDeleted: false });
        if (trialPlan) {
            activePlanId = trialPlan.id;
        }
    } else if (vendor.currentSubscriptionId) {
        // 3. If not on trial, get the plan from the active subscription
        const subscription = await Subscription.findOne({ 
            id: vendor.currentSubscriptionId, 
            status: 'ACTIVE', 
            isDeleted: false 
        });
        if (subscription) {
            activePlanId = subscription.planId;
        }
    }

    if (!activePlanId) return null;

    // 4. Fetch the plan and its limits
    const plan = await Plan.findOne({ id: activePlanId, isDeleted: false });
    if (!plan || !plan.limits) return null;

    return plan.limits[limitKey] || null;
};

/**
 * validateQuota(tenantKey, limitKey, currentCount)
 * Throws a 403 error if the current count meets or exceeds the plan limit.
 */
const validateQuota = async (tenantKey, limitKey, currentCount) => {
    const limit = await getFeatureLimit(tenantKey, limitKey);
    
    // If no limit is defined, assume unlimited (or handle as restricted based on policy)
    if (limit === null) return true; 

    if (currentCount >= limit) {
        throw new AppError(
            `Quota exceeded: Your current plan allows a maximum of ${limit} for '${limitKey}'. Please upgrade your plan.`,
            httpStatus.FORBIDDEN
        );
    }

    return true;
};

module.exports = {
    getFeatureLimit,
    validateQuota,
};
