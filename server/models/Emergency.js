const mongoose = require('mongoose');

const triggerLocationSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  address: String,
  accuracy: Number,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const lastKnownLocationSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  address: String,
  accuracy: Number,
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const emergencySchema = new mongoose.Schema({
  emergencyId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  emergencyType: {
    type: String,
    enum: ['Assault', 'Harassment', 'Stalking', 'Medical', 'Missed Check-In', 'No Network Zone SOS', 'Manual'],
    default: 'Manual',
  },
  status: { type: String, enum: ['Active', 'Resolved', 'False Alarm'], default: 'Active' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'high' },

  triggeredAt: { type: Date, default: Date.now },
  triggerMethod: { type: String, enum: ['manual', 'auto-check-in', 'power-button-5x', 'static-location'], default: 'manual' },
  autoActivated: { type: Boolean, default: false },

  triggerLocation: triggerLocationSchema,
  lastKnownLocation: lastKnownLocationSchema,
  totalDistance: { type: Number, default: 0 },

  isTrackingActive: { type: Boolean, default: true },
  audioRecordingActive: { type: Boolean, default: true },
  evidenceCount: { type: Number, default: 0 },
  batteryLevel: Number,
  networkStatus: { type: String, enum: ['online', 'offline', 'weak'], default: 'online' },

  noNetworkZone: { type: Boolean, default: false },
  highPriority: { type: Boolean, default: false },
  enteredNoNetworkAt: Date,
  lastContactAt: Date,
  networkQuality: String,
  expectedIntermittentConnection: { type: Boolean, default: false },

  guardianEmails: [String],
  guardianPhones: [String],
  guardiansViewing: { type: Number, default: 0 },

  policeNotified: { type: Boolean, default: false },
  policeNotifiedAt: Date,
  policeUnitAssigned: String,
  policeDispatchedAt: Date,
  policeArrivedAt: Date,

  resolvedAt: Date,
  resolvedBy: String,
  resolutionMethod: String,
  resolutionNotes: String,
}, { timestamps: true });

emergencySchema.index({ userId: 1, status: 1 });
emergencySchema.index({ status: 1, createdAt: -1 });
emergencySchema.index({ triggeredAt: -1 });

module.exports = mongoose.model('Emergency', emergencySchema);
