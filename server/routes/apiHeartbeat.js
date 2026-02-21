const express = require('express');
const UserStatus = require('../models/UserStatus');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/heartbeat
router.post('/', requireAuth, async (req, res) => {
  try {
    const { location, batteryLevel, batteryStatus, networkType, signalStrength, appVersion, deviceOS, alertMode, checkInStatus } = req.body;
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
            currentLocation: {
              lat: location.lat,
              lng: location.lng,
              address: location.address,
              updatedAt: new Date(),
            },
          }),
        },
      },
      { upsert: true }
    );
    await req.user.updateOne({ lastHeartbeatAt: new Date() }).catch(() => {});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
