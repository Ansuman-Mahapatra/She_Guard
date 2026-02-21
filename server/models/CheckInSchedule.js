const mongoose = require('mongoose');

const checkInScheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  checkInInterval: { type: Number, default: 3600000 }, // 1 hour ms
  nextCheckInAt: { type: Date, required: true },
  graceperiod: { type: Number, default: 300000 }, // 5 min ms
  missedCheckIns: { type: Number, default: 0 },
  lastCheckInAt: Date,
  deactivatedAt: Date,
}, { timestamps: true });

checkInScheduleSchema.index({ userId: 1 });
checkInScheduleSchema.index({ nextCheckInAt: 1, isActive: 1 });

module.exports = mongoose.model('CheckInSchedule', checkInScheduleSchema);
