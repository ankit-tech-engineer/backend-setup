const mongoose = require('mongoose');
const Counter = require('../../core/models/counter.model');

const paymentSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: { type: String },
    razorpayPaymentLinkReferenceId: { type: String },
    razorpayPaymentLinkStatus: { type: String },
    amount: { type: Number, required: true },
    expectedAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { 
      type: String, 
      enum: ['CREATED', 'PENDING', 'SUCCESS', 'FAILED'], 
      default: 'CREATED' 
    },
    paymentFor: {
      type: String,
      enum: ['SUBSCRIPTION_PURCHASE', 'RENEW', 'UPGRADE'],
      required: true
    },
    subscriptionId: { type: Number, ref: 'Subscription' },
    isVerified: { type: Boolean, default: false },
    paidAt: { type: Date },
    vendorId: { type: Number, ref: 'Vendor', required: true },
    tenantKey: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed }, 
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
