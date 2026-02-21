const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  action: String,
  timestamp: { type: Date, default: Date.now },
  details: String,
}, { _id: false });

const guardianActivitySchema = new mongoose.Schema({
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency', required: true },
  guardianUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  guardianName: { type: String },
  joinedAt: { type: Date, default: Date.now },
  leftAt: Date,
  duration: Number,
  actionsTaken: [actionSchema],
  lastSeenAt: { type: Date, default: Date.now },
  isCurrentlyViewing: { type: Boolean, default: true },
}, { timestamps: true });

guardianActivitySchema.index({ emergencyId: 1 });
guardianActivitySchema.index({ guardianUserId: 1 });

module.exports = mongoose.model('GuardianActivity', guardianActivitySchema);
