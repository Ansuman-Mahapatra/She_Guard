const mongoose = require('mongoose');

const permissionsSchema = new mongoose.Schema({
  viewLiveLocation: { type: Boolean, default: true },
  viewEmergencies: { type: Boolean, default: true },
  receiveAlerts: { type: Boolean, default: true },
  viewEvidence: { type: Boolean, default: true },
  markResolved: { type: Boolean, default: true },
  viewHistory: { type: Boolean, default: true },
  addOtherGuardians: { type: Boolean, default: false },
  modifySettings: { type: Boolean, default: false },
}, { _id: false });

const notificationPrefsSchema = new mongoose.Schema({
  sosAlerts: { type: Boolean, default: true },
  checkInMissed: { type: Boolean, default: true },
  lowBattery: { type: Boolean, default: true },
  noNetwork: { type: Boolean, default: true },
  zoneAlerts: { type: Boolean, default: false },
}, { _id: false });

const guardianRelationshipSchema = new mongoose.Schema({
  victimUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  guardianUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relationship: { type: String, required: true },
  isPrimary: { type: Boolean, default: false },
  linkedAt: { type: Date, default: Date.now },
  linkedBy: { type: String, enum: ['code', 'invitation', 'qr-scan'], default: 'code' },
  permissions: { type: permissionsSchema, default: () => ({}) },
  notificationPreferences: { type: notificationPrefsSchema, default: () => ({}) },
  status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
  blockedAt: Date,
  blockedReason: String,
}, { timestamps: true });

guardianRelationshipSchema.index({ victimUserId: 1 });
guardianRelationshipSchema.index({ guardianUserId: 1 });
guardianRelationshipSchema.index({ victimUserId: 1, guardianUserId: 1 }, { unique: true });

module.exports = mongoose.model('GuardianRelationship', guardianRelationshipSchema);
