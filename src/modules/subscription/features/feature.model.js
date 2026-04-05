const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');
const { STATUS } = require('../../../constants/enums');

const featureSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true },
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, unique: true, uppercase: true, trim: true },
        description: { type: String, trim: true },
        status: { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, id: false }
);

featureSchema.pre('validate', async function (next) {
    if (this.isNew && !this.id) {
        this.id = await Counter.getNextId('subscription_features');
    }
    next();
});

module.exports = mongoose.model('Feature', featureSchema);
