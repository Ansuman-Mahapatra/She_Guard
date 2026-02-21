const express = require('express');
const Emergency = require('../models/Emergency');
const LocationHistory = require('../models/LocationHistory');
const { requireAuth } = require('../middleware/auth');

function apiLocationRoutes(io) {
  const router = express.Router();

  // POST /api/location/batch-update
  router.post('/batch-update', requireAuth, async (req, res) => {
    try {
      const { emergencyId, locations } = req.body;
      if (!emergencyId || !Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({ message: 'emergencyId and locations array required' });
      }
      const emergency = await Emergency.findOne({ emergencyId });
      if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
      if (!emergency.userId.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
      const docs = locations.map((loc) => {
        const lat = loc.lat ?? loc.latitude;
        const lng = loc.lng ?? loc.longitude;
        return {
          emergencyId: emergency._id,
          userId: req.user._id,
          coordinates: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          accuracy: loc.accuracy,
          speed: loc.speed,
          heading: loc.heading,
          batteryLevel: loc.batteryLevel,
          timestamp: loc.timestamp ? new Date(loc.timestamp) : new Date(),
        };
      });
      await LocationHistory.insertMany(docs);
      const last = locations[locations.length - 1];
      const lat = last.lat ?? last.latitude;
      const lng = last.lng ?? last.longitude;
      emergency.lastKnownLocation = {
        latitude: lat != null ? Number(lat) : undefined,
        longitude: lng != null ? Number(lng) : undefined,
        address: last.address,
        accuracy: last.accuracy,
        updatedAt: new Date(),
      };
      await emergency.save();
      io.emit('session_update', emergency);
      res.json({ received: locations.length });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET /api/location/history/:emergencyId
  router.get('/history/:emergencyId', requireAuth, async (req, res) => {
    try {
      const emergency = await Emergency.findOne({ emergencyId: req.params.emergencyId });
      if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
      if (!emergency.userId.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
      const history = await LocationHistory.find({ emergencyId: emergency._id })
        .sort({ timestamp: 1 })
        .select('coordinates accuracy speed heading timestamp')
        .lean();
      res.json(history);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
}

module.exports = apiLocationRoutes;
