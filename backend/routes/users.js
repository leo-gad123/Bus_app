const express = require('express');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/topup', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    req.user.walletBalance += amount;
    await req.user.save();

    res.json({ balance: req.user.walletBalance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const updates = ['name', 'phone', 'role', 'isActive'];
    const update = {};
    updates.forEach(key => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
