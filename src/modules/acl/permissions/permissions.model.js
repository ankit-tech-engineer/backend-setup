const mongoose = require('mongoose');
const Counter = require('../../../core/models/counter.model');
const { STATUS } = require('../../../constants/enums');

const permissionEntrySchema = new mongoose.Schema({
  resource: { type: String, required: true, trim: true, lowercase: true },
  action:   { type: [String], default: [] }
}, { _id: false });

const permissionSchema = new mongoose.Schema(
  {
    id:          { type: Number, unique: true },
    roleId:      { type: Number, ref: 'Role', required: true },
    permissions: [permissionEntrySchema],
    tenantKey: { type: String, index: true },
    status:      { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
    isDeleted:   { type: Boolean, default: false },
  },
  { timestamps: true, id: false }
);

permissionSchema.pre('save', async function (next) {
  if (this.isNew) this.id = await Counter.getNextId('permissions');
  next();
});

permissionSchema.index({ roleId: 1, tenantKey: 1 }, { unique: true });

module.exports = mongoose.model('Permission', permissionSchema);
