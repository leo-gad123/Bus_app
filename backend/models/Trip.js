const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  passengerCount: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 }
});

module.exports = mongoose.model('Trip', tripSchema);
