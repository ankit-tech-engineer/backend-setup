const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');
const { STATUS } = require('../../../constants/enums');

const planSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        price: { type: Number, required: true, min: 0 },
        validityDays: { type: Number, required: true, min: 1 },
        features: [{ type: Number, ref: 'Feature', required: true }],
        limits: { type: mongoose.Schema.Types.Mixed, default: {} },
        isTrial: { type: Boolean, default: false },
        status: { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, id: false }
);

planSchema.pre('validate', async function (next) {
    if (this.isNew && !this.id) {
        this.id = await Counter.getNextId('subscription_plans');
    }
    next();
});

module.exports = mongoose.model('Plan', planSchema);
