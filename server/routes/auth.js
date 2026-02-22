const express = require('express');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/register', async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    if (!name || !phone || !role) {
      return res.status(400).json({ message: 'name, phone, and role are required' });
    }
    const validRoles = ['victim', 'guardian', 'pcr'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'role must be victim, guardian, or pcr' });
    }
    const user = new User({ name, phone, role });
    await user.save();
    console.log('[auth] User registered:', phone);
    res.json(user);
  } catch (err) {
    console.error('[auth] Register error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'phone is required' });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      console.log('[auth] Login failed - user not found:', phone);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('[auth] User logged in:', phone);
    res.json(user);
  } catch (err) {
    console.error('[auth] Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { idToken, role, phone } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const googleId = payload.sub;

    let user = await User.findOne({ email });

    if (user) {
      console.log('[auth] User logged in via Google:', email);
      return res.json(user);
    }

    // Google accounts usually don't share phone numbers easily, 
    // so if this is their first time signing in we capture it from the app.
    if (!role || !phone) {
      return res.status(400).json({ 
        message: 'Account not found. Please provide phone and role to complete registration.',
        email,
        name
      });
    }

    const validRoles = ['victim', 'guardian', 'pcr'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'role must be victim, guardian, or pcr' });
    }

    user = new User({
      name,
      email,
      phone,
      role,
      googleId,
      emailVerified: true
    });

    await user.save();
    console.log('[auth] User registered via Google:', email);
    res.json(user);

  } catch (err) {
    console.error('[auth] Google auth error:', err);
    res.status(500).json({ message: 'Invalid or expired Google Token.' });
  }
});

module.exports = router;
