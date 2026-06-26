const express = require('express');
const Route = require('../models/Route');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const routes = await Route.find({ isActive: true });
    res.json(routes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/all', adminAuth, async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const route = new Route(req.body);
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(route);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Route.findByIdAndDelete(req.params.id);
    res.json({ message: 'Route deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
