const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Session = require('../models/Session');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const fcm = require('../services/fcm');
const mail = require('../services/mail');
const { isValidEmail } = require('../utils/validate');

const router = express.Router();
const INACTIVITY_MS = config.SESSION_INACTIVITY_DAYS * 24 * 60 * 60 * 1000;
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash || '');
}

function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, role, password, age, bloodGroup, stationId, stationName, stationAddress, stationPhone } = req.body;
    if (!name || !role) {
      return res.status(400).json({ message: 'name and role are required' });
    }
    const validRoles = ['victim', 'guardian', 'pcr'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'role must be victim, guardian, or pcr' });
    }
    if (role === 'pcr') {
      if (!stationId || !stationId.trim()) return res.status(400).json({ message: 'stationId is required for PCR' });
      if (!stationName || !stationName.trim()) return res.status(400).json({ message: 'stationName is required for PCR' });
      if (!password || password.length < 6) return res.status(400).json({ message: 'password is required (min 6 chars) for PCR' });
      const sid = stationId.trim();
      const existing = await User.findOne({ stationId: sid, role: 'pcr' });
      if (existing) return res.status(409).json({ message: 'Station ID already registered' });
      const hashed = await hashPassword(password);
      const user = new User({
        name: name.trim(),
        role: 'pcr',
        password: hashed,
        stationId: sid,
        stationName: stationName.trim(),
        stationAddress: stationAddress ? stationAddress.trim() : undefined,
        stationPhone: stationPhone ? stationPhone.trim() : undefined,
        emailVerified: true,
      });
      await user.save();
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        role: user.role,
        stationId: user.stationId,
        stationName: user.stationName,
        message: 'PCR station registered. Use stationId and password to login.',
      });
    }
    if (!phone || !phone.trim()) return res.status(400).json({ message: 'phone is required for victim and guardian' });
    if (role === 'victim' || role === 'guardian') {
      if (!email || !email.trim()) return res.status(400).json({ message: 'email is required for victim and guardian' });
      const trimmedEmail = email.trim();
      if (!isValidEmail(trimmedEmail)) return res.status(400).json({ message: 'invalid email format' });
    }
    const trimmedEmail = email ? email.trim() : undefined;
    if (trimmedEmail) {
      const existing = await User.findOne({ email: trimmedEmail });
      if (existing) return res.status(409).json({ message: 'Email already registered' });
    }
    const code = generateVerificationCode();
    const hashed = password ? await hashPassword(password) : undefined;
    const user = new User({
      name: name.trim(),
      phone: phone.trim(),
      email: trimmedEmail,
      role,
      password: hashed,
      age: age != null ? Number(age) : undefined,
      bloodGroup: bloodGroup || undefined,
      emailVerified: false,
      emailVerificationCode: code,
      emailVerificationSentAt: new Date(),
    });
    await user.save();
    mail.sendVerificationEmail(trimmedEmail, code).catch((err) => console.error('[auth] Verification email failed:', err.message));
    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      emailVerified: false,
      message: 'Verification code sent to your email. Call POST /api/auth/verify-email to verify.',
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Phone or station ID already registered' });
    }
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: 'email and code are required' });
    }
    const emailTrim = email.trim();
    const user = await User.findOne({ email: new RegExp(`^${emailTrim.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.emailVerified) {
      return res.json({ message: 'Email already verified' });
    }
    if (user.emailVerificationCode !== String(code).trim()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    const sentAt = user.emailVerificationSentAt ? user.emailVerificationSentAt.getTime() : 0;
    if (Date.now() - sentAt > CODE_EXPIRY_MS) {
      return res.status(400).json({ message: 'Verification code expired. Request a new one via register or resend.' });
    }
    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationSentAt = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });
    const user = await User.findOne({ email: new RegExp(`^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.json({ message: 'Email already verified' });
    const code = generateVerificationCode();
    user.emailVerificationCode = code;
    user.emailVerificationSentAt = new Date();
    await user.save();
    mail.sendVerificationEmail(user.email, code).catch((err) => console.error('[auth] Resend failed:', err.message));
    res.json({ message: 'Verification code sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login-pcr — PCR login with station ID and password
router.post('/login-pcr', async (req, res) => {
  try {
    const { stationId, password } = req.body;
    if (!stationId || !password) {
      return res.status(400).json({ message: 'stationId and password are required' });
    }
    const user = await User.findOne({ stationId: stationId.trim(), role: 'pcr' });
    if (!user) return res.status(404).json({ message: 'Station not found' });
    if (!(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const deviceId = `pcr-${user.stationId}`;
    const existingSessions = await Session.find({ userId: user._id, isActive: true });
    for (const s of existingSessions) {
      await Session.updateOne({ _id: s._id }, { isActive: false });
    }
    const expiresAt = new Date(Date.now() + INACTIVITY_MS);
    const session = new Session({
      userId: user._id,
      deviceId,
      deviceName: user.stationName || `PCR ${user.stationId}`,
      ipAddress: req.ip || req.connection?.remoteAddress || '',
      expiresAt,
    });
    await session.save();
    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
    const token = jwt.sign(
      { userId: user._id.toString(), deviceId, sessionId: session._id.toString() },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        stationId: user.stationId,
        stationName: user.stationName,
      },
      sessionId: session._id,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login — victim/guardian login with phone
router.post('/login', async (req, res) => {
  try {
    const { phone, password, deviceId, deviceName, deviceOS, appVersion, fcmToken } = req.body;
    if (!phone || !deviceId) {
      return res.status(400).json({ message: 'phone and deviceId are required' });
    }
    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if ((user.role === 'victim' || user.role === 'guardian') && !user.emailVerified) {
      return res.status(403).json({
        message: 'Please verify your email first',
        email: user.email,
        hint: 'POST /api/auth/verify-email with { email, code } or POST /api/auth/resend-verification with { email }',
      });
    }
    if (user.password && !password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (user.password && !(await comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const existingSessions = await Session.find({ userId: user._id, isActive: true }).lean();
    const confirmSwitch = req.query.confirmSwitch === '1' || req.body.confirmSwitch === true;
    if (existingSessions.length > 0 && !confirmSwitch) {
      const other = existingSessions.find((s) => s.deviceId !== deviceId) || existingSessions[0];
      return res.status(200).json({
        alreadyLoggedIn: true,
        deviceName: other.deviceName || 'Another device',
        message: `Already logged in on ${other.deviceName || 'another device'}. Send confirmSwitch: true to log out that device and continue here.`,
      });
    }
    if (existingSessions.length > 0) {
      for (const s of existingSessions) {
        if (s.deviceId !== deviceId && s.fcmToken) {
          fcm.sendToDevice(s.fcmToken, {
            title: 'Account logged in elsewhere',
            body: 'Your account was logged in from another device. If this wasn\'t you, change your password immediately.',
          }).catch(() => {});
        }
        await Session.updateOne({ _id: s._id }, { isActive: false });
      }
    }
    const expiresAt = new Date(Date.now() + INACTIVITY_MS);
    const session = new Session({
      userId: user._id,
      deviceId,
      deviceName: deviceName || 'Unknown Device',
      deviceOS: deviceOS || '',
      appVersion: appVersion || '',
      ipAddress: req.ip || req.connection?.remoteAddress || '',
      fcmToken: fcmToken || '',
      expiresAt,
    });
    await session.save();
    await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });
    const token = jwt.sign(
      { userId: user._id.toString(), deviceId, sessionId: session._id.toString() },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRES_IN }
    );
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      sessionId: session._id,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    await Session.updateOne({ _id: req.session._id }, { isActive: false });
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/sessions
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id, isActive: true })
      .select('deviceId deviceName deviceOS appVersion loginAt lastActiveAt ipAddress')
      .sort({ lastActiveAt: -1 })
      .lean();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/auth/sessions/:sessionId
router.delete('/sessions/:sessionId', requireAuth, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      userId: req.user._id,
    });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    await Session.updateOne({ _id: session._id }, { isActive: false });
    res.json({ message: 'Session ended' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
