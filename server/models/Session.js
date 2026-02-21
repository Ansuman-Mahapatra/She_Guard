const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceId: { type: String, required: true },
  deviceName: { type: String, default: 'Unknown Device' },
  deviceOS: { type: String, default: '' },
  appVersion: { type: String, default: '' },
  loginAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  ipAddress: { type: String, default: '' },
  fcmToken: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Non-unique: same user can have one active session per device (multiple devices allowed)
sessionSchema.index({ userId: 1, deviceId: 1 });
sessionSchema.index({ expiresAt: 1 });
sessionSchema.index({ lastActiveAt: 1 });

module.exports = mongoose.model('Session', sessionSchema);
