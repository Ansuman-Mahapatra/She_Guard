const Session = require('../models/Session');
const CheckInSchedule = require('../models/CheckInSchedule');
const CheckInRequest = require('../models/CheckInRequest');
const Emergency = require('../models/Emergency');
const User = require('../models/User');
const UserStatus = require('../models/UserStatus');
const config = require('../config');
const fcm = require('../services/fcm');

const INACTIVITY_MS = config.SESSION_INACTIVITY_DAYS * 24 * 60 * 60 * 1000;

async function sessionCleanup() {
  const now = new Date();
  const expired = await Session.deleteMany({
    $or: [{ expiresAt: { $lt: now } }, { lastActiveAt: { $lt: new Date(now - INACTIVITY_MS) } }],
  });
  if (expired.deletedCount > 0) {
    console.log('[cron] Session cleanup: removed', expired.deletedCount, 'sessions');
  }
}

async function checkInProcessor() {
  const now = new Date();
  const due = await CheckInSchedule.find({
    isActive: true,
    nextCheckInAt: { $lte: now },
  });
  for (const schedule of due) {
    const mustRespondBy = new Date(now.getTime() + (schedule.graceperiod || 300000));
    const request = new CheckInRequest({
      userId: schedule.userId,
      scheduleId: schedule._id,
      mustRespondBy,
    });
    await request.save();
    schedule.nextCheckInAt = new Date(now.getTime() + schedule.checkInInterval);
    await schedule.save();
    const user = await User.findById(schedule.userId);
    if (user && user.role === 'victim') {
      fcm.sendToTopic('guardians', {
        title: 'Check-in requested',
        body: `${user.name} - Are you safe? Please respond within 5 minutes.`,
      }).catch(() => {});
      const mail = require('../services/mail');
      const { getGuardianEmailsForVictim } = require('../utils/guardianEmails');
      const guardianEmails = await getGuardianEmailsForVictim(user._id);
      mail.sendAlertToEmails(guardianEmails, 'Check-in requested', `${user.name} - Are you safe? Please respond within 5 minutes.`).catch(() => {});
    }
  }
  const missed = await CheckInRequest.find({
    status: 'pending',
    mustRespondBy: { $lt: now },
  });
  const { generateEmergencyId } = require('../utils/idGenerator');
  for (const req of missed) {
    req.status = 'missed';
    req.autoEmergencyTriggered = true;
    await req.save();
    const emergencyId = await generateEmergencyId(Emergency);
    const emergency = new Emergency({
      emergencyId,
      userId: req.userId,
      emergencyType: 'Missed Check-In',
      triggerMethod: 'auto-check-in',
      autoActivated: true,
    });
    await emergency.save();
    req.emergencyId = emergency._id;
    await req.save();
    const schedule = await CheckInSchedule.findById(req.scheduleId);
    if (schedule) {
      schedule.isActive = false;
      schedule.deactivatedAt = new Date();
      await schedule.save();
    }
  }
}

async function missedHeartbeatMonitor() {
  const fortyFiveSecondsAgo = new Date(Date.now() - 45 * 1000);
  
  try {
    // Find victims who were online but haven't sent a heartbeat in 45 seconds
    const lostVictims = await User.find({
      role: 'victim',
      'lastKnownLocation.status': 'online',
      lastHeartbeatAt: { $lt: fortyFiveSecondsAgo }
    });

    for (const victim of lostVictims) {
      victim.lastKnownLocation.status = 'yellow_alert';
      await victim.save();
      
      console.log(`[cron] ⚠️ Signal lost detected for ${victim.name}. Triggering Yellow Alert.`);

      const guardians = victim.guardians || [];
      const guardianTokenIds = guardians.map(g => g.guardianUserId);
      const guardianUsers = await User.find({ _id: { $in: guardianTokenIds }, fcmToken: { $exists: true } });
      
      for (const reqGuardian of guardianUsers) {
        if (reqGuardian.fcmToken) {
          fcm.sendToDevice(reqGuardian.fcmToken, {
            title: `📶 Signal Lost: ${victim.name}`,
            body: `${victim.name} went offline or lost signal. Last seen 45 seconds ago. Check their location immediately.`,
          }, { type: 'yellow_alert', victimId: victim._id.toString() }).catch(err => console.error(err));
        }
      }
    }
  } catch (err) {
    console.error("[cron] Error running heartbeat monitor:", err);
  }
}

function startCron(io) {
  setInterval(sessionCleanup, 24 * 60 * 60 * 1000);
  setInterval(checkInProcessor, 60 * 1000);
  setInterval(missedHeartbeatMonitor, 15 * 1000); // Check every 15 seconds
  console.log('[cron] Background jobs started');
}

module.exports = { sessionCleanup, checkInProcessor, missedHeartbeatMonitor, startCron };
