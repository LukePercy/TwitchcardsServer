const express = require('express');
const router = express.Router();
const Viewer = require('../models/Viewer');
const authMiddleware = require('../middleware/auth');

// Get all viewers - testing purpose
router.get('/', async (req, res, next) => {
  try {
    const viewers = await Viewer.find();

    res.status(200).json({
      success: true,
      data: viewers,
    });
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
});

// Get a single viewer by ID
router.get('/:id', async (req, res, next) => {
  try {
    const viewer = await Viewer.findOne({ viewerId: req.params.id });

    if (!viewer) {
        res.json({
        success: false,
        msg: 'The querying viewer not found.',
      });
      next();
    }

    res.status(200).json({
      success: true,
      data: viewer,
    });
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
});

// Update a single viewer by ID
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { cardId, cardName, updateAmount } = req.body;
    const viewer = await Viewer.findOne({ viewerId: req.params.id });

    if (!viewer) {
        res.json({
        success: false,
        msg: 'The updating viewer not found.',
      });
      next();
    }

    let targetedCardIndex = 0;
    const { holdingCards } = viewer;
    // Find the card whose ID matched
    const targetedCard = holdingCards.find((card, index) => {
      if (card.cardId === cardId) {
        targetedCardIndex = index;
        return card;
      }
    });
    // If the card ID doesn't exist
    // create a new card object
    if (!targetedCard) {
      const updateHoldingCard = {
        cardId,
        cardName,
        holdingAmount: updateAmount,
      };
      holdingCards.push(updateHoldingCard);
    } else {
      // If the card ID exists,
      // update the card holding amount
      holdingCards[targetedCardIndex].holdingAmount =
        targetedCard.holdingAmount + updateAmount;
    }

    // update the updated time
    viewer.updatedAt = new Date().toISOString();
    // save the changes to db
    viewer.save();

    res.status(200).json({
      success: true,
      data: viewer,
    });
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
});

// Create a new viewer
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const newViewer = await Viewer.create(req.body);

    res.status(201).json({
      success: true,
      data: newViewer,
    });
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      msg: error.message,
    });
  }
});

module.exports = router;
