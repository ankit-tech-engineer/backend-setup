const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');
const { STATUS } = require('../../../constants/enums');

const roleSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true, lowercase: true },
    tenantKey: { type: String, index: true },
    status: { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, id: false }
);

roleSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.id = await Counter.getNextId('roles');
    if (!this.key) {
      this.key = this.name.toLowerCase().trim().replace(/\s+/g, '_');
    }
  }
  next();
});

roleSchema.index({ key: 1, tenantKey: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);
