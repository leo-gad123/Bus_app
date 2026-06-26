const express = require('express');
const Ticket = require('../models/Ticket');
const Trip = require('../models/Trip');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const { auth, driverAuth } = require('../middleware/auth');
const { generateQRSecret, generateQRToken, generateQRCode, verifyQRToken } = require('../utils/qr');

const router = express.Router();

router.post('/purchase', auth, async (req, res) => {
  try {
    const { routeId } = req.body;
    const route = await Route.findById(routeId);
    if (!route) return res.status(404).json({ error: 'Route not found' });

    const fare = route.baseFare;
    if (req.user.walletBalance < fare) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    req.user.walletBalance -= fare;
    await req.user.save();

    const secret = generateQRSecret();
    const token = generateQRToken(secret);
    const qrData = JSON.stringify({ userId: req.user._id, routeId, fare, token, timestamp: Date.now() });
    const qrCode = await generateQRCode(qrData);

    const ticket = new Ticket({
      user: req.user._id,
      route: routeId,
      qrCode,
      qrSecret: secret,
      fare,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await ticket.save();

    res.status(201).json({ ticket, qrCode });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/verify', driverAuth, async (req, res) => {
  try {
    const { qrData } = req.body;
    const parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;

    const ticket = await Ticket.findOne({
      user: parsed.userId,
      route: parsed.routeId,
      status: 'active'
    }).populate('user', 'name email');

    if (!ticket) return res.status(404).json({ error: 'Ticket not found', valid: false });

    if (new Date() > ticket.expiresAt) {
      ticket.status = 'expired';
      await ticket.save();
      return res.json({ valid: false, error: 'Ticket expired' });
    }

    const isValid = verifyQRToken(ticket.qrSecret, parsed.token);
    if (!isValid) return res.json({ valid: false, error: 'Invalid QR code' });

    ticket.status = 'used';
    ticket.usedAt = new Date();
    ticket.bus = req.query.busId || null;
    await ticket.save();

    let trip = await Trip.findOne({ bus: req.query.busId, status: 'active' });
    if (trip) {
      trip.passengerCount += 1;
      trip.revenue += ticket.fare;
      await trip.save();
    }

    res.json({
      valid: true,
      ticket: {
        id: ticket._id,
        fare: ticket.fare,
        passengerName: ticket.user.name,
        usedAt: ticket.usedAt
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message, valid: false });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .populate('route', 'name startLocation endLocation')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    if (req.user.role === 'admin') {
      const tickets = await Ticket.find(filter)
        .populate('user', 'name email')
        .populate('route', 'name')
        .sort({ createdAt: -1 });
      return res.json(tickets);
    }

    if (req.user.role === 'driver') {
      const tickets = await Ticket.find(filter)
        .populate('user', 'name email')
        .populate('route', 'name')
        .sort({ createdAt: -1 });
      return res.json(tickets);
    }

    filter.user = req.user._id;
    const tickets = await Ticket.find(filter)
      .populate('route', 'name')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/trip/start', driverAuth, async (req, res) => {
  try {
    const { busId } = req.body;
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ error: 'Bus not found' });

    const activeTrip = await Trip.findOne({ bus: busId, status: 'active' });
    if (activeTrip) return res.status(400).json({ error: 'Bus already has an active trip' });

    const trip = new Trip({
      bus: busId,
      route: bus.route,
      driver: req.user._id
    });
    await trip.save();
    res.status(201).json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/trip/:id/end', driverAuth, async (req, res) => {
  try {
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      { endTime: new Date(), status: 'completed' },
      { new: true }
    );
    res.json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/trips/active', driverAuth, async (req, res) => {
  try {
    const trips = await Trip.find({ driver: req.user._id, status: 'active' })
      .populate('bus', 'busNumber plateNumber')
      .populate('route', 'name startLocation endLocation');
    res.json(trips);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
