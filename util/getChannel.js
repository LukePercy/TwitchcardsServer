const Channel = require('../models/Channel');

const getChannel = async (id) => {
  try {
    const channel = await Channel.findOne({ channelId: id });
    if (!channel) {
      console.log('Channel Not Found!!');
      return;
    }
    return channel;
  } catch (error) {
    throw new Error(`Error message: ${error.message}`);
  }
};

module.exports = getChannel;
