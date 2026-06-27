const express = require('express');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(transactions);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
