const express = require('express');
const BusLocation = require('../models/BusLocation');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const { auth, driverAuth } = require('../middleware/auth');

const router = express.Router();

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.get('/buses/nearby', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const locations = await BusLocation.find({
      lat: { $gte: parseFloat(lat) - 0.1, $lte: parseFloat(lat) + 0.1 },
      lng: { $gte: parseFloat(lng) - 0.1, $lte: parseFloat(lng) + 0.1 },
      updatedAt: { $gte: new Date(Date.now() - 60000) }
    }).populate('bus', 'busNumber plateNumber').populate('driver', 'name');

    const nearby = locations.filter(l => getDistance(parseFloat(lat), parseFloat(lng), l.lat, l.lng) <= parseFloat(radius));
    res.json(nearby);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/stops/nearby', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 2 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

    const routes = await Route.find({ isActive: true });
    const nearbyStops = [];

    for (const route of routes) {
      for (const stop of route.stops) {
        if (stop.lat && stop.lng) {
          const dist = getDistance(parseFloat(lat), parseFloat(lng), stop.lat, stop.lng);
          if (dist <= parseFloat(radius)) {
            nearbyStops.push({
              stopName: stop.name,
              routeId: route._id,
              routeName: route.name,
              distance: Math.round(dist * 1000) / 1000,
              lat: stop.lat,
              lng: stop.lng,
              fare: stop.fare
            });
          }
        }
      }
    }

    nearbyStops.sort((a, b) => a.distance - b.distance);
    res.json(nearbyStops);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/buses/live', auth, async (req, res) => {
  try {
    const locations = await BusLocation.find({
      updatedAt: { $gte: new Date(Date.now() - 120000) }
    }).populate('bus', 'busNumber plateNumber route').populate('driver', 'name');
    res.json(locations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/routes/eta', auth, async (req, res) => {
  try {
    const { routeId, stopLat, stopLng } = req.query;
    if (!routeId || !stopLat || !stopLng) return res.status(400).json({ error: 'routeId, stopLat, stopLng required' });

    const locations = await BusLocation.find({
      updatedAt: { $gte: new Date(Date.now() - 120000) }
    }).populate('bus');

    const busesOnRoute = locations.filter(l => l.bus?.route?.toString() === routeId);

    const etas = busesOnRoute.map(l => {
      const dist = getDistance(l.lat, l.lng, parseFloat(stopLat), parseFloat(stopLng));
      const speed = Math.max(l.speed || 20, 10);
      const minutes = Math.round((dist / speed) * 60);
      return {
        busId: l.bus?._id,
        busNumber: l.bus?.busNumber,
        distance: Math.round(dist * 1000) / 1000,
        etaMinutes: minutes,
        lat: l.lat,
        lng: l.lng
      };
    });

    etas.sort((a, b) => a.etaMinutes - b.etaMinutes);
    res.json(etas);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/push/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: 'subscription required' });

    const User = require('../models/User');
    req.user.pushSubscription = JSON.stringify(subscription);
    await req.user.save();
    res.json({ message: 'Subscribed for push notifications' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/push/unsubscribe', auth, async (req, res) => {
  try {
    req.user.pushSubscription = null;
    await req.user.save();
    res.json({ message: 'Unsubscribed from push notifications' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
