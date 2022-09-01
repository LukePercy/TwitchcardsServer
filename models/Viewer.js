const mongoose = require("mongoose");
const { Schema } = mongoose;
const findOrCreate = require("mongoose-findorcreate");

const CardSchema = new Schema({
  cardId: Number,
  cardName: String,
  holdingAmount: Number,
});

const ViewerSchema = new Schema({
  _id: Schema.Types.ObjectId,
  viewerId: {
    type: String,
    required: true,
    unique: true,
  },
  viewerName: {
    type: String,
  },
  holdingCards: [CardSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ViewerSchema.plugin(findOrCreate);

module.exports = mongoose.model("Viewer", ViewerSchema);
