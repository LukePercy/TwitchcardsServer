const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const Viewer = require('../models/Viewer');

// Migrate all viewers to the viewers property of the Channel's by ChannelId
router.get('/:id', async (req, res) => {
  const addedViewerIds = [];

  try {
    // Find the Channel
    const channel = await Channel.findOne({ channelId: req.params.id });

    // Stringify the viewer Ids (being persisted as an ObjectId in MongoDB)
    const strigifiedViewerIdsArray = channel.viewers.map((channelViewer) =>
      JSON.stringify(channelViewer)
    );

    // Find all viewers in db
    const viewers = await Viewer.find();

    if (!channel || !viewers) {
      return res.json({
        success: false,
        msg: 'The channel or the viewers were not found.',
      });
    }

    viewers.forEach((viewer) => {
      if (!strigifiedViewerIdsArray.includes(JSON.stringify(viewer._id))) {
        // Just log which id has been added to the channel
        addedViewerIds.push(viewer._id);
        console.log(
          `viewer._id: ${JSON.stringify(
            viewer._id
          )} has been pushed to the channel:>>> ${channel.displayName}`
        );

        // If the viewer._id is not in the Channel.viewers[],
        // then push the id in the channel.viewers
        channel.viewers.push(viewer._id);

        // Save into db.
        channel.save();
      } else {
        console.log(
          `viewer._id: ${JSON.stringify(
            viewer._id
          )} has existed in the channel ${channel.displayName} already`
        );
      }
    });

    return res.status(200).json({
      success: true,
      message: addedViewerIds.length
        ? `Viewer Ids: ${addedViewerIds} have been added to the Channel`
        : `No viewer Id has been added to the Channel`,
      data: {
        channel,
        viewers,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
});

module.exports = router;
