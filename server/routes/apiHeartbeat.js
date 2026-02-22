const express = require('express');
const UserStatus = require('../models/UserStatus');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/heartbeat
router.post('/', requireAuth, async (req, res) => {
  try {
    const { location, batteryLevel, batteryStatus, networkType, signalStrength, alertMode, checkInStatus } = req.body;
    
    // Save to UserStatus (history/legacy tracking if needed)
    await UserStatus.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          lastHeartbeat: new Date(),
          missedHeartbeats: 0,
          isOnline: true,
          batteryLevel,
          batteryStatus,
          networkType,
          signalStrength,
          alertMode: alertMode || 'inactive',
          checkInStatus: checkInStatus || 'current',
          ...(location && {
            currentLocation: { lat: location.lat, lng: location.lng, address: location.address, updatedAt: new Date() },
          }),
        },
      },
      { upsert: true }
    );

    // Track state in User directly for easy real-time access
    let newStatus = req.user.lastKnownLocation?.status || 'online';
    if (signalStrength === 0) {
      newStatus = 'yellow_alert';
    } else {
      newStatus = 'online';
    }

    req.user.lastHeartbeatAt = new Date();
    req.user.lastKnownLocation = {
      lat: location?.lat || req.user.lastKnownLocation?.lat,
      lng: location?.lng || req.user.lastKnownLocation?.lng,
      battery: batteryLevel,
      signalStrength: signalStrength,
      status: newStatus,
      updatedAt: new Date()
    };
    await req.user.save();

    // If signal strength drops to 0, trigger Yellow Alert to Guardians
    if (signalStrength === 0) {
      console.log(`[heartbeat] Yellow Alert: Signal lost for victim ${req.user.name}`);
      const guardians = req.user.guardians || [];
      const guardianTokenIds = guardians.map(g => g.guardianUserId);
      
      const User = require('../models/User');
      const guardianUsers = await User.find({ _id: { $in: guardianTokenIds }, fcmToken: { $exists: true } });
      
      const { sendToDevice } = require('../services/fcm');
      for (const guardian of guardianUsers) {
        if (guardian.fcmToken) {
          sendToDevice(guardian.fcmToken, {
            title: '⚠️ Yellow Alert: Signal Lost',
            body: `${req.user.name}'s phone signal just dropped to zero. Last known location is being tracked.`,
          }, { type: 'yellow_alert', victimId: req.user._id.toString() });
        }
      }
    }

    res.json({ ok: true, status: newStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
