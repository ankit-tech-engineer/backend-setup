const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');
const { STATUS } = require('../../../constants/enums');

const resourceSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true, unique: true, lowercase: true },
    status: { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, id: false }
);

resourceSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.id = await Counter.getNextId('resources');
    if (!this.key) {
      this.key = this.name.toLowerCase().trim().replace(/\s+/g, '_');
    }
  }
  next();
});

module.exports = mongoose.model('Resource', resourceSchema);
