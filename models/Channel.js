const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const findOrCreate = require('mongoose-findorcreate');

const ChannelSchema = new Schema({
  channelId: String,
  displayName: String,
  type: String,
  accessToken: String,
  refreshToken: String,
  viewers: [{ type: Schema.Types.ObjectId, ref: 'Viewer' }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ChannelSchema.plugin(findOrCreate);

module.exports = mongoose.model('Channel', ChannelSchema);
