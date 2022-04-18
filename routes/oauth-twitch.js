const express = require('express');
const passport = require('passport');
const handlebars = require('handlebars');

const router = express.Router();

// Set route to start OAuth link, this is where you define scopes to request
router.get(
  '/auth/twitch',
  passport.authenticate('twitch', {
    scope:
      'channel:manage:redemptions channel:read:redemptions user:read:email chat:edit chat:read',
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
              OAuth Token Generated!
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
                <p>Your OAuth Token has been generated successfully.</p>
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
    res.send(template());
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

module.exports = router;
