const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  evidenceId: { type: String, required: true },
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  fileType: {
    type: String,
    enum: ['audio-chunk', 'photo', 'video', 'audio-complete'],
    required: true,
  },
  fileName: String,
  gridFSFileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
  fileSize: Number,

  duration: Number,
  codec: String,
  bitrate: String,
  sampleRate: String,
  resolution: String,

  isCompressed: { type: Boolean, default: false },
  originalSize: Number,
  compressionRatio: String,

  capturedAt: { type: Date, default: Date.now },
  uploadedAt: { type: Date, default: Date.now },
  location: { lat: Number, lng: Number },
  chunkNumber: Number,

  uploadComplete: { type: Boolean, default: true },
  processingStatus: { type: String, enum: ['pending', 'complete', 'stitching'], default: 'complete' },
}, { timestamps: true });

evidenceSchema.index({ emergencyId: 1, fileType: 1 });
evidenceSchema.index({ gridFSFileId: 1 });

module.exports = mongoose.model('Evidence', evidenceSchema);
