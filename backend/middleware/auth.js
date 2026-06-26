const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid token' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const adminAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user && req.user.role === 'admin') return next();
    res.status(403).json({ error: 'Admin access required' });
  });
};

const driverAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user && (req.user.role === 'driver' || req.user.role === 'admin')) return next();
    res.status(403).json({ error: 'Driver access required' });
  });
};

module.exports = { auth, adminAuth, driverAuth };
