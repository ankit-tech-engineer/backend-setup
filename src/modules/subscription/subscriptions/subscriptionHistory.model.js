const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');

const subscriptionHistorySchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true },
        subscriptionId: { type: Number, ref: 'Subscription', required: true },
        parentSubscriptionId: { type: Number, ref: 'Subscription', default: null },
        vendorId: { type: Number, ref: 'Vendor', required: true },
        oldPlanId: { type: Number, ref: 'Plan', default: null },
        newPlanId: { type: Number, ref: 'Plan', required: true },
        oldStartDate: { type: Date, default: null },
        oldEndDate: { type: Date, default: null },
        newStartDate: { type: Date, required: true },
        newEndDate: { type: Date, required: true },
        oldAmount: { type: Number, default: 0 },
        newAmount: { type: Number, default: 0 },
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
        action: { 
            type: String, 
            enum: ['PURCHASE', 'RENEW', 'UPGRADE', 'CANCEL', 'MANUAL_ASSIGN'], 
            required: true 
        },
        tenantKey: { type: String, required: true, index: true },
        transactionDate: { type: Date, default: Date.now },
        details: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true, id: false }
);

subscriptionHistorySchema.pre('validate', async function (next) {
    if (this.isNew && !this.id) {
        this.id = await Counter.getNextId('subscription_history');
    }
    next();
});

module.exports = mongoose.model('SubscriptionHistory', subscriptionHistorySchema);
