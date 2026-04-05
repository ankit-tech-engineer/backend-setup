const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');

const subscriptionSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true },
        vendorId: { type: Number, ref: 'Vendor', required: true },
        planId: { type: Number, ref: 'Plan', required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: { 
            type: String, 
            enum: ['ACTIVE', 'EXPIRED', 'UPGRADED', 'CANCELLED'], 
            default: 'ACTIVE' 
        },
        amountPaid: { type: Number, required: true, min: 0 },
        couponId: { type: Number, ref: 'Coupon' },
        discountAmount: { type: Number, default: 0 },
        tenantKey: { type: String, required: true, index: true },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, id: false }
);

subscriptionSchema.pre('validate', async function (next) {
    if (this.isNew && !this.id) {
        this.id = await Counter.getNextId('subscriptions');
    }
    next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
