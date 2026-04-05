const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');
const { STATUS } = require('../../../constants/enums');

const couponSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true },
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        type: { type: String, enum: ['FIXED', 'PERCENTAGE'], required: true },
        value: { type: Number, required: true, min: 0 },
        minPurchase: { type: Number, default: 0 },
        maxDiscount: { type: Number },
        expiryDate: { type: Date, required: true },
        usageLimit: { type: Number, default: 1 },
        usedCount: { type: Number, default: 0 },
        status: { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, id: false }
);

couponSchema.pre('validate', async function (next) {
    if (this.isNew && !this.id) {
        this.id = await Counter.getNextId('subscription_coupons');
    }
    next();
});

module.exports = mongoose.model('Coupon', couponSchema);
