const express = require('express');
const Favorite = require('../models/Favorite');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('route', 'name startLocation endLocation baseFare');
    res.json(favorites);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { routeId, label } = req.body;
    const existing = await Favorite.findOne({ user: req.user._id, route: routeId });
    if (existing) {
      if (label !== undefined) existing.label = label;
      await existing.save();
      return res.json(existing);
    }
    const fav = new Favorite({ user: req.user._id, route: routeId, label });
    await fav.save();
    await fav.populate('route', 'name startLocation endLocation baseFare');
    res.status(201).json(fav);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const fav = await Favorite.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!fav) return res.status(404).json({ error: 'Favorite not found' });
    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
