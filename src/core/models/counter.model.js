const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    collectionName: { type: String, required: true, unique: true },
    seq:            { type: Number, default: 0 },
  },
  { timestamps: true }
);

counterSchema.statics.getNextId = async function (collectionName) {
  const counter = await this.findOneAndUpdate(
    { collectionName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
