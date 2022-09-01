const express = require("express");
const session = require("express-session");
const MemoryStore = require("memorystore")(session);
const helmet = require("helmet");
const dotenv = require("dotenv");
const cors = require("cors");
var passport = require("passport");
var OAuth2Strategy = require("passport-oauth").OAuth2Strategy;
const fetch = require("node-fetch");
const ComfyJS = require("comfy.js");

const connectDB = require("./config/db-connect");
const slides = require("./cardList/CardList");
const Viewer = require("./models/Viewer");
const Channel = require("./models/Channel");
const authMiddleware = require("./middleware/auth");
const getChannel = require("./util/getChannel");

// Load env vars
dotenv.config({ path: "./config/config.env" });

// Connect to database;
connectDB();

// Route files
const OAuthTwitch = require("./routes/oauth-twitch");
const channels = require("./routes/channels");
const viewers = require("./routes/viewers");
const migration = require("./routes/migration");

const PORT = process.env.PORT || 3003;

const app = express();
app.use(helmet());

// ================= Passport Config ================= //
// Define our constants, you will change these with your own
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL; // You can run locally with - http://localhost:3000/auth/twitch/callback

app.use(
  session({
    cookie: { maxAge: 86400000 }, // count in milliseconds
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Override passport profile function to get user profile from Twitch API
OAuth2Strategy.prototype.userProfile = async function (accessToken, done) {
  const options = {
    method: "GET",
    headers: {
      "Client-ID": TWITCH_CLIENT_ID,
      Accept: "application/vnd.twitchtv.v5+json",
      Authorization: "Bearer " + accessToken,
    },
  };

  try {
    const response = await fetch("https://api.twitch.tv/helix/users", options);
    const body = await response.json();
    done(null, body);
  } catch (error) {
    console.log("Error Message:", error.message);
    done(body);
  }
};

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(
  "twitch",
  new OAuth2Strategy(
    {
      authorizationURL: "https://id.twitch.tv/oauth2/authorize",
      tokenURL: "https://id.twitch.tv/oauth2/token",
      clientID: TWITCH_CLIENT_ID,
      clientSecret: TWITCH_SECRET,
      callbackURL: CALLBACK_URL,
      state: true,
    },
    function (accessToken, refreshToken, profile, done) {
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;
      const { id, display_name, type } = profile.data[0];
      // Define a "options" object and set an attrib 'upsert = true'
      // then the document will be updated if it's already existed.
      // Referring to this post: https://stackoverflow.com/questions/60393424/mongoose-unable-to-create-more-than-4-fields-using-findorcreate
      const options = {
        upsert: true,
      };
      // Securely store user profile in your DB
      Channel.findOrCreate(
        { channelId: id },
        {
          displayName: display_name,
          type,
          accessToken,
          refreshToken,
        },
        options,
        // The "created" param below indicates if this doc is newly created or not
        // May be useful in the sometime, so leave it here.
        function (err, channel, created) {
          if (err) return done(err);

          return done(null, channel);
        }
      );
    }
  )
);

// This allows us to access the body of POST/PUT
// requests in our route handlers (as req.body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bypass the CORS error
const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: [
    "Access-Control-Allow-Origin",
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  // credentials: true
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

// This route is only used for viewers' db migration
app.use("/api/migration", migration);
// Mount routes
app.use("/api/channels", channels);
app.use("/api/viewers", viewers);
app.use("/api", OAuthTwitch);

//comfy
const twitchUser = process.env.TWITCH_USER;
const clientId = process.env.TWITCH_CLIENT_ID;
// Get the Channel Id from db for now
const channelId = process.env.CHANNEL_ID;
let TwitchOAuthAccessToken = "";

// Use IIFE (Immediately-Invoked Function Express) to
// retrieve the OAuth Access Token and assign it to
// TwitchOAuthAccessToken for initialising ComfyJS as well as
// for sending back to the Frontend when '/api/authinfo' being hit
(async () => {
  const channelInfo = await getChannel(channelId);
  TwitchOAuthAccessToken = channelInfo.accessToken;

  if (TwitchOAuthAccessToken) {
    ComfyJS.Init(twitchUser, TwitchOAuthAccessToken);
    console.log("ComfyJS initialised successfully");
  } else {
    throw new Error("OAuth Token not found, ComfyJS failed to initialise!!");
  }
})();

app.get("/api/authinfo", authMiddleware, async (req, res) => {
  if (TwitchOAuthAccessToken) {
    return res.status(200).json({
      success: true,
      data: { token: TwitchOAuthAccessToken, channelId },
      message: null,
    });
  } else {
    return res.status(404).json({
      success: false,
      data: null,
      message: "OAuth Access Token not found!",
    });
  }
});

// ================= ComfyJS Config ================= //
// On command API - to add the custom reward
ComfyJS.onCommand = async (user, command, message, flags, extra) => {
  if (command === "cardrewardcreate") {
    let customReward = await ComfyJS.CreateChannelReward(clientId, {
      title: "Unlock Trading Card",
      prompt:
        "Unlock a random Getting Dicey Trading Card and check your collection panel below the stream",
      cost: 1,
      is_enabled: true,
      background_color: "#00E5CB",
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
    try {
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
        });
        if (!targetedCard) {
          const updateHoldingCard = {
            cardId: randomCard.id,
            cardName: randomCard.title,
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
        response = await viewer.save();
      } else {
        try {
          // If it's false, then create a new viewer and
          // create the amount of holding cards for the viewer
          const responseFromCreateNewViewer = Viewer.findOrCreate({
            viewerId: userId,
            viewerName: username,
            holdingCards: [
              {
                cardId: randomCard.id,
                cardName: randomCard.title,
                holdingAmount: updateAmount,
              },
            ],
          });
          const response = await responseFromCreateNewViewer;
          // TODO: Need to test this part locally
          // Then get the newly created viewer's _id
          const dbchannelId = await getChannel(CHANNEL_ID);
          // and add it into the channel's Channel.viewers[].
          dbchannelId.viewers.push(response._id);
          // Finally, save it into db
          dbchannelId.save();
        } catch (error) {
          throw new Error(`Error Message: ${error.message}`);
        }
      }
    } catch (error) {
      throw new Error(`Error Message: ${error.message}`);
    }
  }
  if (response) {
    ComfyJS.Say(
      `${user} unlocked a new ${randomCard.title} card! ${randomCard.emote}`
    );
  }
};

// Listen the server
const server = app.listen(
  PORT,
  console.log(
    `The server is running in ${process.env.NODE_ENV} mode on port ${PORT} 🚀🚀🚀`
  )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (error, promise) => {
  console.log(`[Error]: ${error.message}`);

  // Close the server and exit the process
  // if there is any error caught
  server.close(() => process.exit(1));
});
