const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  cardId: Number,
  cardName: String,
  holdingAmount: Number,
});

const ViewerSchema = new mongoose.Schema({
  viewerId: {
    type: String,
    required: true,
    unique: true,
  },
  viewerName: {
    type: String,
  },
  holdingCards: [CardSchema],
  jwtToken: String,
  jwtTokenExpire: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Viewer', ViewerSchema);
