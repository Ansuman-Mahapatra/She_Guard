const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, phone, role } = req.body;
    const user = new User({ name, phone, role });
    await user.save();
    console.log('[auth] User registered:', phone);
    res.json(user);
  } catch (err) {
    console.error('[auth] Register error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
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

module.exports = router;
