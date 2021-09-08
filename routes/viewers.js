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
    const { cardId, cardName, updateAmount } = req.body;

    const viewer = await Viewer.findOne({ viewerId: req.params.id });

    if (!viewer) {
      return res.status(400).json({
        success: false,
        msg: 'The updating viewer not found.',
      });
    }

    const { holdingCards } = viewer;
    let targetedCardIndex = 0;
    // Find the card whose ID matched
    const targetedCard = holdingCards.find((card, index) => {
      if (card.cardId === cardId) {
        targetedCardIndex = index;
        return card;
      }
    });

    // If the card ID doesn't exist
    // create a new card object
    if (!Object.keys(targetedCard).length) {
      const updateHoldingCards = [
        ...holdingCards,
        {
          cardId,
          cardName,
          holdingAmount: updateAmount,
        },
      ];
      holdingCards = updateHoldingCards;
    }
    // If the card ID exists,
    // update the card holding amount
    holdingCards[targetedCardIndex] = {
      ...targetedCard,
      holdingAmount: updateAmount,
    };
    // update the update time
    viewer.updatedAt = new Date().toISOString();
    // save the changes to db
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
