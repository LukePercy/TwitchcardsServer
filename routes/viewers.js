const express = require('express');
const router = express.Router();
const Viewer = require('../models/Viewer');

// Get all viewers
router.get('/', async (req, res, next) => {
  try {
    const viewers = await Viewer.find();

    res.status(200).json({
      success: true,
      data: viewers,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

// Get a single viewer by ID
router.get('/:id', async (req, res) => {
  try {
    const viewer = await Viewer.find({ viewerId: req.params.id });

    if (!viewer.length) {
      return res.status(400).json({
        success: false,
        msg: 'The querying viewer not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: viewer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

// Create a new viewer
router.post('/', async (req, res) => {
  try {
    const newViewer = await Viewer.create(req.body);

    res.status(201).json({
      success: true,
      data: newViewer,
    });
  } catch (error) {
    res.status(400).json({ success: false });
  }
});

// Delete a single viewer by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleteViewer = await Viewer.deleteOne({ viewerId: req.params.id });

    if (!deleteViewer.length) {
      return res.status(400).json({
        success: false,
        msg: 'The deleting viewer not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(400).json({ success: false });
  }
});
module.exports = router;
