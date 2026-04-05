const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');

const subscriptionHistorySchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true },
        subscriptionId: { type: Number, ref: 'Subscription', required: true },
        vendorId: { type: Number, ref: 'Vendor', required: true },
        planId: { type: Number, ref: 'Plan', required: true },
        action: { 
            type: String, 
            enum: ['PURCHASE', 'RENEW', 'UPGRADE', 'CANCEL'], 
            required: true 
        },
        amount: { type: Number, required: true },
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
