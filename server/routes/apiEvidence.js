const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const Emergency = require('../models/Emergency');
const Evidence = require('../models/Evidence');
const { requireAuth } = require('../middleware/auth');
const { generateEvidenceId } = require('../utils/idGenerator');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

function getBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'evidence' });
}

// POST /api/evidence/upload-chunk - multipart: file + emergencyId, chunkNumber, capturedAt, duration
router.post('/upload-chunk', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { emergencyId, chunkNumber, capturedAt, duration } = req.body || {};
    if (!emergencyId || chunkNumber == null) {
      return res.status(400).json({ message: 'emergencyId and chunkNumber required' });
    }
    const emergency = await Emergency.findOne({ emergencyId });
    if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
    if (!emergency.userId.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    const evidenceId = generateEvidenceId();
    const bucket = getBucket();
    const filename = `emergency-${emergencyId}-audio-chunk-${chunkNumber}.mp3`;
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { emergencyId: emergency._id.toString(), userId: req.user._id.toString() },
    });
    if (req.file && req.file.buffer) {
      uploadStream.end(req.file.buffer);
    } else {
      uploadStream.end();
    }
    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });
    const ev = new Evidence({
      evidenceId,
      emergencyId: emergency._id,
      userId: req.user._id,
      fileType: 'audio-chunk',
      fileName: filename,
      gridFSFileId: uploadStream.id,
      mimeType: 'audio/mpeg',
      chunkNumber: Number(chunkNumber),
      duration: duration ? Number(duration) : undefined,
      capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
    });
    await ev.save();
    emergency.evidenceCount = (emergency.evidenceCount || 0) + 1;
    await emergency.save();
    res.status(201).json({ evidenceId: ev.evidenceId, status: 'saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/evidence/upload-media - multipart: file + emergencyId, type
router.post('/upload-media', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { emergencyId, type } = req.body || {};
    if (!emergencyId) return res.status(400).json({ message: 'emergencyId required' });
    
    const emergency = await Emergency.findOne({ emergencyId });
    if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
    if (!emergency.userId.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    
    const evidenceId = generateEvidenceId();
    const bucket = getBucket();
    const ext = type === 'photo' ? 'jpg' : 'mp4';
    const filename = `sos-${type}-${Date.now()}.${ext}`;
    
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { emergencyId: emergency._id.toString(), userId: req.user._id.toString(), type },
    });
    
    if (req.file && req.file.buffer) {
      uploadStream.end(req.file.buffer);
    } else {
      uploadStream.end();
    }
    
    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });
    
    const ev = new Evidence({
      evidenceId,
      emergencyId: emergency._id,
      userId: req.user._id,
      fileType: type === 'photo' ? 'photo' : 'video',
      fileName: filename,
      gridFSFileId: uploadStream.id,
      mimeType: type === 'photo' ? 'image/jpeg' : 'video/mp4',
    });
    await ev.save();
    
    emergency.evidenceCount = (emergency.evidenceCount || 0) + 1;
    await emergency.save();
    
    res.status(201).json({ evidenceId: ev.evidenceId, status: 'saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/evidence/list/:emergencyId
router.get('/list/:emergencyId', requireAuth, async (req, res) => {
  try {
    const emergency = await Emergency.findOne({ emergencyId: req.params.emergencyId });
    if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
    if (!emergency.userId.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    const list = await Evidence.find({ emergencyId: emergency._id }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
