const mongoose = require('mongoose');
const Counter = require('../../core/models/counter.model');
const { STATUS } = require('../../constants/enums');

const vendorTypeSchema = new mongoose.Schema(
    {
        id: { type: Number, unique: true },
        name: { type: String, required: true, trim: true },
        key: { type: String, required: true, unique: true, index: true },
        status: { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true, id: false }
);

vendorTypeSchema.pre('validate', async function (next) {
    if (this.isNew) {
        if (!this.id) {
            this.id = await Counter.getNextId('vendor-types');
        }
        if (!this.key && this.name) {
            this.key = this.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
        }
    }
    next();
});

module.exports = mongoose.model('VendorType', vendorTypeSchema);
