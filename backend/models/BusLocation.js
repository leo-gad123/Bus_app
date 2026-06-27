const mongoose = require('mongoose');

const busLocationSchema = new mongoose.Schema({
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: { type: Number, default: 0 },
  heading: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

busLocationSchema.index({ bus: 1 });
busLocationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 300 });

module.exports = mongoose.model('BusLocation', busLocationSchema);
