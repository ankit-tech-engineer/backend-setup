const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');
const { STATUS } = require('../../../constants/enums');

const moduleResourceMappingSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    module_name: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true, unique: true, lowercase: true },
    resources: [{ type: Number, ref: 'Resource' }],
    status: { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, id: false }
);

moduleResourceMappingSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.id = await Counter.getNextId('module_resource_mappings');
    if (!this.key) {
      this.key = this.module_name.toLowerCase().trim().replace(/\s+/g, '_');
    }
  }
  next();
});

module.exports = mongoose.model('ModuleResourceMapping', moduleResourceMappingSchema);
