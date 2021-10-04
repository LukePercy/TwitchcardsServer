const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db-connect');

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


// app.use(function(req, res, next) {
//   let oneof = false;
//   console.log(`req.headers ==>`, req.headers)
//   if(req.headers.origin) {
//     console.log('origin added')
//       res.header('Access-Control-Allow-Origin', req.headers.origin);
//       oneof = true;
//   }
//   if(req.headers['access-control-request-method']) {
//     console.log('method added')
//       res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
//       oneof = true;
//   }
//   if(req.headers['access-control-request-headers']) {
//     console.log('request header added')
//       res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
//       oneof = true;
//   }
//   if(oneof) {
//     console.log(oneof)
//       res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
//   }
//  console.log('final oneof',oneof)

//   // intercept OPTIONS method
//   if (oneof) {
//     console.log(`before response`)
//     return res.send(200);
//   }
//   else {
//     console.log(`after response`)
//       next();
//   }
// });

// Bypass the CORS error
app.use(
  cors({
    methods: ['GET', 'PUT', 'POST'],
    origin: ['https://42xd9tib4hce93bavmhmseapyp7fwj.ext-twitch.tv/', /twitch\.tv$/,/ext-twitch\.tv$/],
    headers: {'Access-Control-Allow-Origin': 'https://42xd9tib4hce93bavmhmseapyp7fwj.ext-twitch.tv/'},
  })
);

app.options('*', cors());

// Mount routes
app.use('/api/viewers', viewer);

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
