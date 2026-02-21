const mongoose = require('mongoose');

const userStatusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  lastHeartbeat: { type: Date, default: Date.now },
  missedHeartbeats: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: true },
  currentLocation: {
    lat: Number,
    lng: Number,
    address: String,
    updatedAt: Date,
  },
  batteryLevel: Number,
  batteryStatus: { type: String, enum: ['discharging', 'charging'] },
  batteryTrend: { type: String, enum: ['declining', 'stable', 'charging'] },
  networkType: String,
  signalStrength: Number,
  alertMode: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  hasActiveEmergency: { type: Boolean, default: false },
  lastEmergencyAt: Date,
  checkInStatus: { type: String, enum: ['current', 'missed'], default: 'current' },
}, { timestamps: true });

userStatusSchema.index({ userId: 1 });

module.exports = mongoose.model('UserStatus', userStatusSchema);
