const mongoose = require('mongoose');

const checkInRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CheckInSchedule', required: true },
  requestedAt: { type: Date, default: Date.now },
  mustRespondBy: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'responded', 'missed'], default: 'pending' },
  respondedAt: Date,
  response: String,
  autoEmergencyTriggered: { type: Boolean, default: false },
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
}, { timestamps: true });

checkInRequestSchema.index({ userId: 1 });
checkInRequestSchema.index({ mustRespondBy: 1, status: 1 });

module.exports = mongoose.model('CheckInRequest', checkInRequestSchema);
