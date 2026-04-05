const mongoose = require('mongoose');
const Counter = require('../../core/models/counter.model');
const { STATUS } = require('../../constants/enums');

const vendorSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true },
        name: { type: String, required: true, trim: true },
        tenantKey: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        isLoginActivate: { type: Boolean, default: false },
        onTrial: { type: Boolean, default: false },
        isPlanActivate: { type: Boolean, default: false },
        vendorType: { type: Number, ref: 'VendorType' },
        userId: { type: Number, ref: 'User' },
        currentSubscriptionId: { type: Number, ref: 'Subscription' },
        status: { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, id: false }
);

vendorSchema.pre('save', async function (next) {
    if (this.isNew) this.id = await Counter.getNextId('vendors');
    next();
});

module.exports = mongoose.model('Vendor', vendorSchema);
