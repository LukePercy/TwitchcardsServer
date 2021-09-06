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
    const viewer = await Viewer.findOne({ viewerId: req.params.id });

    if (!viewer) {
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

// Update a single viewer by ID
router.put('/:id', async (req, res) => {
  try {
    const { cardId, updateAmount } = req.body;

    const viewer = await Viewer.findOne({ viewerId: req.params.id });

    if (!viewer) {
      return res.status(400).json({
        success: false,
        msg: 'The updating viewer not found.',
      });
    }

    viewer.holdingCards.forEach((card) => {
      if (card.cardId === cardId) {
        card.holdingAmount += updateAmount;
      }
    });

    viewer.updatedAt = new Date().toISOString();

    viewer.save();

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

module.exports = router;
