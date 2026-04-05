const mongoose = require('mongoose');
const crypto = require('crypto');

const tokenBlacklistSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// MongoDB auto-deletes blacklisted tokens once they expire
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

tokenBlacklistSchema.statics.hash = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
