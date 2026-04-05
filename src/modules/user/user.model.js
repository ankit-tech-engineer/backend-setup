const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('../../core/models/counter.model');
const { STATUS } = require('../../constants/enums');

const userSchema = new mongoose.Schema(
  {
    id:          { type: Number, unique: true },
    name:        { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:    { type: String, minlength: 6, select: false }, // Nullable initially
    roles:       [{ type: Number, ref: 'Role' }],
    tenantKey: { type: String, index: true }, // Null for super admin
    vendorId:    { type: Number, ref: 'Vendor' },
    isVerified:  { type: Boolean, default: false },
    isActive:    { type: Boolean, default: false },
    otp:         { type: String },
    otp_expiry:  { type: Date },
    status:      { type: String, enum: Object.values(STATUS), default: STATUS.ACTIVE },
    isDeleted:   { type: Boolean, default: false },
  },
  { 
    timestamps: true, 
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.virtual('roleDetails', {
  ref: 'Role',
  localField: 'roles',
  foreignField: 'id',
});

userSchema.pre('save', async function (next) {
  if (this.isNew) this.id = await Counter.getNextId('users');
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
