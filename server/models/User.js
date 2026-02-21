const mongoose = require('mongoose');

const guardianRefSchema = new mongoose.Schema({
  guardianUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guardianName: { type: String },
  guardianEmail: { type: String },
  guardianPhone: { type: String },
  relationship: { type: String },
  isPrimary: { type: Boolean, default: false },
  linkedAt: { type: Date, default: Date.now },
}, { _id: false });

const protectedMemberSchema = new mongoose.Schema({
  victimUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  victimName: { type: String },
  relationship: { type: String },
  linkedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String }, // required for victim/guardian
  email: { type: String },
  password: { type: String }, // hashed; required for guardian, optional for victim, required for pcr
  role: { type: String, enum: ['victim', 'guardian', 'pcr'], required: true },

  // Station details (for role = pcr)
  stationId: { type: String }, // unique; used for PCR login
  stationName: { type: String },
  stationAddress: { type: String },
  stationPhone: { type: String },

  // Profile
  age: { type: Number },
  bloodGroup: { type: String },
  medicalConditions: [String],
  emergencyContacts: [{
    name: String,
    phone: String,
    relation: String,
  }],

  // Guardians (if role = victim)
  guardians: [guardianRefSchema],

  // Protected members (if role = guardian)
  protectedMembers: [protectedMemberSchema],

  // Settings
  alertMode: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  checkInEnabled: { type: Boolean, default: false },
  autoRecordingEnabled: { type: Boolean, default: true },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
  },

  // Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: true },
  registeredAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date },
  lastHeartbeatAt: { type: Date },

  // Email verification (required for victim and guardian)
  emailVerified: { type: Boolean, default: false },
  emailVerificationCode: { type: String },
  emailVerificationSentAt: { type: Date },
}, { timestamps: true });

userSchema.index({ phone: 1 }, { sparse: true, unique: true });
userSchema.index({ email: 1 }, { sparse: true, unique: true });
userSchema.index({ stationId: 1 }, { sparse: true, unique: true });

module.exports = mongoose.model('User', userSchema);
