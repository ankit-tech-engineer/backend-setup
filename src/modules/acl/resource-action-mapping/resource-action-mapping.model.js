const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');
const { STATUS } = require('../../../constants/enums');

const resourceActionMappingSchema = new mongoose.Schema(
  {
    id:          { type: Number, unique: true },
    resourceId:  { type: Number, ref: 'Resource', required: true, unique: true },
    actions:     [{ type: Number, ref: 'Action' }],
    status:      { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
    isDeleted:   { type: Boolean, default: false },
  },
  { timestamps: true, id: false }
);

resourceActionMappingSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.id = await Counter.getNextId('resource_action_mappings');
  }
  next();
});

module.exports = mongoose.model('ResourceActionMapping', resourceActionMappingSchema);
