const express = require('express');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/user/profile
router.get('/profile', requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    _id: u._id,
    name: u.name,
    phone: u.phone,
    email: u.email,
    role: u.role,
    age: u.age,
    bloodGroup: u.bloodGroup,
    medicalConditions: u.medicalConditions,
    emergencyContacts: u.emergencyContacts,
    guardians: u.guardians,
    protectedMembers: u.protectedMembers,
    alertMode: u.alertMode,
    checkInEnabled: u.checkInEnabled,
    autoRecordingEnabled: u.autoRecordingEnabled,
    notificationPreferences: u.notificationPreferences,
  });
});

// PUT /api/user/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const allowed = ['name', 'email', 'age', 'bloodGroup', 'medicalConditions', 'emergencyContacts', 'autoRecordingEnabled', 'notificationPreferences'];
    for (const k of allowed) {
      if (req.body[k] !== undefined) req.user[k] = req.body[k];
    }
    await req.user.save();
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/user/alert-mode
router.post('/alert-mode', requireAuth, requireRole('victim'), async (req, res) => {
  try {
    const { mode, location, expectedDuration } = req.body;
    if (!mode || !['active', 'inactive'].includes(mode)) {
      return res.status(400).json({ message: 'mode must be active or inactive' });
    }
    req.user.alertMode = mode;
    await req.user.save();
    res.json({ alertMode: req.user.alertMode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/user/guardians
router.get('/guardians', requireAuth, requireRole('victim'), (req, res) => {
  res.json(req.user.guardians || []);
});

// POST /api/user/guardians - stub; actual linking via guardian routes
router.post('/guardians', requireAuth, requireRole('victim'), (req, res) => {
  res.status(400).json({ message: 'Use guardian link-by-code or invite to add guardians' });
});

// POST /api/user/fcm-token
router.post('/fcm-token', requireAuth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token required' });
    req.user.fcmToken = token;
    await req.user.save();
    res.json({ message: 'FCM token registered updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
