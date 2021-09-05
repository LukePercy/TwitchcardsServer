const mongoose = require('mongoose');

const ViewerSchema = new mongoose.Schema({
  viewerId: {
    type: String,
    required: true,
  },
  viewerName: {
    type: String,
  },
  cardId: {
    type: Number,
    min: 1,
  },
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
