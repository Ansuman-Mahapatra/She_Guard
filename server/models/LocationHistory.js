const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema({
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },

  accuracy: Number,
  speed: Number,
  heading: Number,
  altitude: Number,
  batteryLevel: Number,
  networkType: String,
  signalStrength: Number,
  provider: { type: String, enum: ['gps', 'network', 'fused'], default: 'gps' },

  timestamp: { type: Date, required: true },
  receivedAt: { type: Date, default: Date.now },
}, { timestamps: true });

locationHistorySchema.index({ emergencyId: 1, timestamp: -1 });
locationHistorySchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('LocationHistory', locationHistorySchema);
