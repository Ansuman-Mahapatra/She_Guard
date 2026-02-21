const mongoose = require('mongoose');

const noNetworkAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enteredNoNetworkAt: { type: Date, required: true },
  lastKnownLocation: {
    lat: Number,
    lng: Number,
    address: String,
  },
  batteryLevel: Number,
  networkStatus: { type: String, default: 'offline' },
  reconnectedAt: Date,
  reconnectionLocation: { lat: Number, lng: Number },
  offlineDuration: Number,
  autoEmergencyTriggered: { type: Boolean, default: false },
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
  alertLevel: { type: String, enum: ['warning', 'critical'], default: 'warning' },
  queuedLocations: { type: Number, default: 0 },
  queuedEvidence: { audio: Number, photo: Number },
  resolvedAt: Date,
}, { timestamps: true });

noNetworkAlertSchema.index({ userId: 1 });
noNetworkAlertSchema.index({ reconnectedAt: 1 });

module.exports = mongoose.model('NoNetworkAlert', noNetworkAlertSchema);
