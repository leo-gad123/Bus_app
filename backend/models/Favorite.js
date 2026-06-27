const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  label: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

favoriteSchema.index({ user: 1, route: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
