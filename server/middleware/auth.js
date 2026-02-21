const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const Session = require('../models/Session');

/**
 * Verify JWT and session; attach req.user and req.session.
 * Returns 401 if invalid or session not found.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Session expired, please login again' });
  }
  let payload;
  try {
    payload = jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Session expired, please login again' });
  }
  const { userId, deviceId, sessionId } = payload;
  if (!userId || !deviceId) {
    return res.status(401).json({ message: 'Session expired, please login again' });
  }
  const session = await Session.findOne({
    _id: sessionId,
    userId,
    deviceId,
    isActive: true,
  });
  if (!session) {
    return res.status(401).json({ message: 'Session expired, please login again' });
  }
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Account inactive' });
  }
  session.lastActiveAt = new Date();
  await session.save().catch(() => {});
  req.user = user;
  req.session = session;
  next();
}

/**
 * Optional auth: attach user/session if valid token present, else continue.
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    const session = await Session.findOne({
      _id: payload.sessionId,
      userId: payload.userId,
      deviceId: payload.deviceId,
      isActive: true,
    });
    if (session) {
      const user = await User.findById(payload.userId);
      if (user && user.isActive) {
        req.user = user;
        req.session = session;
      }
    }
  } catch (err) {}
  next();
}

/**
 * Require role (victim | guardian | pcr).
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
