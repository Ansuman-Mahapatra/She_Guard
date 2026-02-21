const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const EmergencySession = require('../models/EmergencySession');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname || 'file'}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function getCloudinaryConfig() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_API_SECRET } = config;
  if (!CLOUDINARY_CLOUD_NAME) return null;
  return { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_API_SECRET };
}

/**
 * POST /upload/cloudinary
 * Body: multipart form with 'image' file.
 * Optional: sessionId — attach returned URL to session.mediaUrls.
 * Returns: { url } or { uploadUrl, preset } for client-side upload.
 */
router.post('/cloudinary', upload.single('image'), async (req, res) => {
  try {
    const cloud = getCloudinaryConfig();
    if (!cloud) {
      return res.status(503).json({ message: 'Cloudinary not configured' });
    }
    if (!config.CLOUDINARY_API_SECRET && !cloud.CLOUDINARY_UPLOAD_PRESET) {
      return res.status(503).json({ message: 'Set CLOUDINARY_API_SECRET or use client upload with preset' });
    }
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: cloud.CLOUDINARY_CLOUD_NAME,
      api_key: config.CLOUDINARY_API_KEY || undefined,
      api_secret: cloud.CLOUDINARY_API_SECRET,
    });
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No image file' });
    }
    const result = await cloudinary.uploader.upload(file.path, {
      upload_preset: cloud.CLOUDINARY_UPLOAD_PRESET || undefined,
    });
    fs.unlink(file.path, () => {});
    const url = result.secure_url;
    const sessionId = req.body.sessionId;
    if (sessionId) {
      const session = await EmergencySession.findOne({ sessionId });
      if (session) {
        session.mediaUrls = session.mediaUrls || [];
        session.mediaUrls.push(url);
        session.timelineEvents.push({ event: 'Photo evidence uploaded' });
        await session.save();
      }
    }
    console.log('[upload] Cloudinary OK:', url);
    res.json({ url, sessionId: sessionId || null });
  } catch (err) {
    console.error('[upload] Error:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

/**
 * GET /upload/config
 * Returns Cloudinary config for client-side upload (preset + cloud_name only; no secret).
 */
router.get('/config', (req, res) => {
  const cloud = getCloudinaryConfig();
  if (!cloud) {
    return res.json({ enabled: false });
  }
  res.json({
    enabled: true,
    cloudName: cloud.CLOUDINARY_CLOUD_NAME,
    uploadPreset: cloud.CLOUDINARY_UPLOAD_PRESET || '',
    uploadUrl: config.UPLOAD_API_URL || `https://api.cloudinary.com/v1_1/${cloud.CLOUDINARY_CLOUD_NAME}/image/upload`,
  });
});

module.exports = router;
