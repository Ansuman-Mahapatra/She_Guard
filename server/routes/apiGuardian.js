const express = require('express');
const crypto = require('crypto');
const GuardianRelationship = require('../models/GuardianRelationship');
const Emergency = require('../models/Emergency');
const User = require('../models/User');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const linkingCodes = new Map(); // in-memory; use Redis in production

// POST /api/guardian/generate-code
router.post('/generate-code', requireAuth, requireRole('victim'), (req, res) => {
  const code = crypto.randomInt(100000, 999999).toString();
  linkingCodes.set(req.user._id.toString(), { code, createdAt: Date.now() });
  setTimeout(() => linkingCodes.delete(req.user._id.toString()), 10 * 60 * 1000);
  res.json({ code, expiresIn: 600 });
});

// POST /api/guardian/link-by-code
router.post('/link-by-code', requireAuth, requireRole('guardian'), async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'code required' });
    if (!req.user.email || !req.user.email.trim()) {
      return res.status(400).json({ message: 'Guardian must have a verified email to receive alerts. Update your profile.' });
    }
    const victimId = [...linkingCodes.entries()].find(([_, v]) => v.code === code)?.[0];
    if (!victimId) return res.status(400).json({ message: 'Invalid or expired code' });
    linkingCodes.delete(victimId);
    const victim = await User.findById(victimId);
    if (!victim || victim.role !== 'victim') return res.status(400).json({ message: 'Invalid code' });
    const existing = await GuardianRelationship.findOne({
      victimUserId: victim._id,
      guardianUserId: req.user._id,
    });
    if (existing) return res.status(409).json({ message: 'Already linked' });
    const isFirst = (await GuardianRelationship.countDocuments({ victimUserId: victim._id })) === 0;
    const rel = new GuardianRelationship({
      victimUserId: victim._id,
      guardianUserId: req.user._id,
      relationship: req.body.relationship || 'Guardian',
      isPrimary: isFirst,
      linkedBy: 'code',
    });
    await rel.save();
    victim.guardians = victim.guardians || [];
    victim.guardians.push({
      guardianUserId: req.user._id,
      guardianName: req.user.name,
      guardianEmail: req.user.email || undefined,
      guardianPhone: req.user.phone,
      relationship: rel.relationship,
      isPrimary: isFirst,
    });
    await victim.save();
    req.user.protectedMembers = req.user.protectedMembers || [];
    req.user.protectedMembers.push({
      victimUserId: victim._id,
      victimName: victim.name,
      relationship: rel.relationship,
    });
    await req.user.save();
    linkingCodes.delete(victimId);
    res.json({ message: 'Linked', victimName: victim.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/guardian/link-by-email
// Victim adds a Guardian by their Google-verified email address
router.post('/link-by-email', requireAuth, requireRole('victim'), async (req, res) => {
  try {
    const { email, relationship } = req.body;
    if (!email) return res.status(400).json({ message: 'Guardian email required' });
    
    // Find the guardian by email
    const guardian = await User.findOne({ email: email.toLowerCase(), role: 'guardian' });
    if (!guardian) {
      return res.status(404).json({ message: 'No Guardian found with this email. Ask them to sign in to SheGuard first.' });
    }

    // Check if already linked
    const existing = await GuardianRelationship.findOne({
      victimUserId: req.user._id,
      guardianUserId: guardian._id,
    });
    if (existing) return res.status(409).json({ message: 'Already linked to this Guardian' });

    const isFirst = (await GuardianRelationship.countDocuments({ victimUserId: req.user._id })) === 0;

    // Create Relationship
    const rel = new GuardianRelationship({
      victimUserId: req.user._id,
      guardianUserId: guardian._id,
      relationship: relationship || 'Guardian',
      isPrimary: isFirst,
      linkedBy: 'email',
    });
    await rel.save();

    // Update Victim
    req.user.guardians = req.user.guardians || [];
    req.user.guardians.push({
      guardianUserId: guardian._id,
      guardianName: guardian.name,
      guardianEmail: guardian.email,
      guardianPhone: guardian.phone,
      relationship: rel.relationship,
      isPrimary: isFirst,
    });
    await req.user.save();

    // Update Guardian
    guardian.protectedMembers = guardian.protectedMembers || [];
    guardian.protectedMembers.push({
      victimUserId: req.user._id,
      victimName: req.user.name,
      relationship: rel.relationship,
    });
    await guardian.save();

    res.json({ message: 'Successfully linked to Guardian.', guardianName: guardian.name });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/guardian/emergencies
router.get('/emergencies', requireAuth, requireRole('guardian'), async (req, res) => {
  try {
    const rels = await GuardianRelationship.find({
      guardianUserId: req.user._id,
      status: 'active',
      'permissions.viewEmergencies': true,
    }).select('victimUserId').lean();
    const victimIds = rels.map((r) => r.victimUserId);
    const list = await Emergency.find({ userId: { $in: victimIds }, status: 'Active' })
      .sort({ triggeredAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/guardian/permissions/:guardianId - update permissions (victim or primary guardian)
router.post('/permissions/:guardianId', requireAuth, async (req, res) => {
  try {
    const rel = await GuardianRelationship.findOne({
      _id: req.params.guardianId,
      victimUserId: req.user._id,
    });
    if (!rel) return res.status(404).json({ message: 'Not found' });
    if (req.body.permissions && typeof req.body.permissions === 'object') {
      Object.assign(rel.permissions, req.body.permissions);
      await rel.save();
    }
    res.json(rel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/guardian/block/:guardianId
router.post('/block/:guardianId', requireAuth, requireRole('victim'), async (req, res) => {
  try {
    const rel = await GuardianRelationship.findOne({
      _id: req.params.guardianId,
      victimUserId: req.user._id,
    });
    if (!rel) return res.status(404).json({ message: 'Not found' });
    rel.status = 'blocked';
    rel.blockedAt = new Date();
    rel.blockedReason = req.body.reason;
    await rel.save();
    res.json({ message: 'Guardian blocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
