const express = require('express');
const PDFDocument = require('pdfkit');
const EmergencySession = require('../models/EmergencySession');
const riskEngine = require('../services/riskEngine');
const fcm = require('../services/fcm');
const mail = require('../services/mail');

function sosRoutes(io) {
  const router = express.Router();

  router.post('/start', async (req, res) => {
    try {
      const { victimName, contextType } = req.body;
      const session = new EmergencySession({ victimName, contextType });
      session.timelineEvents.push({ event: 'SOS triggered' });
      await session.save();
      io.emit('new_sos', session);
      const title = 'SOS Alert';
      const body = `${victimName} — ${contextType || 'Emergency'}`;
      fcm.sendToTopic('guardians', { title, body }, { sessionId: session.sessionId }).catch(() => {});
      const config = require('../config');
      mail.send(config.GUARDIAN_ALERT_EMAIL || '', title, body).catch(() => {});
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
      const session = await EmergencySession.findOne({ sessionId });
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      const newLoc = { lat, lng, speed, direction, audioLevel, timestamp: new Date() };
      session.locations.push(newLoc);
      const result = riskEngine.calculate(session, { lat, lng, speed, direction, audioLevel });
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
        doc.fontSize(11).text('• ' + e.event + ' — ' + new Date(e.timestamp).toLocaleString());
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
