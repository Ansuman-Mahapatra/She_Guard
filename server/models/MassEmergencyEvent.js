const mongoose = require('mongoose');

const massEmergencyEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  eventType: {
    type: String,
    enum: ['multiple-sos', 'riot', 'disaster', 'accident'],
    default: 'multiple-sos',
  },
  location: {
    lat: Number,
    lng: Number,
    address: String,
    radius: Number,
  },
  emergencyIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' }],
  affectedVictims: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'resolved', 'ongoing'], default: 'active' },
  triggeredAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  unitsDispatched: [String],
  coordinatingOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  responseNotes: String,
}, { timestamps: true });

massEmergencyEventSchema.index({ eventId: 1 });
massEmergencyEventSchema.index({ status: 1 });

module.exports = mongoose.model('MassEmergencyEvent', massEmergencyEventSchema);
