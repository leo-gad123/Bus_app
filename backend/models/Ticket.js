const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  qrCode: { type: String, required: true },
  qrSecret: { type: String, required: true },
  fare: { type: Number, required: true },
  status: { type: String, enum: ['active', 'used', 'expired', 'cancelled'], default: 'active' },
  usedAt: { type: Date },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
