const User = require('../models/User');
const GuardianRelationship = require('../models/GuardianRelationship');

/**
 * Get list of guardian emails for a victim user (for SOS/tamper/check-in notifications).
 * Uses victim.guardians[].guardianEmail and GuardianRelationship + User.email.
 */
async function getGuardianEmailsForVictim(victimUserId) {
  const emails = new Set();
  const victim = await User.findById(victimUserId).select('guardians').lean();
  if (victim && victim.guardians) {
    for (const g of victim.guardians) {
      if (g.guardianEmail && g.guardianEmail.trim()) {
        emails.add(g.guardianEmail.trim());
      }
    }
  }
  const rels = await GuardianRelationship.find({
    victimUserId,
    status: 'active',
  }).select('guardianUserId').lean();
  for (const r of rels) {
    const guardian = await User.findById(r.guardianUserId).select('email').lean();
    if (guardian && guardian.email && guardian.email.trim()) {
      emails.add(guardian.email.trim());
    }
  }
  return [...emails];
}

module.exports = { getGuardianEmailsForVictim };
