const express = require('express');
const CheckInSchedule = require('../models/CheckInSchedule');
const CheckInRequest = require('../models/CheckInRequest');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/check-in/respond
router.post('/respond', requireAuth, requireRole('victim'), async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 'safe') {
      return res.status(400).json({ message: 'status must be safe' });
    }
    const pending = await CheckInRequest.findOne({
      userId: req.user._id,
      status: 'pending',
      mustRespondBy: { $gt: new Date() },
    }).sort({ requestedAt: -1 });
    if (!pending) {
      return res.status(404).json({ message: 'No pending check-in request' });
    }
    pending.status = 'responded';
    pending.respondedAt = new Date();
    pending.response = 'safe';
    await pending.save();
    const schedule = await CheckInSchedule.findById(pending.scheduleId);
    if (schedule) {
      schedule.nextCheckInAt = new Date(Date.now() + schedule.checkInInterval);
      schedule.missedCheckIns = 0;
      schedule.lastCheckInAt = new Date();
      await schedule.save();
    }
    res.json({ message: 'Check-in received. Next check-in in 1 hour.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/check-in/status
router.get('/status', requireAuth, requireRole('victim'), async (req, res) => {
  try {
    const schedule = await CheckInSchedule.findOne({
      userId: req.user._id,
      isActive: true,
    }).lean();
    if (!schedule) {
      return res.json({ active: false });
    }
    res.json({
      active: true,
      nextCheckInAt: schedule.nextCheckInAt,
      lastCheckInAt: schedule.lastCheckInAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
