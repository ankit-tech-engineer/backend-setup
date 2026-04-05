const mongoose = require('mongoose');
const Counter = require('../../core/models/counter.model');

const paymentSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { 
      type: String, 
      enum: ['PENDING', 'SUCCESS', 'FAILED'], 
      default: 'PENDING' 
    },
    vendorId: { type: Number, ref: 'Vendor', required: true },
    tenantKey: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }, // e.g., { type: 'subscription', planId: 1 }
  },
  { timestamps: true, id: false }
);

paymentSchema.pre('validate', async function (next) {
  if (this.isNew && !this.id) {
    this.id = await Counter.getNextId('payments');
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
