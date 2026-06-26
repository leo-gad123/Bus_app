const express = require('express');
const Bus = require('../models/Bus');
const { auth, adminAuth, driverAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const buses = await Bus.find().populate('driver', 'name email phone').populate('route');
    res.json(buses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const buses = await Bus.find({ driver: req.user._id }).populate('route');
    res.json(buses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id).populate('driver').populate('route');
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    res.json(bus);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const bus = new Bus(req.body);
    await bus.save();
    res.status(201).json(bus);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(bus);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Bus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bus deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
