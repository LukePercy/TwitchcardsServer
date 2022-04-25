const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');

// Get a single Channel Info by Id
router.get('/:id', async (req, res) => {
  try {
    const channel = await Channel.findOne({ channelId: req.params.id })
      .populate('viewers') // Fetch all viewers that are attached to the channel
      .exec();

    if (req.method === 'OPTION') {
      res.send(200);
    }

    if (!channel) {
      return res.json({
        success: false,
        msg: 'The channel was not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: channel,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
});

module.exports = router;
