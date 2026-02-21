const mongoose = require('mongoose');

const statusUpdateSchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now },
  location: { lat: Number, lng: Number },
  notes: String,
}, { _id: false });

const dispatchSchema = new mongoose.Schema({
  dispatchId: { type: String, required: true },
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency', required: true },
  unitId: { type: String, required: true },
  unitOfficers: [String],
  dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dispatchedByName: String,
  dispatchedAt: { type: Date, default: Date.now },
  priority: { type: String, enum: ['urgent', 'routine'], default: 'urgent' },
  instructions: String,
  status: {
    type: String,
    enum: ['dispatched', 'en-route', 'arrived', 'completed'],
    default: 'dispatched',
  },
  statusUpdates: [statusUpdateSchema],
  estimatedArrival: Date,
  actualArrival: Date,
  arrivalDelay: Number,
  completedAt: Date,
  completionNotes: String,
}, { timestamps: true });

dispatchSchema.index({ emergencyId: 1 });
dispatchSchema.index({ dispatchId: 1 }, { unique: true });

module.exports = mongoose.model('Dispatch', dispatchSchema);
