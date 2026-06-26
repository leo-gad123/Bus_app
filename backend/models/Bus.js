const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true, unique: true },
  busNumber: { type: String, required: true },
  capacity: { type: Number, required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bus', busSchema);
