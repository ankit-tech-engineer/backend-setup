const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');

const subscriptionSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true },
        subscriptionCode: { type: String, unique: true },
        vendorId: { type: Number, ref: 'Vendor', required: true },
        planId: { type: Number, ref: 'Plan', required: true },
        parentSubscriptionId: { type: Number, ref: 'Subscription', default: null },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        purchaseType: { 
            type: String, 
            enum: ['PURCHASE', 'RENEW', 'UPGRADE', 'MANUAL_ASSIGN'], 
            required: true 
        },
        status: { 
            type: String, 
            enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'UPGRADED', 'CANCELLED', 'FAILED'], 
            default: 'PENDING' 
        },
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
        paymentStatus: { 
            type: String, 
            enum: ['PENDING', 'SUCCESS', 'FAILED', 'NOT_REQUIRED'], 
            default: 'PENDING' 
        },
        baseAmount: { type: Number, required: true },
        finalAmount: { type: Number, required: true },
        discountAmount: { type: Number, default: 0 },
        couponId: { type: Number, ref: 'Coupon' },
        autoRenew: { type: Boolean, default: false },
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
