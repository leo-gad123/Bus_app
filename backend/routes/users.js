const express = require('express');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Ticket = require('../models/Ticket');
const Trip = require('../models/Trip');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalBuses, totalRoutes, totalTickets, totalTrips, revenue] = await Promise.all([
      User.countDocuments(),
      Bus.countDocuments(),
      Route.countDocuments(),
      Ticket.countDocuments(),
      Trip.countDocuments(),
      Ticket.aggregate([{ $group: { _id: null, total: { $sum: '$fare' } } }]),
    ]);
    const byRole = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
    const byTicketStatus = await Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
    const activeTrips = await Trip.countDocuments({ status: 'active' });

    res.json({
      totalUsers,
      totalBuses,
      totalRoutes,
      totalTickets,
      totalTrips,
      activeTrips,
      revenue: revenue.length > 0 ? revenue[0].total : 0,
      usersByRole: Object.fromEntries(byRole.map(r => [r._id, r.count])),
      ticketsByStatus: Object.fromEntries(byTicketStatus.map(r => [r._id, r.count])),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin users' });

    await Ticket.deleteMany({ user: user._id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
