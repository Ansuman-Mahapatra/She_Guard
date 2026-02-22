const express = require('express');
const Emergency = require('../models/Emergency');
const EmergencySession = require('../models/EmergencySession');
const Dispatch = require('../models/Dispatch');
const LocationHistory = require('../models/LocationHistory');
const User = require('../models/User');
const { generateDispatchId } = require('../utils/idGenerator');

const router = express.Router();

// PCR has full access without login — public dashboard

// GET /api/police/stats
router.get('/stats', async (req, res) => {
  try {
    // We send back simulated metrics for the PCR Dashboard 
    // Usually these come from officer databases and fleet tables
    res.json({
      onDutyOfficers: 245,
      availableUnits: 85,
      avgResponse: 4.2,
      coverage: 94
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/police/map — combines new Emergency + legacy EmergencySession
router.get('/map', async (req, res) => {
  try {
    const activeNew = await Emergency.find({ status: 'Active' })
      .populate('userId', 'name phone email age')
      .sort({ triggeredAt: -1 })
      .lean();
    const activeLegacy = await EmergencySession.find({ status: 'ACTIVE' })
      .sort({ startTime: -1 })
      .lean();
    const activeEmergencies = activeNew.map((e) => ({
      emergencyId: e.emergencyId,
      victim: e.userId ? { name: e.userId.name, age: e.userId.age, phone: e.userId.phone } : {},
      location: e.lastKnownLocation
        ? {
            lat: e.lastKnownLocation.latitude,
            lng: e.lastKnownLocation.longitude,
            address: e.lastKnownLocation.address,
            lastUpdate: e.lastKnownLocation.updatedAt,
          }
        : null,
      emergencyType: e.emergencyType,
      triggeredAt: e.triggeredAt,
      priority: e.priority,
      noNetworkZone: e.noNetworkZone,
      batteryLevel: e.batteryLevel,
      guardiansNotified: (e.guardianEmails || []).length + (e.guardianPhones || []).length,
      guardiansViewing: e.guardiansViewing,
      policeUnitAssigned: e.policeUnitAssigned,
      status: e.status,
    }));
    const legacyMapped = activeLegacy.map((s) => ({
      emergencyId: s.sessionId,
      victim: { name: s.victimName, phone: s.victimDetails?.phone, age: s.victimDetails?.age },
      location: s.locations?.length
        ? { lat: s.locations[s.locations.length - 1].lat, lng: s.locations[s.locations.length - 1].lng, address: null, lastUpdate: s.locations[s.locations.length - 1].timestamp }
        : null,
      emergencyType: s.contextType || 'Manual',
      triggeredAt: s.startTime,
      priority: s.riskLevel === 'CRITICAL' ? 'high' : s.riskLevel === 'HIGH' ? 'high' : 'medium',
      noNetworkZone: false,
      batteryLevel: null,
      guardiansNotified: s.guardianDetails?.email ? 1 : 0,
      guardiansViewing: 0,
      policeUnitAssigned: null,
      status: 'Active',
    }));
    res.json({
      activeEmergencies: [...activeEmergencies, ...legacyMapped],
      emergencyHotspots: [],
      availableUnits: [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/police/emergencies/active
router.get('/emergencies/active', async (req, res) => {
  try {
    const newList = await Emergency.find({ status: 'Active' })
      .populate('userId', 'name phone email age')
      .sort({ triggeredAt: -1 })
      .lean();
    const legacyList = await EmergencySession.find({ status: 'ACTIVE' }).sort({ startTime: -1 }).lean();
    const combined = [...newList.map((e) => ({ ...e, _source: 'emergency' })), ...legacyList.map((s) => ({
      _id: s._id,
      emergencyId: s.sessionId,
      userId: null,
      victimName: s.victimName,
      status: 'Active',
      triggeredAt: s.startTime,
      _source: 'session',
    }))];
    res.json(combined);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/police/emergency/:emergencyId
router.get('/emergency/:emergencyId', async (req, res) => {
  try {
    let emergency = await Emergency.findOne({ emergencyId: req.params.emergencyId })
      .populate('userId')
      .lean();
    if (!emergency) {
      const session = await EmergencySession.findOne({ sessionId: req.params.emergencyId }).lean();
      if (!session) return res.status(404).json({ message: 'Emergency not found' });
      return res.json(session);
    }
    res.json(emergency);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/police/activity-timeline/:emergencyId
router.get('/activity-timeline/:emergencyId', async (req, res) => {
  try {
    let emergency = await Emergency.findOne({ emergencyId: req.params.emergencyId });
    if (emergency) {
      const history = await LocationHistory.find({ emergencyId: emergency._id })
        .sort({ timestamp: 1 })
        .lean();
      const timeline = [
        { timestamp: emergency.triggeredAt, event: 'SOS triggered', details: emergency.triggerMethod },
        { timestamp: new Date(), event: 'Guardians notified', details: 'Email sent' },
        ...history.slice(0, 20).map((h) => ({
          timestamp: h.timestamp,
          event: 'Location update',
          details: `${h.coordinates?.coordinates?.[1]}, ${h.coordinates?.coordinates?.[0]}`,
        })),
      ];
      return res.json({ timeline });
    }
    const session = await EmergencySession.findOne({ sessionId: req.params.emergencyId });
    if (!session) return res.status(404).json({ message: 'Emergency not found' });
    const timeline = [
      ...(session.timelineEvents || []).map((e) => ({ timestamp: e.timestamp, event: e.event, details: '' })),
      ...(session.locations || []).slice(-20).map((l) => ({
        timestamp: l.timestamp,
        event: 'Location update',
        details: `${l.lat}, ${l.lng}`,
      })),
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    res.json({ timeline });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/police/dispatch
router.post('/dispatch', async (req, res) => {
  try {
    const { emergencyId, unitId, priority, instructions, dispatchedByName } = req.body;
    if (!emergencyId || !unitId) {
      return res.status(400).json({ message: 'emergencyId and unitId required' });
    }
    const emergency = await Emergency.findOne({ emergencyId });
    if (!emergency) return res.status(404).json({ message: 'Emergency not found' });
    const dispatchId = await generateDispatchId(Dispatch);
    const dispatch = new Dispatch({
      dispatchId,
      emergencyId: emergency._id,
      unitId,
      unitOfficers: req.body.unitOfficers || [],
      dispatchedBy: req.user?._id,
      dispatchedByName: req.user?.name || dispatchedByName || 'PCR Operator',
      priority: priority || 'urgent',
      instructions,
    });
    await dispatch.save();
    emergency.policeUnitAssigned = unitId;
    emergency.policeDispatchedAt = new Date();
    await emergency.save();
    res.status(201).json(dispatch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/police/unit/status
router.post('/unit/status', async (req, res) => {
  try {
    const { unitId, dispatchId, status, location, notes } = req.body;
    const dispatch = await Dispatch.findOne({ dispatchId });
    if (!dispatch) return res.status(404).json({ message: 'Dispatch not found' });
    dispatch.status = status;
    dispatch.statusUpdates.push({ status, location, notes });
    if (status === 'arrived') dispatch.actualArrival = new Date();
    if (status === 'completed') dispatch.completedAt = new Date();
    await dispatch.save();
    res.json(dispatch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
