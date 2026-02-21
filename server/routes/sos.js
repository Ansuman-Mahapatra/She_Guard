const express = require('express');
const PDFDocument = require('pdfkit');
const EmergencySession = require('../models/EmergencySession');
const riskEngine = require('../services/riskEngine');
const fcm = require('../services/fcm');
const mail = require('../services/mail');

function sosRoutes(io) {
  const router = express.Router();

  const validContexts = ['physical_attack', 'forced_vehicle', 'medical', 'unsafe', 'unsure'];

  router.post('/start', async (req, res) => {
    try {
      const { victimName, contextType, guardianEmail, guardianEmails, policeEmail } = req.body;
      if (!victimName || typeof victimName !== 'string' || !victimName.trim()) {
        return res.status(400).json({ message: 'victimName is required' });
      }
      if (contextType && !validContexts.includes(contextType)) {
        return res.status(400).json({ message: 'contextType must be one of: ' + validContexts.join(', ') });
      }
      const emails = [];
      if (guardianEmail && typeof guardianEmail === 'string' && guardianEmail.trim()) emails.push(guardianEmail.trim());
      if (Array.isArray(guardianEmails)) guardianEmails.forEach((e) => e && typeof e === 'string' && e.trim() && emails.push(e.trim()));
      const session = new EmergencySession({
        victimName: victimName.trim(),
        contextType: contextType || undefined,
        guardianDetails: guardianEmail ? { email: guardianEmail.trim() } : undefined,
        policeEmail: policeEmail && typeof policeEmail === 'string' ? policeEmail.trim() : undefined,
      });
      session.timelineEvents.push({ event: 'SOS triggered' });
      await session.save();
      io.emit('new_sos', session);
      const title = 'SOS Alert';
      const body = `${victimName} — ${contextType || 'Emergency'}`;
      fcm.sendToTopic('guardians', { title, body }, { sessionId: session.sessionId }).catch(() => {});
      mail.sendAlertToEmails(emails, title, body).catch(() => {});
      console.log('[sos] New SOS started:', session.sessionId, victimName);
      res.json({ sessionId: session.sessionId, _id: session._id });
    } catch (err) {
      console.error('[sos] Start error:', err);
      res.status(500).json({ message: err.message });
    }
  });

  router.post('/update/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { lat, lng, speed, direction, audioLevel } = req.body;
      const numLat = Number(lat);
      const numLng = Number(lng);
      if (lat === undefined || lat === null || lng === undefined || lng === null || isNaN(numLat) || isNaN(numLng)) {
        return res.status(400).json({ message: 'lat and lng are required and must be valid numbers (0 is valid)' });
      }
      const session = await EmergencySession.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      const newLoc = { lat: numLat, lng: numLng, speed, direction, audioLevel, timestamp: new Date() };
      session.locations.push(newLoc);
      const result = riskEngine.calculate(session, { lat: numLat, lng: numLng, speed, direction, audioLevel });
      session.riskScore = result.riskScore;
      session.riskLevel = result.riskLevel;
      await session.save();
      io.emit('session_update', session);
      console.log('[sos] Session updated:', sessionId, 'riskScore:', session.riskScore);
      res.json(session);
    } catch (err) {
      console.error('[sos] Update error:', err);
      res.status(500).json({ message: err.message });
    }
  });

  router.post('/resolve/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await EmergencySession.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      session.status = 'RESOLVED';
      session.endTime = new Date();
      session.timelineEvents.push({ event: 'Session resolved by victim' });
      await session.save();
      io.emit('session_resolved', { sessionId });
      console.log('[sos] Session resolved:', sessionId);
      res.json({ message: 'Session resolved' });
    } catch (err) {
      console.error('[sos] Resolve error:', err);
      res.status(500).json({ message: err.message });
    }
  });

  router.get('/active', async (req, res) => {
    try {
      const sessions = await EmergencySession.find({ status: 'ACTIVE' })
        .sort({ riskScore: -1 });
      console.log('[sos] Active sessions count:', sessions.length);
      res.json(sessions);
    } catch (err) {
      console.error('[sos] Active error:', err);
      res.status(500).json({ message: err.message });
    }
  });

  router.get('/sessions', async (req, res) => {
    try {
      const { status } = req.query;
      const filter = status === 'active' ? { status: 'ACTIVE' }
        : status === 'resolved' ? { status: 'RESOLVED' }
        : {};
      const sessions = await EmergencySession.find(filter)
        .sort({ startTime: -1 });
      res.json(sessions);
    } catch (err) {
      console.error('[sos] Sessions error:', err);
      res.status(500).json({ message: err.message });
    }
  });

  router.get('/report/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await EmergencySession.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=incident-${sessionId}.pdf`);
      doc.pipe(res);

      doc.fontSize(20).text('INCIDENT REPORT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text('Session ID: ' + session.sessionId);
      doc.text('Victim Name: ' + session.victimName);
      doc.text('Context: ' + session.contextType);
      doc.text('Start Time: ' + session.startTime);
      doc.text('Risk Score: ' + session.riskScore);
      doc.text('Risk Level: ' + session.riskLevel);
      doc.text('Tamper Detected: ' + (session.tamperDetected ? 'YES' : 'NO'));

      const maxSpeed = session.locations.length > 0
        ? Math.max(...session.locations.map(l => l.speed || 0))
        : 0;
      doc.text('Max Speed Recorded: ' + maxSpeed + ' km/h');
      doc.text('Total Location Updates: ' + session.locations.length);

      doc.moveDown();
      doc.fontSize(14).text('TIMELINE OF EVENTS:');
      session.timelineEvents.forEach(e => {
        const timeStr = e.timestamp ? new Date(e.timestamp).toLocaleString() : 'N/A';
        doc.fontSize(11).text('• ' + (e.event || 'Event') + ' — ' + timeStr);
      });

      doc.end();
      console.log('[sos] Report generated for session:', sessionId);
    } catch (err) {
      console.error('[sos] Report error:', err);
      if (!res.headersSent) res.status(500).json({ message: err.message });
    }
  });

  return router;
}

module.exports = sosRoutes;
