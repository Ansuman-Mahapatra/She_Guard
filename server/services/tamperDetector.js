const EmergencySession = require('../models/EmergencySession');
const riskEngine = require('./riskEngine');
const fcm = require('./fcm');
const mail = require('./mail');

function startTamperWatch(io) {
  setInterval(async () => {
    try {
      const sessions = await EmergencySession.find({ status: 'ACTIVE' });
      const now = Date.now();

      for (const session of sessions) {
        if (session.locations.length === 0) continue;

        const lastLoc = session.locations[session.locations.length - 1];
        const diff = now - new Date(lastLoc.timestamp).getTime();

        if (diff > 20000 && !session.tamperDetected) {
          session.tamperDetected = true;
          session.timelineEvents.push({ event: '⚠️ Device offline — tamper suspected' });

          const result = riskEngine.calculate(session, lastLoc);
          session.riskScore = result.riskScore;
          session.riskLevel = result.riskLevel;

          await session.save();

          io.emit('tamper_alert', {
            sessionId: session.sessionId,
            riskScore: session.riskScore,
            riskLevel: session.riskLevel
          });

          io.emit('session_update', session);
          fcm.sendToTopic('guardians', {
            title: 'Tamper detected',
            body: `${session.victimName} — device offline`
          }, { sessionId: session.sessionId }).catch(() => {});
          const emails = session.guardianDetails?.email ? [session.guardianDetails.email] : [];
          mail.sendAlertToEmails(emails, 'Tamper detected', `${session.victimName} — device offline`).catch(() => {});
          console.log('[tamperDetector] Tamper alert emitted for session:', session.sessionId);
        }
      }
    } catch (err) {
      console.error('[tamperDetector] Error:', err);
    }
  }, 10000);
  console.log('[tamperDetector] Tamper watch started (interval 10s)');
}

module.exports = { startTamperWatch };
