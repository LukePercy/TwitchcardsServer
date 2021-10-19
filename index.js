const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db-connect');
const ComfyJS = require('comfy.js');
const slides = require('./cardList/CardList');
const Viewer = require('./models/Viewer');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database;
connectDB();

// Route files
const viewer = require('./routes/viewers');

const PORT = process.env.PORT || 3003;

const app = express();

// This allows us to access the body of POST/PUT
// requests in our route handlers (as req.body)
app.use(express.json());
app.use(express.urlencoded());


// Bypass the CORS error
const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: ["Access-Control-Allow-Origin", "Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  // credentials: true
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// app.use(cors());

// Mount routes
app.use('/api/viewers', viewer);

//comfy
const channel = process.env.TWITCH_USER;
const clientId =  process.env.CLIENTID;
const twitchAuth = process.env.TWITCH_OAUTH;

  // On command API - to add the custom reward
  ComfyJS.onCommand = async (user, command, message, flags, extra) => {
  if (command === 'cardrewardcreate') {
    let customReward = await ComfyJS.CreateChannelReward(clientId, {
      title: 'Unlock Trading Card',
      prompt: 'Unlock a random Getting Dicey Trading Card and check your collection panel below the stream',
      cost: 250,
      is_enabled: true,
      background_color: '#00E5CB',
      is_user_input_required: false,
      is_max_per_stream_enabled: false,
      max_per_stream: 0,
      is_max_per_user_per_stream_enabled: false,
      max_per_user_per_stream: 0,
      is_global_cooldown_enabled: true,
      global_cooldown_seconds: 10,
      should_redemptions_skip_request_queue: true,
    });
    if (customReward) {
    ComfyJS.Say(`Trading Card Reward Created!`);
    }
  }
};

ComfyJS.onReward = async (user, reward, cost, message, extra) => {
  const { rewardFulfilled, userId, username } = extra;
  let randomCard = slides[Math.floor(Math.random() * slides.length)];
  let response = false;
  let updateAmount = 1;

  if (rewardFulfilled) {
    const viewer = await Viewer.findOne({ viewerId: userId });
    // Check if the viewer has been stored in db already
    // If true, then update the amount of holding cards for the viewer
    if (viewer) {
      let targetedCardIndex = 0;
      const { holdingCards } = viewer;
      
      // Find the card whose ID matched
      const targetedCard = holdingCards.find((card, index) => {
        if (card.cardId === randomCard.id) {
          targetedCardIndex = index;
          return card;
        }
      }
      )
      console.log(`targetedCard`, targetedCard);
      if (!targetedCard) {
        const updateHoldingCard = {
          cardId: randomCard.id,
          cardName: randomCard.title,
          holdingAmount: updateAmount,
        };
        holdingCards.push(updateHoldingCard);
        console.log(`holdingCards`, holdingCards)
      } else {
        // If the card ID exists,
        // update the card holding amount
        holdingCards[targetedCardIndex].holdingAmount =
        targetedCard.holdingAmount + updateAmount;
      }
      // update the updated time
      viewer.updatedAt = new Date().toISOString();
      // save the changes to db
      response = viewer.save();      
    } else {
      response = await Viewer.create({
        viewerId: userId,
        viewerName: username,
        holdingCards: [{
          cardId: randomCard.id,
          cardName: randomCard.title,
          holdingAmount: updateAmount}],
      });
    }
  }
  if (response) {
    ComfyJS.Say(`${user} unlocked a new ${randomCard.title} card!`);
  }
};

ComfyJS.Init(channel, twitchAuth);

// Listen the server
const server = app.listen(
  PORT,
  console.log(
    `The server is running in ${process.env.NODE_ENV} mode on port ${PORT} 🚀🚀🚀`
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (error, promise) => {
  console.log(`[Error]: ${error.message}`);

  // Close the server and exit the process
  // if there is any error caught
  server.close(() => process.exit(1));
});
