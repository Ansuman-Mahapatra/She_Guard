const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const locationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  speed: Number,
  direction: Number,
  audioLevel: Number,
  timestamp: Date
}, { _id: false });

const timelineEventSchema = new mongoose.Schema({
  event: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const emergencySessionSchema = new mongoose.Schema({
  sessionId: { type: String, default: () => uuidv4() },
  victimName: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'RESOLVED'], default: 'ACTIVE' },
  contextType: {
    type: String,
    enum: ['physical_attack', 'forced_vehicle', 'medical', 'unsafe', 'unsure']
  },
  riskScore: { type: Number, default: 30 },
  riskLevel: { type: String, enum: ['MODERATE', 'HIGH', 'CRITICAL'], default: 'MODERATE' },
  tamperDetected: { type: Boolean, default: false },
  locations: [locationSchema],
  timelineEvents: [timelineEventSchema],
  mediaUrls: [String],
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date }
});

const EmergencySession = mongoose.model('EmergencySession', emergencySessionSchema);
module.exports = EmergencySession;
