const express = require('express');
const passport = require('passport');
const fetch = require('node-fetch');
const handlebars = require('handlebars');
const nodeCron = require('node-cron');
const open = require('open');

const Channel = require('./../models/Channel');

const router = express.Router();
const validateUrl = 'https://id.twitch.tv/oauth2/validate';
const refreshTokenUrl = 'https://id.twitch.tv/oauth2/token';
const openNewTabUrl = 'http://localhost:3003/api/auth/twitch/refresh-config';

// Hard-coded the Channel Id temporarily in env file
const CHANNEL_ID = process.env.CHANNEL_ID;
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET = process.env.TWITCH_SECRET;
const GRANTED_SCOPE =
  'channel:manage:redemptions channel:read:redemptions user:read:email chat:edit chat:read';

// Create the cron job callback function
const validateAccessToken = async () => {
  console.log('Running every hour');

  let accessToken;
  let refreshToken;

  try {
    // Find the right Channel in db
    const channel = await Channel.findOne({ channelId: CHANNEL_ID });

    if (!channel) {
      console.log('Channel Not Found!!');
      return;
    }

    accessToken = channel.accessToken;
    refreshToken = channel.refreshToken;
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }

  const validateTokenOptions = {
    method: 'GET',
    headers: {
      Authorization: `OAuth ${accessToken}`,
    },
  };

  const refreshTokenOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: GRANTED_SCOPE,
    }),
  };

  try {
    // Check the Access Token Validation
    const response = await fetch(validateUrl, validateTokenOptions);
    const validatedResult = await response.json();
    // If the token is invalid
    if (validatedResult.status && validatedResult.status === 401) {
      // Use refresh token to query a new access token
      const refreshTokenResponse = await fetch(
        refreshTokenUrl,
        refreshTokenOptions
      );
      const refreshTokenResult = await refreshTokenResponse.json();

      if (refreshTokenResult.access_token && refreshTokenResult.refresh_token) {
        const { access_token, refresh_token } = refreshTokenResult;

        const filter = { channelId: CHANNEL_ID };
        const update = {
          accessToken: access_token,
          refreshToken: refresh_token,
        };
        // After the access token is refreshed,
        // then need to update the Channel.accessToken in DB.
        const updatedChannel = await Channel.findOneAndUpdate(filter, update);
        console.log('updatedChannel :>> ', updatedChannel);

        // Open a new tab in the default browser to show users
        // Access Token Refreshed Message.
        await open(openNewTabUrl, (err) => {
          console.log('err :>> ', err);
        });
      }
    } else if (validatedResult.login) {
      // The expires_in value indicates how long, in second, the token is valid for.
      const { expires_in } = validatedResult;
      // Convert seconds into hours
      const hours = expires_in / 3600;
      const hoursString = hours.toFixed();
      console.log(
        `The Channel Access Token is still valid, but will be expires in ${hoursString} hour(s)`
      );
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

// Schedule a cron job - run this in very 10 seconds just for testing
// need to change the interval (one hour) before pushing to prod.
const job = nodeCron.schedule('0 * * * *', validateAccessToken);

job.start();

// TODO:
// 1) Find a way to pass the ChannelID
// 2) Tidy up the big chunk of validateAccessToken()
// 3) Think about when to stop the cron job

// Set route to start OAuth link, this is where you define scopes to request
router.get(
  '/auth/twitch',
  passport.authenticate('twitch', {
    scope: GRANTED_SCOPE,
  })
);

// Set route for OAuth redirect
router.get(
  '/auth/twitch/callback',
  passport.authenticate('twitch', {
    successRedirect: '/api/auth/twitch/config',
    failureRedirect: '/api/auth/twitch/config',
  })
);

// Define a simple template to safely generate HTML with values from user's profile
const template = handlebars.compile(`
<html>
  <head>
    <title>Twitch Auth Access Token</title>
  </head>
  <body style="padding-top: 20px">
    <div style="width: 600px; margin: auto">
      <table
      class="table"
      style="
        font-family: Arial, Helvetica, sans-serif;
        border-collapse: collapse;
        width: 100%;
      "
      >
        <tbody>
          <tr>
            <th
              style="
                padding: 12px;
                text-align: center;
                background-color: #800080;
                color: white;
                border-radius: 5px 5px 0 0;
                font-size: large;
              "
            >
              OAuth Token {{title}}!
            </th>
          </tr>
          <tr>
            <td
              style="
                border-radius: 0 0 5px 5px;
                background-color: #f2f2f2;
                padding: 8px;
              "
            >
              <div style="margin: auto 15%">
                <p>Your OAuth Token has been {{ text }} successfully.</p>
                <p>You can close this tab now.</p>
                <br />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>
`);

// If user has an authenticated session, display it, otherwise display link to authenticate
router.get('/auth/twitch/config', function (req, res) {
  if (req.session && req.session.passport && req.session.passport.user) {
    res.send(template({ title: 'Generated', text: 'generated' }));
  } else {
    res.send(
      `<html>
        <head>
          <title>Twitch Auth Sample</title>
        </head>
        <a href="/api/auth/twitch">
          <p>Get Twitch Access Token</p>
        </a>
      </html>
    `
    );
  }
});

router.get('/auth/twitch/refresh-config', function (req, res) {
  res.send(template({ title: 'Refreshed', text: 'refreshed' }));
});

module.exports = router;
