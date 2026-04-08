const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');

const couponUsageSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true },
        vendorId: { type: Number, ref: 'Vendor', required: true },
        couponId: { type: Number, ref: 'Coupon', required: true },
        subscriptionId: { type: Number, ref: 'Subscription' },
        discountAmount: { type: Number, required: true },
        usedAt: { type: Date, default: Date.now },
        tenantKey: { type: String, required: true },
    },
    { timestamps: true, id: false }
);

couponUsageSchema.pre('validate', async function (next) {
    if (this.isNew && !this.id) {
        this.id = await Counter.getNextId('coupon_usage');
    }
    next();
});

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
