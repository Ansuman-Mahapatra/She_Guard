const express = require('express');
const Emergency = require('../models/Emergency');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');
const { generateEmergencyId } = require('../utils/idGenerator');
const fcm = require('../services/fcm');
const mail = require('../services/mail');
const { getGuardianEmailsForVictim } = require('../utils/guardianEmails');

function apiEmergencyRoutes(io) {
  const router = express.Router();

  // POST /api/emergency/trigger - manual SOS
  router.post('/trigger', requireAuth, requireRole('victim'), async (req, res) => {
    try {
      const { emergencyType, triggerLocation } = req.body;
      const user = req.user;
      const emergencyId = await generateEmergencyId(Emergency);
      const loc = triggerLocation || {};
      const emergency = new Emergency({
        emergencyId,
        userId: user._id,
        emergencyType: emergencyType || 'Manual',
        triggerMethod: 'manual',
        triggerLocation: loc.latitude && loc.longitude ? {
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address,
          accuracy: loc.accuracy,
          timestamp: new Date(),
        } : undefined,
        lastKnownLocation: loc.latitude && loc.longitude ? {
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address,
          accuracy: loc.accuracy,
          updatedAt: new Date(),
        } : undefined,
        guardianEmails: (user.guardians ?? []).map((g) => g.guardianEmail).filter(Boolean),
        guardianPhones: (user.guardians ?? []).map((g) => g.guardianPhone).filter(Boolean),
      });
      await emergency.save();
      io.emit('new_sos', emergency);
      fcm.sendToTopic('guardians', {
        title: 'SOS Alert',
        body: `${user.name} triggered emergency — ${emergency.emergencyType}`,
      }, { emergencyId: emergency.emergencyId }).catch(() => {});
      const guardianEmails = await getGuardianEmailsForVictim(user._id);
      mail.sendAlertToEmails(guardianEmails, 'SOS Alert', `${user.name} triggered emergency — ${emergency.emergencyType}`).catch(() => {});
      res.status(201).json({ emergencyId: emergency.emergencyId, _id: emergency._id });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST /api/emergency/no-network-sos
  router.post('/no-network-sos', requireAuth, requireRole('victim'), async (req, res) => {
    try {
      const { timestamp, location, batteryLevel, trigger, networkQuality, evidenceQueued } = req.body;
      const user = req.user;
      const emergencyId = await generateEmergencyId(Emergency);
      const emergency = new Emergency({
        emergencyId,
        userId: user._id,
        emergencyType: 'No Network Zone SOS',
        triggerMethod: trigger || 'power-button-5x',
        autoActivated: false,
        highPriority: true,
        noNetworkZone: true,
        networkQuality: networkQuality || 'very-weak',
        expectedIntermittentConnection: true,
        lastContactAt: new Date(),
        triggerLocation: location ? { latitude: location.lat, longitude: location.lng, timestamp: new Date() } : undefined,
        lastKnownLocation: location ? { latitude: location.lat, longitude: location.lng, updatedAt: new Date() } : undefined,
        batteryLevel,
        guardianEmails: (user.guardians ?? []).map((g) => g.guardianEmail).filter(Boolean),
        guardianPhones: (user.guardians ?? []).map((g) => g.guardianPhone).filter(Boolean),
      });
      await emergency.save();
      io.emit('new_sos', emergency);
      fcm.sendToTopic('guardians', {
        title: 'EMERGENCY IN NO-NETWORK ZONE',
        body: `${user.name} triggered SOS. Last location shared.`,
      }, { emergencyId: emergency.emergencyId }).catch(() => {});
      const guardianEmails = await getGuardianEmailsForVictim(user._id);
      mail.sendAlertToEmails(guardianEmails, 'EMERGENCY IN NO-NETWORK ZONE', `${user.name} triggered SOS. Last location shared.`).catch(() => {});
      res.status(201).json({ emergencyId: emergency.emergencyId, status: 'received' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET /api/emergency/active
  router.get('/active', requireAuth, async (req, res) => {
    try {
      const query = { status: 'Active' };
      if (req.user.role === 'victim') query.userId = req.user._id;
      const list = await Emergency.find(query).sort({ triggeredAt: -1 }).lean();
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // GET /api/emergency/:emergencyId
  router.get('/:emergencyId', requireAuth, async (req, res) => {
    try {
      const emergency = await Emergency.findOne({ emergencyId: req.params.emergencyId }).lean();
      if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
      if (req.user.role === 'victim' && !emergency.userId.equals(req.user._id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      res.json(emergency);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // PUT /api/emergency/:emergencyId/status - resolve / false alarm
  router.put('/:emergencyId/status', requireAuth, async (req, res) => {
    try {
      const { status, resolutionMethod, resolutionNotes } = req.body;
      const emergency = await Emergency.findOne({ emergencyId: req.params.emergencyId });
      if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
      if (!emergency.userId.equals(req.user._id) && req.user.role !== 'pcr') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      if (!['Resolved', 'False Alarm'].includes(status)) {
        return res.status(400).json({ message: 'status must be Resolved or False Alarm' });
      }
      emergency.status = status;
      emergency.resolvedAt = new Date();
      emergency.resolvedBy = req.user.role === 'victim' ? 'victim' : req.user.name;
      emergency.resolutionMethod = resolutionMethod;
      emergency.resolutionNotes = resolutionNotes;
      emergency.isTrackingActive = false;
      emergency.audioRecordingActive = false;
      await emergency.save();
      io.emit('session_resolved', { sessionId: emergency.emergencyId });
      res.json(emergency);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // PUT /api/emergency/:emergencyId/cancel-auto-alert
  router.put('/:emergencyId/cancel-auto-alert', requireAuth, requireRole('victim'), async (req, res) => {
    try {
      const { reason } = req.body;
      const emergency = await Emergency.findOne({ emergencyId: req.params.emergencyId });
      if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
      if (!emergency.userId.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
      emergency.status = 'False Alarm';
      emergency.resolvedAt = new Date();
      emergency.resolvedBy = 'victim';
      emergency.resolutionMethod = 'False Alarm - Auto-Activated';
      emergency.resolutionNotes = reason;
      await emergency.save();
      io.emit('session_resolved', { sessionId: emergency.emergencyId });
      res.json(emergency);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // POST /api/emergency/:emergencyId/network-restored
  router.post('/:emergencyId/network-restored', requireAuth, async (req, res) => {
    try {
      const emergency = await Emergency.findOne({ emergencyId: req.params.emergencyId });
      if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
      if (!emergency.userId.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
      emergency.networkStatus = 'online';
      emergency.lastContactAt = new Date();
      await emergency.save();
      io.emit('session_update', emergency);
      res.json({ message: 'Network restored' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
}

module.exports = apiEmergencyRoutes;
