const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
  notificationType: { type: String, enum: ['email', 'sms', 'push', 'call'], required: true },
  recipient: { type: String, required: true },
  recipientName: String,
  recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: String,
  bodyPreview: String,
  status: { type: String, enum: ['sent', 'delivered', 'failed', 'pending'], default: 'pending' },
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,
  errorMessage: String,
  retryCount: { type: Number, default: 0 },
  messageId: String,
  provider: String,
}, { timestamps: true });

notificationLogSchema.index({ emergencyId: 1 });
notificationLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
