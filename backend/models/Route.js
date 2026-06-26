const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startLocation: { type: String, required: true },
  endLocation: { type: String, required: true },
  stops: [{ name: String, order: Number, fare: Number }],
  baseFare: { type: Number, required: true },
  distance: { type: Number },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Route', routeSchema);
